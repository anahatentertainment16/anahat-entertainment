import "server-only";
import { supabase } from "@/lib/supabase";
import { fmtTime } from "@/lib/format";
import type { Me } from "@/lib/admin";

export type ArchiveKind = "admin" | "client" | "client_project" | "portfolio_project";
export const KIND_LABEL: Record<ArchiveKind, string> = {
  admin: "Admin",
  client: "Client",
  client_project: "Client project",
  portfolio_project: "Portfolio project",
};

export type Archive = { id: number; kind: ArchiveKind; title: string; body: string; deleted_by: string; created_at: string };

// One labelled block of the text file: a heading and its lines ("" lines are kept as spacing).
export type Section = { heading: string; lines: string[] };

const RULE = "=".repeat(64);

// Indents continuation lines so multi-line messages stay readable under their timestamp.
export const indent = (text: string, pad = "    ") => text.replace(/\r?\n/g, `\n${pad}`);

export const field = (label: string, value: string | number | null | undefined) => `${label}: ${value ?? "-"}`;

// Writes the archive before anything is deleted: if a later step fails, the record still exists.
export async function writeArchive(me: Me, kind: ArchiveKind, title: string, summary: string[], sections: Section[]) {
  const deleted_by = `${me.name} <${me.email}>`;
  const now = new Date().toISOString();
  const body = [
    RULE,
    `ANAHAT ENTERTAINMENT / DELETION ARCHIVE`,
    RULE,
    field("Type", KIND_LABEL[kind]),
    field("Title", title),
    field("Deleted", `${fmtTime(now)} IST`),
    field("Deleted by", deleted_by),
    "",
    ...summary,
    ...sections.flatMap((s) => ["", `--- ${s.heading} ---`, ...(s.lines.length ? s.lines : ["(none)"])]),
    "",
  ].join("\n");

  const { error } = await supabase.from("archives").insert({ kind, title, body, deleted_by });
  if (error) throw new Error(`Archive save failed, nothing was deleted: ${error.message}`);
}

// File names like "archive-client-mehta-studios-2026-10-08.txt".
export const archiveFileName = (a: Pick<Archive, "kind" | "title" | "created_at">) =>
  `archive-${a.kind.replace("_", "-")}-${a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item"}-${a.created_at.slice(0, 10)}.txt`;
