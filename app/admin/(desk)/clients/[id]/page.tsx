import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Send, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { domainTitle, getOrigin, inviteClient, inviteStatus, listStaff, requireClient, requireSuper, safeLink, type Client } from "@/lib/admin";
import { EMAIL_RE, ProjectFields, projectFields } from "../fields";
import { deleteClientAccount, deleteClientProject } from "@/lib/deletion";
import { statusChip, totals, STATUS_LABEL, type Invoice } from "@/lib/invoices";
import { fmtMoney } from "@/lib/format";
import ConfirmButton from "@/app/admin/ConfirmButton";
import SubmitButton from "@/app/admin/SubmitButton";
import CopyButton from "@/app/admin/CopyButton";
import { AddPanel, EditPanel, fmtTime, input, label } from "@/app/admin/ui";
import TodoList, { type Todo } from "../../todos/TodoList";

export const metadata: Metadata = { title: "Client project" };

type Message = { id: number; author_id: string | null; body: string; created_at: string };
type Activity = { id: number; kind: "joined" | "visit" | "message" | "upload"; detail: string | null; created_at: string };

const ACTIVITY = { joined: "Joined the portal", visit: "Opened the portal", message: "Sent a message", upload: "Opened the upload folder" };

// Project settings: super admins edit everything, the assigned admin only the Drive link.
// Each project has its own lead, so one client's projects can sit with different admins.
// Open and suggested todos on this project move with it to the new lead.
async function assignProject(id: number, formData: FormData) {
  "use server";
  await requireSuper();
  const { client } = await requireClient(id);
  const admin_id = String(formData.get("admin_id") ?? "") || null;
  if (admin_id === client.admin_id) return;
  const { error } = await supabase.from("clients").update({ admin_id }).eq("id", id);
  if (error) throw new Error(`Assign failed: ${error.message}`);
  let moved = supabase.from("todos").update({ assignee_id: admin_id }).eq("client_id", id).neq("status", "done");
  moved = client.admin_id ? moved.or(`assignee_id.eq."${client.admin_id}",assignee_id.is.null`) : moved.is("assignee_id", null);
  await moved;
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}

async function updateProject(id: number, formData: FormData) {
  "use server";
  const { me } = await requireClient(id);
  const fields = me.isSuper ? projectFields(formData) : { drive_url: safeLink(formData.get("drive_url")) };
  const { error } = await supabase.from("clients").update(fields).eq("id", id);
  if (error) throw new Error(`Project update failed: ${error.message}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}

// Name and email belong to the client, so they change on every project sharing the old email.
async function updateClientInfo(id: number, formData: FormData) {
  "use server";
  await requireSuper();
  const { client } = await requireClient(id);
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 320);
  if (!name) throw new Error("Client name is required");
  if (!EMAIL_RE.test(email)) throw new Error("A valid client email is required");
  const { error } = await supabase.from("clients").update({ name, email }).eq("email", client.email);
  if (error) throw new Error(`Client update failed: ${error.message}`);
  if (email !== client.email) await inviteClient(email); // new email = new login
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}

async function addProjectFor(id: number, formData: FormData) {
  "use server";
  await requireSuper();
  const { client } = await requireClient(id);
  const { data, error } = await supabase.from("clients").insert({ name: client.name, email: client.email, ...projectFields(formData) }).select("id").single();
  if (error) throw new Error(`Project save failed: ${error.message}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
  redirect(`/admin/clients/${data.id}`);
}

// Resend works for a lost email too: Clerk issues a fresh invitation.
async function resendInvite(id: number) {
  "use server";
  const { client } = await requireClient(id);
  await inviteClient(client.email);
  revalidatePath(`/admin/clients/${id}`);
}

// Archive first, then delete. A project takes its messages, activity and todos with it.
async function deleteProject(id: number) {
  "use server";
  const me = await requireSuper();
  const { client } = await requireClient(id);
  await deleteClientProject(me, id);
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
  // Back to a sibling project if one is left, else the list.
  const { data: next } = await supabase.from("clients").select("id").eq("email", client.email).limit(1).maybeSingle<{ id: number }>();
  redirect(next ? `/admin/clients/${next.id}` : "/admin/clients");
}

// The whole client: every project, their portal login and pending invites.
async function deleteClient(id: number) {
  "use server";
  const me = await requireSuper();
  const { client } = await requireClient(id);
  await deleteClientAccount(me, client.email);
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
  redirect("/admin/clients");
}

async function postReply(id: number, formData: FormData) {
  "use server";
  const { me } = await requireClient(id);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  if (!body) return;
  const { error } = await supabase.from("messages").insert({ client_id: id, author_id: me.id, body });
  if (error) throw new Error(`Reply failed: ${error.message}`);
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath(`/portal/${id}`);
}

// Two Clerk lookups, so it streams in after the rest of the page instead of holding it up.
async function PortalAccess({ id, email, portal }: { id: number; email: string; portal: string }) {
  const status = await inviteStatus(email);
  // Invite: Clerk emails the client a sign-up link; once joined they sign in at /portal
  return (
    <div className={`rounded-2xl bg-surface p-6 ${status === "joined" ? "" : "border border-accent/50"}`}>
      <h2 className="font-display text-lg tracking-tight">Portal access</h2>
      <p className="mt-2 text-sm">
        {status === "joined" ? "Joined. They sign in with " : status === "invited" ? "Invite sent, not joined yet: " : "Not invited yet: "}
        <span className="text-muted">{email}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {status !== "joined" && (
          <form action={resendInvite.bind(null, id)}>
            <SubmitButton pending="Sending…"><UserPlus size={14} /> {status === "invited" ? "Resend invite" : "Send invite"}</SubmitButton>
          </form>
        )}
        <CopyButton text={portal} label="Copy portal link" />
      </div>
    </div>
  );
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { me, client } = await requireClient(id);

  const [msgRes, todoRes, staff, actRes, origin, sibRes, invRes] = await Promise.all([
    supabase.from("messages").select("*").eq("client_id", id).order("created_at"),
    supabase.from("todos").select("*").eq("client_id", id).neq("status", "done").order("created_at", { ascending: false }),
    listStaff(),
    supabase.from("activity").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(100),
    getOrigin(),
    supabase.from("clients").select("*").eq("email", client.email).neq("id", id).order("project"),
    supabase.from("invoices").select("*").eq("client_id", id).order("issued_on", { ascending: false }),
  ]);
  const invoices = (invRes.data ?? []) as Invoice[];
  // Other projects of the same client; admins only see the ones assigned to them.
  const siblings = ((sibRes.data ?? []) as Client[]).filter((c) => me.isSuper || c.admin_id === me.id);
  const activity = (actRes.data ?? []) as Activity[];
  const messages = (msgRes.data ?? []) as Message[];
  const todos = (todoRes.data ?? []) as Todo[];
  const nameOf = (id: string | null) => (id ? staff.find((s) => s.id === id)?.name ?? "Former staff" : client.name);
  const portal = `${origin}/portal`;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/admin/clients" className="u-link inline-flex items-center gap-2 hover:text-ink"><ArrowLeft size={14} /> Clients</Link>
        <span aria-hidden>/</span><span className="truncate">{client.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{client.project}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            {client.domain && <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-on-accent">{domainTitle(client.domain)}</span>}
            <span className="wrap-anywhere">{client.name}, {client.email}</span>
            <span aria-hidden>/</span>
            <span>{client.admin_id ? `Handled by ${nameOf(client.admin_id)}` : "No admin assigned"}</span>
          </p>
          {siblings.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="text-muted">Other projects:</span>
              {siblings.map((c) => <Link key={c.id} href={`/admin/clients/${c.id}`} className="u-link">{c.project} ({c.admin_id ? nameOf(c.admin_id) : "unassigned"})</Link>)}
            </p>
          )}
        </div>
        {me.isSuper && (
          <form action={deleteProject.bind(null, id)}>
            <ConfirmButton message={`Delete the project "${client.project}"? Its messages, activity and todos are deleted. A copy goes to the archive.`} className="btn btn-ghost btn-sm"><Trash2 size={14} /> Delete project</ConfirmButton>
          </form>
        )}
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Thread: the client writes on the portal, staff reply here */}
        <div className="min-w-0 space-y-12">
        <section aria-labelledby="thread-title" className="rounded-2xl bg-surface">
          <h2 id="thread-title" className="border-b border-line px-6 py-4 font-display text-xl tracking-tight">Conversation</h2>
          <div className="px-6 py-6">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No messages yet. When {client.name} writes from the portal it shows up here, and Gemini suggests todos from it.</p>
            ) : (
              <ol className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.author_id ? "ml-auto bg-ink text-paper" : "border border-line bg-paper"}`}>
                    <p className={`text-xs ${m.author_id ? "text-paper/70" : "text-muted"}`}>{nameOf(m.author_id)} / {fmtTime(m.created_at)}</p>
                    <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-[15px] leading-relaxed">{m.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <form action={postReply.bind(null, id)} className="flex flex-col gap-3 border-t border-line px-6 py-5">
            <label className={label}>Reply to {client.name}<textarea name="body" required rows={3} maxLength={5000} className={input} /></label>
            <div><SubmitButton pending="Sending…"><Send size={14} /> Send reply</SubmitButton></div>
          </form>
        </section>

        <section aria-labelledby="todos-title">
          <h2 id="todos-title" className="mb-4 font-display text-xl tracking-tight">Open todos</h2>
          <TodoList todos={todos} me={me} staff={staff} clients={{ [id]: `${client.name} / ${client.project}` }} empty="No open todos for this project." />
        </section>
        </div>

        <aside className="space-y-6">
          {/* Project lead: per project, so the same client can have different admins on different projects */}
          <div className="rounded-2xl bg-surface p-6">
            <h2 className="font-display text-lg tracking-tight">Project lead</h2>
            {(() => {
              const lead = staff.find((s) => s.id === client.admin_id);
              return <p className="mt-2 text-sm">{lead ? <>{lead.name}{lead.title && <span className="text-muted"> / {lead.title}</span>}</> : client.admin_id ? "Former staff" : <span className="text-accent">No one assigned yet</span>}</p>;
            })()}
            {me.isSuper && (
              <form action={assignProject.bind(null, id)} className="mt-4 flex flex-col gap-3">
                <label className={label}>Assign this project to
                  <select name="admin_id" defaultValue={client.admin_id ?? ""} className={input}>
                    <option value="">Unassigned</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title && ` (${s.title})`}</option>)}
                  </select>
                </label>
                <div><SubmitButton pending="Assigning…">Assign</SubmitButton></div>
                <p className="text-xs text-muted">Only this project changes{siblings.length ? `; ${client.name}'s other projects keep their own leads` : ""}. Its open todos move to the new lead.</p>
              </form>
            )}
          </div>

          <Suspense fallback={<div className="h-40 rounded-2xl bg-ink/[0.05] motion-safe:animate-pulse" aria-label="Loading portal access" />}>
            <PortalAccess id={id} email={client.email} portal={portal} />
          </Suspense>

          {/* Everything the client did on the portal, newest first */}
          <div className="rounded-2xl bg-surface p-6">
            <h2 className="font-display text-lg tracking-tight">Client activity</h2>
            {activity.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nothing yet. Shows up once they sign in.</p>
            ) : (
              <ol className="mt-3 space-y-3 border-l border-line pl-4">
                {activity.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p>{ACTIVITY[a.kind]}</p>
                    {a.detail && <p className="line-clamp-2 wrap-anywhere text-muted">&ldquo;{a.detail}&rdquo;</p>}
                    <p className="font-mono text-xs text-muted">{fmtTime(a.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-lg tracking-tight">Invoices</h2>
              <Link href={`/admin/invoices/new?project=${id}`} className="u-link text-sm text-accent">New invoice</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet for this project.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-accent">
                      <span className="font-mono">{inv.number}</span>
                      <span className="flex items-center gap-2"><span className="font-mono tabular-nums">{fmtMoney(totals(inv.items, inv.tax_rate).total)}</span><span className={statusChip(inv.status)}>{STATUS_LABEL[inv.status]}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <h2 className="font-display text-lg tracking-tight">{me.isSuper ? "Project settings" : "Upload folder"}</h2>
            <p className="mt-2 truncate text-sm text-muted">{client.drive_url ?? "Not set: the portal hides the Upload button"}</p>
            <div className="mt-4">
              <EditPanel action={updateProject.bind(null, id)}>
                {me.isSuper ? <ProjectFields c={client} staff={staff} withLead={false} /> : (
                  <label className={`${label} col-span-full`}>Google Drive folder link<input name="drive_url" type="url" defaultValue={client.drive_url ?? ""} placeholder="https://drive.google.com/drive/folders/..." className={input} /></label>
                )}
              </EditPanel>
            </div>
          </div>

          {me.isSuper && (
            <div className="rounded-2xl bg-surface p-6">
              <h2 className="font-display text-lg tracking-tight">Client</h2>
              <p className="mt-2 text-sm text-muted">Name and login email, shared by all {client.name}&rsquo;s projects.</p>
              <div className="mt-4">
                <EditPanel action={updateClientInfo.bind(null, id)}>
                  <label className={`${label} col-span-full`}>Name<input name="name" required maxLength={200} defaultValue={client.name} className={input} /></label>
                  <label className={`${label} col-span-full`}>Email (their login, changing it sends a new invite)<input name="email" type="email" required defaultValue={client.email} className={input} /></label>
                </EditPanel>
              </div>
              <AddPanel title={`Add project for ${client.name}`} action={addProjectFor.bind(null, id)}><ProjectFields staff={staff} /></AddPanel>
              <form action={deleteClient.bind(null, id)} className="mt-6 border-t border-line pt-5">
                <ConfirmButton
                  message={`Delete ${client.name} completely? All ${siblings.length + 1} of their projects, messages, activity and todos are deleted, along with their portal login and invites. A copy goes to the archive. Their Google Drive folders are not touched.`}
                  className="btn btn-ghost btn-sm w-full justify-center text-accent"
                ><Trash2 size={14} /> Delete client</ConfirmButton>
              </form>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
