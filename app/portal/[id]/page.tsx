import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { ArrowLeft, ArrowUpRight, Send, Upload } from "lucide-react";
import { overLimit, supabase } from "@/lib/supabase";
import { suggestTodos } from "@/lib/suggest";
import { SITE_NAME } from "@/lib/site";
import { domainTitle } from "@/lib/admin";
import { fmtTime } from "@/lib/format";
import { logActivity, logVisit, myClients, portalUser, requirePortalClient } from "@/lib/portal";
import SubmitButton from "@/app/admin/SubmitButton";
import PortalHeader from "../PortalHeader";

export const metadata: Metadata = { title: "Your project" };

async function postMessage(id: number, formData: FormData) {
  "use server";
  const client = await requirePortalClient(id);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  if (!body) return;
  // Each message also costs a Gemini call, so cap the thread (staff replies count too).
  if (await overLimit("messages", "client_id", client.id, 30, 60)) throw new Error("Too many messages this hour. Please try again later.");
  const { error } = await supabase.from("messages").insert({ client_id: client.id, body });
  if (error) throw new Error("Couldn't send your message. Please try again.");
  after(async () => {
    await logActivity(client.id, "message", body.slice(0, 200));
    await suggestTodos(client, body).catch((e) => console.error("Todo suggestion failed:", e));
  });
  revalidatePath(`/portal/${id}`);
  revalidatePath("/admin", "layout");
}

export default async function PortalProject({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const client = await requirePortalClient(id);
  const [{ data }, all, { emails }, lead] = await Promise.all([
    supabase.from("messages").select("id, author_id, body, created_at").eq("client_id", id).order("created_at"),
    myClients(),
    portalUser(),
    client.admin_id ? clerkClient().then((c) => c.users.getUser(client.admin_id!)).catch(() => null) : null,
  ]);
  const messages = (data ?? []) as { id: number; author_id: string | null; body: string; created_at: string }[];
  const others = all.filter((c) => c.id !== id);
  after(() => logVisit(id));

  return (
    <main className="min-h-[100dvh] px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[1080px]">
        <PortalHeader email={emails[0]} />

        {others.length > 0 && (
          <Link href="/portal" className="u-link mt-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> All projects</Link>
        )}
        <div className={others.length ? "mt-6" : "mt-14"}>
          {client.domain && <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-on-accent">{domainTitle(client.domain)}</span>}
          <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">{client.project}</h1>
          <p className="mt-3 text-muted">Share files and write to the team. Replies show up here.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Conversation with the studio */}
          <section aria-labelledby="notes-title" className="rounded-2xl bg-surface">
            <h2 id="notes-title" className="border-b border-line px-6 py-4 font-display text-xl tracking-tight">Messages</h2>
            <div className="px-6 py-6">
              {messages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Nothing here yet. Start with your brief, feedback or a question below.</p>
              ) : (
                <ol className="space-y-3">
                  {messages.map((m) => (
                    <li key={m.id} className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.author_id ? "border border-line bg-paper" : "ml-auto bg-ink text-paper"}`}>
                      <p className={`text-xs ${m.author_id ? "text-muted" : "text-paper/70"}`}>{m.author_id ? SITE_NAME : "You"} / {fmtTime(m.created_at)}</p>
                      <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-[15px] leading-relaxed">{m.body}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <form action={postMessage.bind(null, id)} className="flex flex-col gap-3 border-t border-line px-6 py-5">
              <label className="flex flex-col gap-1 text-sm text-muted">
                Write to the team
                <textarea name="body" required rows={4} maxLength={5000} className="field text-ink" />
              </label>
              <div><SubmitButton pending="Sending…"><Send size={14} /> Send message</SubmitButton></div>
            </form>
          </section>

          <aside className="space-y-6">
            <section aria-labelledby="files-title" className="rounded-2xl bg-surface p-6">
              <h2 id="files-title" className="font-display text-xl tracking-tight">Files</h2>
              {client.drive_url ? (
                <>
                  <p className="mt-2 text-sm text-muted">Opens your shared Google Drive folder in a new tab. Add your files there.</p>
                  {/* Goes through /upload so the team sees when the folder was opened */}
                  <a href={`/portal/${id}/upload`} target="_blank" rel="noreferrer" className="btn btn-solid mt-5 w-full justify-center"><Upload size={16} /> Upload here</a>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">We&rsquo;re setting up your upload folder. The button appears here once it&rsquo;s ready.</p>
              )}
            </section>

            {lead && (
              <section aria-labelledby="lead-title" className="rounded-2xl bg-surface p-6">
                <h2 id="lead-title" className="font-display text-xl tracking-tight">Your contact</h2>
                <p className="mt-2 font-medium">{lead.fullName || lead.primaryEmailAddress?.emailAddress}</p>
                {typeof lead.publicMetadata?.title === "string" && lead.publicMetadata.title && <p className="text-sm text-muted">{lead.publicMetadata.title}</p>}
              </section>
            )}

            {others.length > 0 && (
              <section aria-labelledby="others-title" className="rounded-2xl bg-surface p-6">
                <h2 id="others-title" className="font-display text-xl tracking-tight">Other projects</h2>
                <ul className="mt-3 space-y-2">
                  {others.map((c) => (
                    <li key={c.id}>
                      <Link href={`/portal/${c.id}`} className="group flex items-center justify-between gap-3 text-sm">
                        <span className="u-link">{c.project}</span><ArrowUpRight size={14} className="text-muted group-hover:text-ink" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
