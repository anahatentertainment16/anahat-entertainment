import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { LogOut } from "lucide-react";
import { roleOf } from "@/lib/admin";

export const metadata: Metadata = { title: "No access yet" };

// Signed in, but no role in Clerk publicMetadata. A super admin grants one on /admin/staff.
export default async function NoRolePage() {
  await auth.protect();
  const user = await currentUser();
  if (user && roleOf(user)) redirect("/admin");
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <main className="flex min-h-[100dvh] items-center px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm text-muted">Anahat Entertainment admin</p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">You don&rsquo;t have any role assigned yet.</h1>
        <p className="mt-4 text-muted">
          You&rsquo;re signed in{email && <> as <span className="text-ink">{email}</span></>}, but a super admin still needs to give you access.
          Ask them to add you on the Staff page, then reload.
        </p>
        <SignOutButton redirectUrl="/">
          <button className="btn btn-ghost btn-sm mt-8"><LogOut size={14} /> Log out</button>
        </SignOutButton>
      </div>
    </main>
  );
}
