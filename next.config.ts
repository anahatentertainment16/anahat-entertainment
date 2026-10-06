import type { NextConfig } from "next";

// Clerk's Frontend API host is base64-encoded in the publishable key: pk_(test|live)_<base64("host$")>
const clerkHost = Buffer.from(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split("_")[2] ?? "", "base64").toString().replace(/\$$/, "");
const clerk = clerkHost ? ` https://${clerkHost}` : "";
// Admin previews render Supabase storage URLs with a plain <img>; Clerk's bot check runs in a Cloudflare Turnstile iframe.
const supabaseHost = process.env.SUPABASE_URL ? ` ${new URL(process.env.SUPABASE_URL).origin}` : "";
const turnstile = " https://challenges.cloudflare.com";
// React dev tooling needs eval; production doesn't.
const evalSrc = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${evalSrc}${clerk}${turnstile}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: https://img.clerk.com${supabaseHost}`,
      `connect-src 'self'${clerk}`,
      "worker-src 'self' blob:",
      `frame-src${turnstile}`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: process.env.SUPABASE_URL ? [new URL(`${process.env.SUPABASE_URL}/storage/v1/object/public/**`)] : [],
  },
  // Project image uploads go through a server action (bucket caps files at 5MB).
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
