import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { services } from "@/lib/services";
import { OG_BASE, SITE_URL } from "@/lib/site";
import InquiryForm from "./InquiryForm";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  const title = `${service.title} | Anahat Entertainment`;
  return {
    title: service.title,
    description: service.blurb,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { ...OG_BASE, title, description: service.blurb, url: `/services/${slug}` },
    twitter: { card: "summary_large_image", title, description: service.blurb, images: ["/og-image.png"] },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <main className="min-h-[100dvh] px-4 py-16 sm:px-8 md:py-24">
      <div className="mx-auto max-w-[800px]">
        <Link href="/#services" className="u-link mb-16 inline-flex items-center gap-1.5 text-sm text-muted md:mb-24"><ArrowLeft size={15} /> All services</Link>
        <h1 className="m-0 mb-6 font-display text-[clamp(40px,7vw,88px)] font-bold leading-[0.95] tracking-[-0.035em]">{service.title}</h1>
        <p className="m-0 mb-16 max-w-[52ch] text-lg leading-relaxed text-muted md:mb-20">{service.blurb}</p>
        {service.includes && (
          <ul className="m-0 -mt-6 mb-16 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 md:-mt-8 md:mb-20">
            {service.includes.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><Icon size={16} /></span>
                {label}
              </li>
            ))}
            <li className="flex items-center px-4 py-3 text-muted sm:col-span-2">Running something else? Describe it below and we&rsquo;ll scope it.</li>
          </ul>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: service.title,
              description: service.blurb,
              url: `${SITE_URL}/services/${slug}`,
              provider: { "@id": `${SITE_URL}/#organization` },
              areaServed: "Worldwide",
              serviceType: service.title,
            }).replace(/</g, "\\u003c"),
          }}
        />
        <div className="rounded-[20px] bg-surface p-7 md:p-12">
          <InquiryForm service={{ title: service.title }} />
        </div>
      </div>
    </main>
  );
}
