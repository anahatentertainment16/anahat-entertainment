import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EMAIL, OG_BASE, SITE_NAME, SITE_URL } from "@/lib/site";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });


// Browser chrome on mobile matches the cream page.
export const viewport: Viewport = { themeColor: "#FFF2CF" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Anahat Entertainment | Creative Studio",
    template: "%s | Anahat Entertainment",
  },
  description:
    "Anahat Entertainment is a Pune-based creative studio for advertising and branded content, web development, custom software, social media, and AI partnerships. Working with brands across India and worldwide.",
  keywords: ["Anahat Entertainment", "creative studio Pune", "advertising agency Pune", "branded content", "brand films", "web development Pune", "website design India", "custom software development", "business software", "social media agency", "AI partnerships", "Pune", "India"],
  authors: [{ name: "Anahat Entertainment" }],
  creator: "Anahat Entertainment",
  publisher: "Anahat Entertainment",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  category: "business",
  formatDetection: { telephone: false },
  openGraph: {
    ...OG_BASE,
    url: SITE_URL,
    title: "Anahat Entertainment | Creative Studio",
    description:
      "A creative studio for advertising and branded content, web development, custom software, social, and the intelligent tools shaping what comes next.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anahat Entertainment | Creative Studio",
    description:
      "A creative studio for advertising and branded content, web development, custom software, social, and the intelligent tools shaping what comes next.",
    images: ["/og-image.png"],
  },
};

// WebSite tells Google the site's name for results; Organization carries the business details.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: "Anahat",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  email: EMAIL,
  description: "Creative studio for advertising and branded content, web development, custom software, social media, and AI partnerships.",
  address: { "@type": "PostalAddress", addressLocality: "Pune", addressRegion: "Maharashtra", addressCountry: "IN" },
  areaServed: "Worldwide",
  contactPoint: { "@type": "ContactPoint", contactType: "sales", email: EMAIL, availableLanguage: ["English", "Hindi", "Marathi"] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable}`}
    >
      {/* extensions (e.g. ColorZilla adds cz-shortcut-listen) write attributes onto body before React hydrates */}
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          // Escape "<" so data can't close the script tag (Next.js JSON-LD guide).
          dangerouslySetInnerHTML={{ __html: JSON.stringify([siteJsonLd, orgJsonLd]).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
