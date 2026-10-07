import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { supabase, PROJECT_BUCKET } from "@/lib/supabase";
import { fmtMoney, fmtTime } from "@/lib/format";
import { totals, type InvoiceItem } from "@/lib/invoice-math";
import { domainTitle, listStaff, roleOf, type Client, type Me } from "@/lib/admin";
import { field, indent, writeArchive, type Section } from "@/lib/archive";

// Full deletes across every service the app holds data in: Clerk (logins, invites), Supabase tables and
// Supabase Storage. Each one archives first, then deletes. Google Drive folders are only linked, never
// owned by the app, so they are listed in the archive for someone to remove by hand.

type Msg = { client_id: number; author_id: string | null; body: string; created_at: string };
type Act = { client_id: number; kind: string; detail: string | null; created_at: string };
type InvRow = { client_id: number | null; number: string; status: string; issued_on: string; items: InvoiceItem[]; tax_rate: number };
type PayRow = { client_id: number | null; staff_name: string; description: string; amount: number; status: string };
type TodoRow = { client_id: number | null; title: string; status: string; assignee_id: string | null; created_at: string };

const notFound = (e: unknown) => isClerkAPIResponseError(e) && e.status === 404;

// Everything stored about a set of client projects, rendered as archive sections.
async function projectSections(projects: Client[]): Promise<Section[]> {
  const ids = projects.map((p) => p.id);
  if (!ids.length) return [];
  const [msgs, acts, todos, staff, invs, pays] = await Promise.all([
    supabase.from("messages").select("client_id, author_id, body, created_at").in("client_id", ids).order("created_at"),
    supabase.from("activity").select("client_id, kind, detail, created_at").in("client_id", ids).order("created_at"),
    supabase.from("todos").select("client_id, title, status, assignee_id, created_at").in("client_id", ids).order("created_at"),
    listStaff(),
    supabase.from("invoices").select("number, status, issued_on, items, tax_rate, client_id").in("client_id", ids).order("issued_on"),
    supabase.from("payouts").select("staff_name, description, amount, status, client_id").in("client_id", ids),
  ]);
  const who = (id: string | null, client: string) => (id ? staff.find((s) => s.id === id)?.name ?? `Former staff (${id})` : client);

  return projects.flatMap((p) => [
    {
      heading: `Project: ${p.project}`,
      lines: [
        field("Domain", domainTitle(p.domain)),
        field("Assigned admin", p.admin_id ? who(p.admin_id, "") : "Unassigned"),
        field("Google Drive folder (not deleted, remove by hand)", p.drive_url),
        field("Created", `${fmtTime(p.created_at)} IST`),
      ],
    },
    {
      heading: `Messages: ${p.project}`,
      lines: ((msgs.data ?? []) as Msg[]).filter((m) => m.client_id === p.id).map((m) => `[${fmtTime(m.created_at)}] ${who(m.author_id, p.name)}: ${indent(m.body)}`),
    },
    {
      heading: `Client activity: ${p.project}`,
      lines: ((acts.data ?? []) as Act[]).filter((a) => a.client_id === p.id).map((a) => `[${fmtTime(a.created_at)}] ${a.kind}${a.detail ? `: ${indent(a.detail)}` : ""}`),
    },
    {
      heading: `Todos: ${p.project}`,
      lines: ((todos.data ?? []) as TodoRow[]).filter((t) => t.client_id === p.id).map((t) => `[${t.status}] ${t.title} (${who(t.assignee_id, "Unassigned")})`),
    },
    {
      // Invoices and payouts are kept (unlinked from the project), listed here for the record.
      heading: `Invoices (kept): ${p.project}`,
      lines: ((invs.data ?? []) as InvRow[]).filter((i) => i.client_id === p.id).map((i) => `${i.number} [${i.status}] issued ${i.issued_on}, total ${fmtMoney(totals(i.items, i.tax_rate).total)}`),
    },
    {
      heading: `Staff payouts (kept): ${p.project}`,
      lines: ((pays.data ?? []) as PayRow[]).filter((x) => x.client_id === p.id).map((x) => `[${x.status}] ${x.staff_name}: ${x.description}, ${fmtMoney(x.amount)}`),
    },
  ]);
}

export async function deleteStaffMember(me: Me, userId: string) {
  if (userId === me.id) throw new Error("You can't delete yourself");
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
  const name = user.fullName || email;
  const [projects, todos, authored, pays] = await Promise.all([
    supabase.from("clients").select("name, project").eq("admin_id", userId),
    supabase.from("todos").select("title, status").eq("assignee_id", userId),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("payouts").select("description, amount, status, project_label").eq("staff_id", userId),
  ]);

  await writeArchive(me, "admin", name, [
    field("Name", name),
    field("Email", email),
    field("Role", roleOf(user) === "super_admin" ? "Super admin" : "Admin"),
    field("Team role", typeof user.publicMetadata?.title === "string" ? user.publicMetadata.title : null),
    field("Joined", `${fmtTime(new Date(user.createdAt).toISOString())} IST`),
    field("Messages written (kept in client threads, shown as former staff)", authored.count ?? 0),
  ], [
    { heading: "Projects they handled (now unassigned)", lines: (projects.data ?? []).map((p) => `${p.name} / ${p.project}`) },
    { heading: "Todos assigned to them (now unassigned)", lines: (todos.data ?? []).map((t) => `[${t.status}] ${t.title}`) },
    { heading: "Payouts (kept on record)", lines: (pays.data ?? []).map((x) => `[${x.status}] ${x.description}${x.project_label ? ` (${x.project_label})` : ""}, ${fmtMoney(x.amount)}`) },
  ]);

  await clerk.users.deleteUser(userId).catch((e) => { if (!notFound(e)) throw e; });
  await Promise.all([
    supabase.from("clients").update({ admin_id: null }).eq("admin_id", userId),
    supabase.from("todos").update({ assignee_id: null }).eq("assignee_id", userId),
  ]);
}

// A client is every project sharing one email, plus their Clerk login and any pending invites.
export async function deleteClientAccount(me: Me, email: string) {
  const { data } = await supabase.from("clients").select("*").eq("email", email).order("project");
  const projects = (data ?? []) as Client[];
  if (!projects.length) throw new Error("Client not found");
  const clerk = await clerkClient();
  const [{ data: users }, { data: invites }] = await Promise.all([
    clerk.users.getUserList({ emailAddress: [email], limit: 10 }),
    clerk.invitations.getInvitationList({ status: "pending", query: email }),
  ]);
  // Never delete a login that also has a staff role; only the client data goes.
  const logins = users.filter((u) => !roleOf(u));
  const kept = users.filter((u) => roleOf(u));
  const pending = invites.filter((i) => i.emailAddress.toLowerCase() === email);

  await writeArchive(me, "client", projects[0].name, [
    field("Client", projects[0].name),
    field("Email", email),
    field("Projects", projects.map((p) => p.project).join(", ")),
    field("Portal login", logins.length ? "deleted from Clerk" : kept.length ? "kept (this email is also staff)" : "never joined"),
    field("Pending invites revoked", pending.length),
  ], await projectSections(projects));

  await Promise.all([
    ...pending.map((i) => clerk.invitations.revokeInvitation(i.id).catch(() => null)),
    ...logins.map((u) => clerk.users.deleteUser(u.id).catch((e) => { if (!notFound(e)) throw e; })),
  ]);
  const ids = projects.map((p) => p.id);
  await supabase.from("todos").delete().in("client_id", ids);
  const { error } = await supabase.from("clients").delete().eq("email", email); // messages + activity cascade
  if (error) throw new Error(`Client delete failed: ${error.message}`);
}

// One project. The client's login stays for their other projects (or an empty portal if this was the last).
export async function deleteClientProject(me: Me, id: number) {
  const { data: project } = await supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>();
  if (!project) throw new Error("Project not found");
  await writeArchive(me, "client_project", `${project.name} / ${project.project}`, [
    field("Client", project.name),
    field("Email", project.email),
  ], await projectSections([project]));

  await supabase.from("todos").delete().eq("client_id", id);
  const { error } = await supabase.from("clients").delete().eq("id", id); // messages + activity cascade
  if (error) throw new Error(`Project delete failed: ${error.message}`);
}

export async function deletePortfolioProject(me: Me, id: number) {
  const { data: p } = await supabase.from("projects").select("*, project_tags(tag)").eq("id", id)
    .maybeSingle<{ title: string; description: string; link: string | null; image_url: string | null; image_path: string | null; featured: boolean; sort: number; created_at: string; project_tags: { tag: string }[] }>();
  if (!p) throw new Error("Project not found");
  await writeArchive(me, "portfolio_project", p.title, [
    field("Title", p.title),
    field("Tags", p.project_tags.map((t) => t.tag).join(", ") || null),
    field("Link", p.link),
    field("Featured on home page", p.featured ? "yes" : "no"),
    field("Order", p.sort),
    field("Image (deleted from storage)", p.image_url),
    field("Created", `${fmtTime(p.created_at)} IST`),
  ], [{ heading: "Description", lines: [p.description] }]);

  const { error } = await supabase.from("projects").delete().eq("id", id); // project_tags cascade
  if (error) throw new Error(`Project delete failed: ${error.message}`);
  if (p.image_path) await supabase.storage.from(PROJECT_BUCKET).remove([p.image_path]);
}
