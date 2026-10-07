import type { NextConfig } from "next";

// Public pages never load Clerk (it's scoped to /admin and /portal, whose CSP comes from proxy.ts).
const supabaseHost = process.env.SUPABASE_URL ? ` ${new URL(process.env.SUPABASE_URL).origin}` : "";
// React dev tooling needs eval; production doesn't.
const evalSrc = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// ponytail: 'unsafe-inline' scripts here because nonces force dynamic rendering; these pages are static and hold no session.
const csp = {
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${evalSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabaseHost}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join("; "),
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: process.env.SUPABASE_URL ? [new URL(`${process.env.SUPABASE_URL}/storage/v1/object/public/**`)] : [],
  },
  // Project image uploads go through a server action (bucket caps files at 5MB).
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async headers() {
    // /admin and /portal get a nonce CSP from proxy.ts instead; two CSP headers would both apply.
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/((?!admin|portal).*)", headers: [csp] },
    ];
  },
};

export default nextConfig;
