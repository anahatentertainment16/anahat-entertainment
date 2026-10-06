import { supabase } from "@/lib/supabase";
import Home, { type Project, type Member } from "./Home";

export const revalidate = 3600;

export default async function Page() {
  const [projects, team] = await Promise.all([
    supabase.from("projects").select("id, title, link, tag, description, image_url").order("sort").order("created_at"),
    supabase.from("team").select("id, name, role, link, photo_url").order("sort").order("created_at"),
  ]);
  if (projects.error) console.error("Projects load failed:", projects.error.message);
  if (team.error) console.error("Team load failed:", team.error.message);
  return <Home projects={(projects.data as Project[]) ?? []} team={(team.data as Member[]) ?? []} />;
}
