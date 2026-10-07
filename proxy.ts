import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher(["/admin/sign-in(.*)", "/admin/sign-up(.*)", "/portal/sign-in(.*)", "/portal/sign-up(.*)"]);
const isPortal = createRouteMatcher(["/portal(.*)"]);

// Everything under /admin and /portal needs a session except the sign-in and invite sign-up pages.
// Roles are checked per page (lib/admin.ts, lib/portal.ts), not here.
// No Frontend API proxy: production talks to clerk.anahatentertainment.online (CNAME) directly,
// and Clerk rejects /__clerk requests with "host_invalid" unless a proxy is registered in the dashboard.
export default clerkMiddleware(
  async (auth, req) => {
    if (isPublic(req)) return;
    await auth.protect(isPortal(req) ? { unauthenticatedUrl: new URL("/portal/sign-in", req.url).toString() } : undefined);
  },
  {
    signInUrl: "/admin/sign-in",
    // Per-request nonce CSP for the signed-in areas (strict-dynamic, no inline scripts). Clerk passes the nonce
    // to Next and to <ClerkProvider dynamic>. Public pages stay static, so they keep next.config.ts's CSP.
    contentSecurityPolicy: {
      strict: true,
      directives: {
        "img-src": ["data:", "blob:", ...(process.env.SUPABASE_URL ? [new URL(process.env.SUPABASE_URL).origin] : [])],
        "frame-ancestors": ["none"],
      },
    },
  },
);

export const config = { matcher: ["/admin/:path*", "/portal/:path*"] };
