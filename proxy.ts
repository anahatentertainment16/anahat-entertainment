import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSignIn = createRouteMatcher(["/admin/sign-in(.*)"]);

// Everything under /admin needs a session except the sign-in page itself.
export default clerkMiddleware(
  async (auth, req) => {
    if (!isSignIn(req)) await auth.protect();
  },
  { signInUrl: "/admin/sign-in" },
);

export const config = { matcher: ["/admin/:path*"] };
