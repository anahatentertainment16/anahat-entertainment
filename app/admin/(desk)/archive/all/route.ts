import { supabase } from "@/lib/supabase";
import { requireSuper } from "@/lib/admin";
import type { Archive } from "@/lib/archive";

// Every archive, oldest first, as one log file.
export async function GET() {
  await requireSuper();
  const { data, error } = await supabase.from("archives").select("body").order("created_at");
  if (error) throw new Error(`Archive load failed: ${error.message}`);
  const log = ((data ?? []) as Pick<Archive, "body">[]).map((a) => a.body).join("\n\n") || "No deletions archived yet.\n";
  return new Response(log, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="anahat-deletion-log-${new Date().toISOString().slice(0, 10)}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
