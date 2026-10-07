import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireSuper } from "@/lib/admin";
import { archiveFileName, type Archive } from "@/lib/archive";

// One archive as a downloadable .txt file.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSuper();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { data } = await supabase.from("archives").select("*").eq("id", id).maybeSingle<Archive>();
  if (!data) notFound();
  return new Response(data.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${archiveFileName(data)}"`,
      "Cache-Control": "no-store",
    },
  });
}
