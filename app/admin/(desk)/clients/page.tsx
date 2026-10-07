import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { domainTitle, inviteClient, listStaff, requireStaff, requireSuper, type Client } from "@/lib/admin";
import { EMAIL_RE, ProjectFields, projectFields } from "./fields";
import { AddPanel, Empty, PageHeader, fmtTime, input, label, plural } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Clients" };

// Adds a project. A new email = a new client (and a portal invite); an existing email adds to that client
// and keeps its name, so one login sees all their projects.
async function addProject(formData: FormData) {
  "use server";
  await requireSuper();
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 320);
  if (!EMAIL_RE.test(email)) throw new Error("A valid client email is required");
  const { data: existing } = await supabase.from("clients").select("name").eq("email", email).limit(1).maybeSingle<{ name: string }>();
  const name = existing?.name ?? String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) throw new Error("Client name is required");

  const { data, error } = await supabase.from("clients").insert({ name, email, ...projectFields(formData) }).select("id").single();
  if (error) throw new Error(`Project save failed: ${error.message}`);
  if (!existing) await inviteClient(email); // Clerk login with role "client"
  revalidatePath("/admin", "layout");
  redirect(`/admin/clients/${data.id}`); // straight to the project page with portal access
}

type Last = { client_id: number; author_id: string | null; body: string; created_at: string };

export default async function ClientsPage() {
  const me = await requireStaff();
  let q = supabase.from("clients").select("*").order("name");
  if (!me.isSuper) q = q.eq("admin_id", me.id);
  const [clientsRes, staff] = await Promise.all([q, listStaff()]);
  const clients = (clientsRes.data ?? []) as Client[];

  // ponytail: pulls every message for the visible clients to find the latest; a "latest message" view if threads get long
  const { data: msgs } = clients.length
    ? await supabase.from("messages").select("client_id, author_id, body, created_at").in("client_id", clients.map((c) => c.id)).order("created_at", { ascending: false })
    : { data: [] };
  const last = new Map<number, Last>();
  for (const m of (msgs ?? []) as Last[]) if (!last.has(m.client_id)) last.set(m.client_id, m);
  const waiting = clients.filter((c) => last.get(c.id) && !last.get(c.id)!.author_id).length;

  // Rows sharing an email are one client; each row is a project.
  const byClient = Object.values(Object.groupBy(clients, (c) => c.email)) as Client[][];

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${plural(byClient.length, "client")}, ${plural(clients.length, "project")}${waiting ? `. ${waiting} waiting on a reply, marked in orange` : ""}.`}
      />
      {clients.length === 0 ? (
        <Empty>{me.isSuper ? "No clients yet. Add one below and they get an invite to their portal." : "No projects assigned to you yet."}</Empty>
      ) : (
        <div className="space-y-10">
          {byClient.map((projects) => (
            <section key={projects[0].email}>
              <h3 className="flex flex-wrap items-baseline gap-x-3"><span className="font-display text-2xl tracking-tight">{projects[0].name}</span><span className="wrap-anywhere text-sm text-muted">{projects[0].email}</span></h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {projects.map((c) => {
                  const m = last.get(c.id);
                  return (
                    <li key={c.id}>
                      <Link href={`/admin/clients/${c.id}`} className="grid gap-x-8 gap-y-1 py-4 hover:bg-surface md:grid-cols-[1fr_2fr_auto] md:px-4">
                        <div className="min-w-0">
                          <p className="font-medium">{c.project}</p>
                          <p className="text-sm text-muted">{domainTitle(c.domain) ?? "No domain"} / {staff.find((s) => s.id === c.admin_id)?.name ?? "Unassigned"}</p>
                        </div>
                        <p className="line-clamp-2 wrap-anywhere text-sm text-muted">{m ? `${m.author_id ? "Team: " : ""}${m.body}` : "No messages yet"}</p>
                        {m && (
                          <span className={`self-start font-mono text-xs ${m.author_id ? "text-muted" : "rounded-full bg-accent px-2 py-0.5 text-on-accent"}`}>
                            {fmtTime(m.created_at)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      {me.isSuper && (
        <AddPanel title="Add client or project" action={addProject}>
          <label className={label}>Client email (their login)<input name="email" type="email" required className={input} /></label>
          <label className={label}>Client name (ignored if the email exists)<input name="name" maxLength={200} className={input} /></label>
          <ProjectFields staff={staff} />
        </AddPanel>
      )}
    </>
  );
}
