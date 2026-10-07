import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// ponytail: Clerk scoped to /admin so public pages don't load clerk-js
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider dynamic /* reads the CSP nonce set in proxy.ts */ signInUrl="/admin/sign-in" signUpUrl="/admin/sign-up" afterSignOutUrl="/">{children}</ClerkProvider>;
}
