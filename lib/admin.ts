import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Call at the top of every admin page and server action - proxy only checks sign-in, not the allowlist.
export async function requireAdmin() {
  await auth.protect();
  const user = await currentUser();
  const emails = user?.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress.toLowerCase()) ?? [];
  if (!emails.some((e) => ADMIN_EMAILS.includes(e))) notFound();
}
