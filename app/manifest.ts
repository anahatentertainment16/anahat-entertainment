import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Anahat",
    description: "Creative studio for advertising and branded content, web development, custom software, social media, and AI partnerships.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF2CF",
    theme_color: "#FFF2CF",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
