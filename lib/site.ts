export const SITE_URL = "https://anahatentertainment.online";
export const EMAIL = "contact@anahatentertainment.online";
export const SITE_NAME = "Anahat Entertainment";
// Shared social card: a page that sets its own openGraph replaces the root one wholesale, so spread this in.
export const OG_BASE = {
  type: "website" as const,
  locale: "en_IN",
  siteName: SITE_NAME,
  images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${SITE_NAME} | Creative Studio` }],
};
export const WRAP = "mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-14";
