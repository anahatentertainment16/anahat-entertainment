import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { services } from "@/lib/services";
import InquiryForm from "./InquiryForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.blurb,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: `${service.title} | Anahat Entertainment`,
      description: service.blurb,
      url: `/services/${slug}`,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#1C1814", color: "#F1ECE1", padding: "clamp(80px,12vh,140px) clamp(24px,6vw,110px)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link
          href="/"
          style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(241,236,225,0.45)", textDecoration: "none", display: "inline-block", marginBottom: "clamp(48px,8vh,96px)", transition: "color 0.3s ease" }}
        >
          &larr; Back
        </Link>

        <span style={{ display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: 18 }}>
          ({service.n})
        </span>
        <h1 style={{ margin: "0 0 clamp(48px,8vh,96px)", fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(36px,6vw,88px)", lineHeight: 1.0, letterSpacing: "-0.025em", color: "#F1ECE1" }}>
          {service.title}
        </h1>

        <InquiryForm service={service} />
      </div>
    </main>
  );
}
