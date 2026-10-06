import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSignIn = createRouteMatcher(["/admin/sign-in(.*)"]);

// Everything under /admin needs a session except the sign-in page itself.
// No Frontend API proxy: production talks to clerk.anahatentertainment.online (CNAME) directly,
// and Clerk rejects /__clerk requests with "host_invalid" unless a proxy is registered in the dashboard.
export default clerkMiddleware(
  async (auth, req) => {
    if (!isSignIn(req)) await auth.protect();
  },
  { signInUrl: "/admin/sign-in" },
);

export const config = { matcher: ["/admin/:path*"] };
