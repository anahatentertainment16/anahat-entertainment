import { supabase } from "@/lib/supabase";
import Home, { type Project, type Member } from "./Home";

export const revalidate = 3600;

export default async function Page() {
  const [projects, team] = await Promise.all([
    supabase.from("projects").select("id, title, link, tag, description, image_url, featured").order("sort").order("created_at"),
    supabase.from("team").select("id, name, role, link, photo_url").order("sort").order("created_at"),
  ]);
  if (projects.error) console.error("Projects load failed:", projects.error.message);
  if (team.error) console.error("Team load failed:", team.error.message);
  const all = (projects.data as Project[]) ?? [];
  const featured = all.filter((p) => p.featured);
  // ponytail: nothing flagged yet → the first three by order stand in
  return <Home projects={featured.length ? featured : all.slice(0, 3)} projectCount={all.length} team={(team.data as Member[]) ?? []} />;
}
