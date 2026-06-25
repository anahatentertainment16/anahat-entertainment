import type { Metadata } from "next";
import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const BASE_URL = "https://anahat-entertainment.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Anahat Entertainment — Creative Studio",
    template: "%s | Anahat Entertainment",
  },
  description:
    "Anahat Entertainment is a creative studio for advertising and branded content, web development, social, and the intelligent tools shaping what comes next.",
  keywords: ["creative studio", "advertising", "branded content", "web development", "AI partnerships", "social media", "Pune", "India"],
  authors: [{ name: "Anahat Entertainment" }],
  creator: "Anahat Entertainment",
  publisher: "Anahat Entertainment",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Anahat Entertainment",
    title: "Anahat Entertainment — Creative Studio",
    description:
      "A creative studio for advertising and branded content, web development, social, and the intelligent tools shaping what comes next.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Anahat Entertainment — Creative Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anahat Entertainment — Creative Studio",
    description:
      "A creative studio for advertising and branded content, web development, social, and the intelligent tools shaping what comes next.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
