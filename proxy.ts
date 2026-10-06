import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSignIn = createRouteMatcher(["/admin/sign-in(.*)"]);

// Everything under /admin needs a session except the sign-in page itself.
// Clerk's Frontend API is proxied through /__clerk: on Vercel the client defaults to it,
// but auto-proxy only kicks in on *.vercel.app, so the custom domain needs it on explicitly.
export default clerkMiddleware(
  async (auth, req) => {
    if (!isSignIn(req)) await auth.protect();
  },
  { signInUrl: "/admin/sign-in", frontendApiProxy: { enabled: true } },
);

export const config = { matcher: ["/admin/:path*", "/__clerk/:path*"] };
