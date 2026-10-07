import { notFound, redirect } from "next/navigation";
import { logActivity, requirePortalClient } from "@/lib/portal";

// "Upload here" hop: log that the client opened their Drive folder, then send them on.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const client = await requirePortalClient(id);
  if (!client.drive_url) redirect(`/portal/${id}`);
  await logActivity(id, "upload");
  redirect(client.drive_url);
}
