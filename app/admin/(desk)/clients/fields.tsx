import { DOMAINS, safeLink, type Client, type Staff } from "@/lib/admin";
import { input, label } from "@/app/admin/ui";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-project fields, validated. Shared by add project (list + client page) and edit.
export function projectFields(formData: FormData) {
  const project = String(formData.get("project") ?? "").trim().slice(0, 200);
  if (!project) throw new Error("Project name is required");
  const domain = String(formData.get("domain") ?? "");
  return {
    project,
    domain: DOMAINS.some((d) => d.slug === domain) ? domain : null,
    drive_url: safeLink(formData.get("drive_url")),
    // Edit forms leave the lead out: reassigning goes through assignProject so todos follow.
    ...(formData.has("admin_id") ? { admin_id: String(formData.get("admin_id")) || null } : {}),
  };
}

// Super admin form; assigned admins only edit the Drive link.
export const ProjectFields = ({ c, staff, withLead = true }: { c?: Client; staff: Staff[]; withLead?: boolean }) => (
  <>
    <label className={label}>Project<input name="project" required maxLength={200} placeholder="Brand film 2026" defaultValue={c?.project} className={input} /></label>
    <label className={label}>Domain
      <select name="domain" defaultValue={c?.domain ?? ""} className={input}>
        <option value="">None</option>
        {DOMAINS.map((d) => <option key={d.slug} value={d.slug}>{d.title}</option>)}
      </select>
    </label>
    <label className={label}>Google Drive folder link<input name="drive_url" type="url" defaultValue={c?.drive_url ?? ""} placeholder="https://drive.google.com/drive/folders/..." className={input} /></label>
    {withLead && (
      <label className={label}>Project lead (only this project)
        <select name="admin_id" defaultValue={c?.admin_id ?? ""} className={input}>
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title && ` (${s.title})`}</option>)}
        </select>
      </label>
    )}
  </>
);
