import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { domainTitle, requireStaff, type Client } from "@/lib/admin";
import { Empty, PageHeader, fmtTime, plural } from "@/app/admin/ui";
import type { Todo } from "./todos/TodoList";

export const metadata: Metadata = { title: "Overview" };

type Msg = { client_id: number; author_id: string | null; body: string; created_at: string };
type Activity = { id: number; client_id: number; kind: "joined" | "visit" | "message" | "upload"; created_at: string };

const DID = { joined: "joined the portal", visit: "opened the portal", message: "sent a message", upload: "opened the upload folder" };

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

// Landing page for every staff member: what is waiting on them, newest first.
export default async function OverviewPage() {
  const me = await requireStaff();
  let projectsQ = supabase.from("clients").select("*");
  let suggestedQ = supabase.from("todos").select("id", { count: "exact", head: true }).eq("status", "suggested");
  if (!me.isSuper) {
    projectsQ = projectsQ.eq("admin_id", me.id);
    suggestedQ = suggestedQ.eq("assignee_id", me.id);
  }
  const weekAgo = daysAgo(7);
  const [projectsRes, todosRes, suggested, testimonials, inquiries] = await Promise.all([
    projectsQ,
    supabase.from("todos").select("*").eq("status", "open").eq("assignee_id", me.id).order("created_at", { ascending: false }).limit(6),
    suggestedQ,
    me.isSuper ? supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("approved", false).eq("declined", false) : null,
    me.isSuper ? supabase.from("inquiries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo) : null,
  ]);
  const projects = (projectsRes.data ?? []) as Client[];
  const todos = (todosRes.data ?? []) as Todo[];
  const ids = projects.map((p) => p.id);
  const byId = new Map(projects.map((p) => [p.id, p]));

  // ponytail: reads every message of the visible projects to find each latest; a "latest message" view if threads grow
  const [msgRes, actRes] = ids.length
    ? await Promise.all([
        supabase.from("messages").select("client_id, author_id, body, created_at").in("client_id", ids).order("created_at", { ascending: false }),
        supabase.from("activity").select("id, client_id, kind, created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(8),
      ])
    : [{ data: [] }, { data: [] }];
  const latest = new Map<number, Msg>();
  for (const m of (msgRes.data ?? []) as Msg[]) if (!latest.has(m.client_id)) latest.set(m.client_id, m);
  const waiting = [...latest.values()].filter((m) => !m.author_id);
  const activity = (actRes.data ?? []) as Activity[];

  const summary = waiting.length
    ? `${plural(waiting.length, "client")} waiting on a reply.`
    : "No client is waiting on a reply.";

  return (
    <>
      <PageHeader title={`Hello, ${me.name.split(" ")[0]}.`} description={`${summary} ${plural(todos.length, "open todo")} on your list${suggested.count ? `, ${plural(suggested.count, "suggestion")} to review` : ""}.`} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-12">
          <section aria-labelledby="waiting-title">
            <h2 id="waiting-title" className="mb-4 font-display text-2xl tracking-tight">Waiting on a reply</h2>
            {waiting.length === 0 ? (
              <Empty>All caught up. New client messages show up here.</Empty>
            ) : (
              <ul className="space-y-3">
                {waiting.map((m) => {
                  const p = byId.get(m.client_id)!;
                  return (
                    <li key={m.client_id}>
                      <Link href={`/admin/clients/${p.id}`} className="group block rounded-2xl bg-surface p-5 transition-transform hover:-translate-y-0.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="font-medium">{p.name} <span className="font-normal text-muted">/ {p.project}</span></p>
                          <time dateTime={m.created_at} className="font-mono text-xs text-muted">{fmtTime(m.created_at)}</time>
                        </div>
                        <p className="mt-2 line-clamp-2 wrap-anywhere text-[15px] leading-relaxed text-muted">{m.body}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm text-accent">Reply <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="activity-title">
            <h2 id="activity-title" className="mb-4 font-display text-2xl tracking-tight">Recent client activity</h2>
            {activity.length === 0 ? (
              <Empty>Nothing yet. Portal visits, messages and uploads show up here.</Empty>
            ) : (
              <ol className="space-y-4 border-l border-line pl-5">
                {activity.map((a) => {
                  const p = byId.get(a.client_id);
                  return (
                    <li key={a.id} className="text-sm">
                      <Link href={`/admin/clients/${a.client_id}`} className="u-link font-medium">{p?.name}</Link>{" "}
                      <span className="text-muted">{DID[a.kind]} on {p?.project}</span>
                      <time dateTime={a.created_at} className="block font-mono text-xs text-muted">{fmtTime(a.created_at)}</time>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="todos-title" className="rounded-2xl bg-surface p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="todos-title" className="font-display text-xl tracking-tight">Your todos</h2>
              <Link href="/admin/todos" className="u-link text-sm text-muted hover:text-ink">All todos</Link>
            </div>
            {!!suggested.count && (
              <Link href="/admin/todos" className="mt-4 flex items-center gap-2 rounded-xl border border-accent/40 px-4 py-3 text-sm hover:border-accent">
                <Sparkles size={16} className="shrink-0 text-accent" /> {plural(suggested.count, "suggestion")} from client messages to review
              </Link>
            )}
            {todos.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing open. Add one from the Todos page.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {todos.map((t) => {
                  const p = t.client_id ? byId.get(t.client_id) : null;
                  return (
                    <li key={t.id} className="py-3 text-sm">
                      <p>{t.title}</p>
                      {p && <Link href={`/admin/clients/${p.id}`} className="u-link text-xs text-muted">{p.name} / {p.project}</Link>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="projects-title" className="rounded-2xl bg-surface p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="projects-title" className="font-display text-xl tracking-tight">{me.isSuper ? "Client projects" : "Your projects"}</h2>
              <Link href="/admin/clients" className="u-link text-sm text-muted hover:text-ink">All clients</Link>
            </div>
            <p className="mt-2 text-sm text-muted">
              {projects.length ? `${plural(projects.length, "project")} across ${plural(new Set(projects.map((p) => p.email)).size, "client")}.` : "No projects yet."}
            </p>
            {projects.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-2">
                {Object.entries(Object.groupBy(projects, (p) => domainTitle(p.domain) ?? "No domain")).map(([d, list]) => (
                  <span key={d} className="rounded-full border border-line px-3 py-1 text-xs">{d} <span className="text-muted">{list?.length}</span></span>
                ))}
              </p>
            )}
          </section>

          {me.isSuper && (
            <section aria-labelledby="site-title" className="rounded-2xl bg-surface p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="site-title" className="font-display text-xl tracking-tight">Website</h2>
                <Link href="/admin/site" className="u-link text-sm text-muted hover:text-ink">Open</Link>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/admin/site#testimonials" className="u-link">{plural(testimonials?.count ?? 0, "testimonial")} to review</Link></li>
                <li><Link href="/admin/site#inquiries" className="u-link">{plural(inquiries?.count ?? 0, "inquiry", "inquiries")} this week</Link></li>
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
