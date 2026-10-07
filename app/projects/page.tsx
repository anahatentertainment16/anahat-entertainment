import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { PROJECT_SELECT, withTags } from "@/lib/projects";
import { OG_BASE, OG_IMAGE, SITE_URL, WRAP } from "@/lib/site";
import type { Project } from "../Home";
import ProjectsIndex from "./ProjectsIndex";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

const description = "Brand films, advertising, websites, software, social and AI work by Anahat Entertainment, a creative studio in Pune.";

export const metadata: Metadata = {
  title: "Projects",
  description,
  alternates: { canonical: "/projects" },
  openGraph: { ...OG_BASE, title: "Projects | Anahat Entertainment", description, url: "/projects" },
  twitter: { card: "summary_large_image", title: "Projects | Anahat Entertainment", description, images: [OG_IMAGE] },
};

export default async function ProjectsPage() {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("sort")
    .order("created_at");
  if (error) console.error("Projects load failed:", error.message);
  const projects: Project[] = withTags(data ?? []);

  return (
    <main className={`${WRAP} min-h-[100dvh] py-16 md:py-24`}>
      <Link href="/#projects" className="u-link mb-16 inline-flex items-center gap-1.5 text-sm text-muted md:mb-24"><ArrowLeft size={15} /> Home</Link>
      <h1 className="m-0 mb-10 font-display text-[clamp(44px,7vw,104px)] font-bold leading-[0.95] tracking-[-0.04em] md:mb-14">
        Everything we&rsquo;ve made.
      </h1>
      {projects.length === 0 ? (
        <p className="m-0 text-muted">New work is on its way. <Link href="/#contact" className="u-link text-ink">Start a project</Link> to be next.</p>
      ) : (
        <ProjectsIndex projects={projects} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
