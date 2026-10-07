import "server-only";
import { cache } from "react";
import { auth, clerkClient, createClerkClient, currentUser, type User } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import { services } from "@/lib/services";

// Roles live in Clerk publicMetadata: { role: "super_admin" | "admin" | "client", title?: "Account manager" }.
// Only the two staff roles open /admin; clients use /portal (see lib/portal.ts).
// Set them on /admin/staff, or by hand in the Clerk dashboard (that's how the first super admin is made).
export type Role = "super_admin" | "admin";
export type Staff = { id: string; name: string; email: string; title: string | null; role: Role };
export type Me = Staff & { isSuper: boolean };

export type Client = {
  id: number;
  name: string;
  email: string; // lowercase, the client's Clerk sign-in
  project: string;
  domain: string | null; // service slug from lib/services.ts
  drive_url: string | null;
  admin_id: string | null;
  created_at: string;
};

export const roleOf = (u: User) => {
  const r = u.publicMetadata?.role;
  return r === "super_admin" || r === "admin" ? r : null;
};

const toStaff = (u: User, role: Role): Staff => {
  const email = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "";
  const title = u.publicMetadata?.title;
  return { id: u.id, name: u.fullName || email, email, title: typeof title === "string" && title ? title : null, role };
};

// Call at the top of every admin page and server action - proxy only checks sign-in, not the role.
export const requireStaff = cache(async (): Promise<Me> => {
  await auth.protect();
  const user = await currentUser();
  const role = user && roleOf(user);
  if (!role) redirect(user?.publicMetadata?.role === "client" ? "/portal" : "/admin/no-role");
  return { ...toStaff(user, role), isSuper: role === "super_admin" };
});

export async function requireSuper() {
  const me = await requireStaff();
  if (!me.isSuper) notFound();
  return me;
}

// Everyone with a role, super admins first. ponytail: one page of 500 users filtered here,
// Clerk can't filter by metadata. Paginate if the user base outgrows that.
// Cached across requests (it's on almost every admin page): staff actions call updateTag("staff");
// sign-ups from invites show up within STAFF_TTL. Uses a plain backend client because the cache
// scope can't read request headers. ponytail: move to "use cache" + cacheTag if Cache Components gets enabled.
const STAFF_TTL = 120;
const fetchStaff = unstable_cache(async (): Promise<Staff[]> => {
  const { data } = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users.getUserList({ limit: 500 });
  return data
    .flatMap((u) => { const r = roleOf(u); return r ? [toStaff(u, r)] : []; })
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "super_admin" ? -1 : 1));
}, ["staff"], { tags: ["staff"], revalidate: STAFF_TTL });
export const listStaff = cache(fetchStaff);

// A client is visible to super admins and to the admin it is assigned to.
export async function requireClient(id: number) {
  const me = await requireStaff();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>();
  if (!client || (!me.isSuper && client.admin_id !== me.id)) notFound();
  return { me, client };
}

// Rendered as an href, so only allow http(s) to block javascript: URLs.
export const safeLink = (raw: FormDataEntryValue | null) => {
  const v = String(raw ?? "").trim();
  return v && /^https?:\/\//i.test(v) ? new URL(v).toString() : null;
};

// Origin of the current request, so links and invite redirects work on localhost too.
// Production pins SITE_URL: the Host header is client-controlled off Vercel and lands in invite emails.
export async function getOrigin() {
  if (process.env.NODE_ENV === "production") return SITE_URL;
  const h = await headers();
  const host = h.get("host");
  if (!host) return SITE_URL;
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

export type InviteStatus = "joined" | "invited" | "none";

// Gives the client a Clerk login with role "client": an existing user gets the role now (staff keep theirs),
// anyone else gets an email invite to /portal/sign-up and the role at sign-up.
export async function inviteClient(email: string) {
  const clerk = await clerkClient();
  const { data: [user] } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  if (user) {
    if (!roleOf(user) && user.publicMetadata?.role !== "client") await clerk.users.updateUserMetadata(user.id, { publicMetadata: { role: "client" } });
    return;
  }
  await clerk.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: "client" },
    redirectUrl: `${await getOrigin()}/portal/sign-up`,
    ignoreExisting: true,
  });
}

export async function inviteStatus(email: string): Promise<InviteStatus> {
  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  if (users.length) return "joined";
  const { data: invites } = await clerk.invitations.getInvitationList({ status: "pending", query: email });
  return invites.some((i) => i.emailAddress.toLowerCase() === email) ? "invited" : "none";
}

// Project domains are the studio's services.
export const domainTitle = (slug: string | null) => services.find((s) => s.slug === slug)?.title ?? null;
export const DOMAINS = services.map((s) => ({ slug: s.slug, title: s.title }));
