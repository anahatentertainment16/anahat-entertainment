import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import AuthFrame, { appearance } from "../../AuthFrame";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthFrame title="Sign in" intro="Use the email your admin access was set up with.">
      <SignIn routing="path" path="/admin/sign-in" forceRedirectUrl="/admin" appearance={appearance} />
    </AuthFrame>
  );
}
