import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import AuthFrame, { appearance } from "../../AuthFrame";

export const metadata: Metadata = { title: "Accept invite" };

// Invite links from /admin/staff land here with a __clerk_ticket; Clerk fills in the invited email.
export default function SignUpPage() {
  return (
    <AuthFrame title="Accept invite" intro="Set up your login to join the Anahat admin.">
      <SignUp routing="path" path="/admin/sign-up" signInUrl="/admin/sign-in" forceRedirectUrl="/admin" appearance={appearance} />
    </AuthFrame>
  );
}
