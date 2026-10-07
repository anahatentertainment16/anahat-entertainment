import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import AuthFrame, { appearance } from "@/app/admin/AuthFrame";

export const metadata: Metadata = { title: "Join your portal" };
const TAGLINE = "Your projects, files and notes with the studio, in one place.";

// Client invites from the admin land here with a __clerk_ticket; Clerk fills in the invited email.
export default function PortalSignUpPage() {
  return (
    <AuthFrame title="Join your portal" intro="Set up your login to see your projects." tagline={TAGLINE}>
      <SignUp routing="path" path="/portal/sign-up" signInUrl="/portal/sign-in" forceRedirectUrl="/portal" appearance={appearance} />
    </AuthFrame>
  );
}
