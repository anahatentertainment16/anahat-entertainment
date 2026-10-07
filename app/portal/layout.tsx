import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Client portal", robots: { index: false, follow: false } };

// Clients sign in with Clerk too, so the portal gets its own provider (public pages still skip clerk-js).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider dynamic /* reads the CSP nonce set in proxy.ts */ signInUrl="/portal/sign-in" signUpUrl="/portal/sign-up" afterSignOutUrl="/">{children}</ClerkProvider>;
}
