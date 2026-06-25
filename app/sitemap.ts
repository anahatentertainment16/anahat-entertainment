import type { MetadataRoute } from "next";
import { services } from "@/lib/services";

const BASE = "https://anahat-entertainment.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const serviceUrls = services.map((s) => ({
    url: `${BASE}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/testimonial`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...serviceUrls,
  ];
}
