export const SITE_URL = "https://anahatentertainment.online";
export const EMAIL = "contact@anahatentertainment.online";
export const SITE_NAME = "Anahat Entertainment";
// 1200x630 JPEG, ~140KB: WhatsApp drops previews over ~600KB. og-image.png is the full-size source.
export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Anahat Entertainment, creative studio in Pune",
};
// Shared social card: a page that sets its own openGraph replaces the root one wholesale, so spread this in.
export const OG_BASE = {
  type: "website" as const,
  locale: "en_IN",
  siteName: SITE_NAME,
  images: [OG_IMAGE],
};
export const WRAP = "mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-14";
