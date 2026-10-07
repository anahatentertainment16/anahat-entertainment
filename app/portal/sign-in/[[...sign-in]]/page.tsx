import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import AuthFrame, { appearance } from "@/app/admin/AuthFrame";

export const metadata: Metadata = { title: "Client sign in" };
const TAGLINE = "Your projects, files and notes with the studio, in one place.";

export default function PortalSignInPage() {
  return (
    <AuthFrame title="Client sign in" intro="Use the email we invited you with." tagline={TAGLINE}>
      <SignIn routing="path" path="/portal/sign-in" forceRedirectUrl="/portal" appearance={appearance} />
    </AuthFrame>
  );
}
