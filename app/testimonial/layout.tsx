import type { Metadata } from "next";
import { OG_BASE } from "@/lib/site";

const title = "Share Your Experience | Anahat Entertainment";
const description = "Worked with Anahat Entertainment? Leave a testimonial about your project.";

export const metadata: Metadata = {
  title: "Share Your Experience",
  description,
  alternates: { canonical: "/testimonial" },
  openGraph: { ...OG_BASE, title, description, url: "/testimonial" },
  twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
};

export default function TestimonialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
