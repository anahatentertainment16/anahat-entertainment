import type { Metadata } from "next";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { requireSuper } from "@/lib/admin";
import { KIND_LABEL, type Archive } from "@/lib/archive";
import { Empty, PageHeader, fmtTime, plural } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Archive" };

// Read-only record of deletions. Nothing here can be edited or removed from the app.
export default async function ArchivePage() {
  await requireSuper();
  const { data } = await supabase.from("archives").select("id, kind, title, deleted_by, created_at").order("created_at", { ascending: false });
  const archives = (data ?? []) as Omit<Archive, "body">[];

  return (
    <>
      <PageHeader title="Archive" description={`${plural(archives.length, "deletion")} on record. Each is a text file with everything that was removed: details, messages, activity and todos.`}>
        {archives.length > 0 && (
          <a href="/admin/archive/all" download className="btn btn-solid btn-sm"><Download size={14} /> Download full log</a>
        )}
      </PageHeader>
      {archives.length === 0 ? (
        <Empty>Nothing deleted yet. When an admin, client or project is deleted, a copy lands here.</Empty>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {archives.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
              <span className="w-36 shrink-0 rounded-full border border-line px-3 py-0.5 text-center text-xs">{KIND_LABEL[a.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="wrap-anywhere font-medium">{a.title}</p>
                <p className="text-xs text-muted">{fmtTime(a.created_at)} IST, by {a.deleted_by}</p>
              </div>
              <a href={`/admin/archive/${a.id}`} download className="btn btn-ghost btn-sm"><Download size={14} /> Download</a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
