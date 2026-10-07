import type { Metadata } from "next";
import { revalidatePath, updateTag } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { deleteStaffMember } from "@/lib/deletion";
import { getOrigin, listStaff, requireSuper, type Role, type Staff } from "@/lib/admin";
import ConfirmButton from "@/app/admin/ConfirmButton";
import { AddPanel, EditPanel, PageHeader, fmtDate, input, label, plural } from "@/app/admin/ui";
import SubmitButton from "@/app/admin/SubmitButton";

export const metadata: Metadata = { title: "Staff" };

// Role and team title are Clerk publicMetadata; this page is just a form over it.
function roleFields(formData: FormData) {
  const role: Role = formData.get("role") === "super_admin" ? "super_admin" : "admin";
  return { role, title: String(formData.get("title") ?? "").trim().slice(0, 120) || null };
}

// Existing Clerk user: set their role now. Otherwise email an invite to /admin/sign-up; Clerk copies the role onto them at sign-up.
async function addStaff(formData: FormData) {
  "use server";
  await requireSuper();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required");
  const publicMetadata = roleFields(formData);
  const clerk = await clerkClient();
  const { data: [user] } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  if (user) await clerk.users.updateUserMetadata(user.id, { publicMetadata });
  else {
    await clerk.invitations.createInvitation({ emailAddress: email, publicMetadata, redirectUrl: `${await getOrigin()}/admin/sign-up`, ignoreExisting: true });
  }
  updateTag("staff");
  revalidatePath("/admin", "layout");
}

async function updateStaff(userId: string, formData: FormData) {
  "use server";
  const me = await requireSuper();
  const publicMetadata = roleFields(formData);
  if (userId === me.id) publicMetadata.role = "super_admin"; // can't demote yourself out of this page
  await (await clerkClient()).users.updateUserMetadata(userId, { publicMetadata });
  updateTag("staff");
  revalidatePath("/admin", "layout");
}

// Archives them, deletes their Clerk login, and leaves their projects and todos unassigned.
async function removeStaff(userId: string) {
  "use server";
  const me = await requireSuper();
  await deleteStaffMember(me, userId);
  updateTag("staff");
  revalidatePath("/admin", "layout");
}

async function revokeInvite(id: string) {
  "use server";
  await requireSuper();
  try {
    await (await clerkClient()).invitations.revokeInvitation(id);
  } catch (e) {
    // The list can be stale: if they already joined (or it was revoked elsewhere), refreshing shows the truth.
    const settled = isClerkAPIResponseError(e) && e.errors.some((x) => x.code === "invitation_already_accepted" || x.code === "invitation_already_revoked");
    if (!settled) throw e;
  }
  updateTag("staff");
  revalidatePath("/admin", "layout");
}

const RoleFields = ({ s }: { s?: Staff }) => (
  <>
    <label className={label}>Team role<input name="title" maxLength={120} placeholder="Account manager" defaultValue={s?.title ?? ""} className={input} /></label>
    <label className={label}>Access
      <select name="role" defaultValue={s?.role ?? "admin"} className={input}>
        <option value="admin">Admin: own clients and todos</option>
        <option value="super_admin">Super admin: everything</option>
      </select>
    </label>
  </>
);

export default async function StaffPage() {
  const me = await requireSuper();
  const [staff, invites, clientsRes] = await Promise.all([
    listStaff(),
    clerkClient().then((c) => c.invitations.getInvitationList({ status: "pending" })),
    supabase.from("clients").select("admin_id"),
  ]);
  const pending = invites.data.filter((i) => i.publicMetadata?.role === "admin" || i.publicMetadata?.role === "super_admin"); // staff invites only
  const load = Object.groupBy((clientsRes.data ?? []) as { admin_id: string | null }[], (c) => c.admin_id ?? "");

  return (
    <>
      <PageHeader title="Staff" description={`${plural(staff.length, "person", "people")} with access. Super admins see everything; admins see only the projects and todos assigned to them.`} />
      <ul className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => (
          <li key={s.id} className="rounded-2xl bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-xl leading-tight">{s.name}</h3>
                <p className="mt-1 text-sm text-accent">{s.role === "super_admin" ? "Super admin" : "Admin"}{s.title && <span className="text-muted"> / {s.title}</span>}</p>
                <p className="mt-1 truncate text-sm text-muted">{s.email}</p>
              </div>
              <span className="pt-1 font-mono text-xs text-muted" title="Assigned clients">{load[s.id]?.length ?? 0}</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <EditPanel action={updateStaff.bind(null, s.id)}><RoleFields s={s} /></EditPanel>
              {s.id !== me.id && (
                <form action={removeStaff.bind(null, s.id)} className="self-start">
                  <ConfirmButton message={`Delete ${s.name}? Their login is deleted and their projects and todos become unassigned. A copy goes to the archive.`} className="btn btn-ghost btn-sm" label={`Delete ${s.name}`}><Trash2 size={14} /></ConfirmButton>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      {pending.length > 0 && (
        <>
          <h3 className="mb-3 mt-12 text-sm font-medium">Invited, not signed up yet</h3>
          <ul className="divide-y divide-line border-y border-line">
            {pending.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>{i.emailAddress} <span className="text-muted">/ {i.publicMetadata?.role === "super_admin" ? "Super admin" : "Admin"} / {fmtDate(new Date(i.createdAt).toISOString())}</span></span>
                <form action={revokeInvite.bind(null, i.id)}>
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Revoking…"><X size={14} /> Revoke</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}

      <AddPanel title="Invite admin" action={addStaff}>
        <label className={label}>Email (their sign-in)<input name="email" type="email" required className={input} /></label>
        <RoleFields />
      </AddPanel>
    </>
  );
}
