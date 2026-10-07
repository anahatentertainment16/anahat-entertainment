import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { supabase, PROJECT_BUCKET } from "@/lib/supabase";
import { withTags } from "@/lib/projects";
import { deletePortfolioProject } from "@/lib/deletion";
import { requireSuper, safeLink } from "@/lib/admin";
import { Check, ImageOff, Mail, Plus, Trash2, X } from "lucide-react";
import ConfirmButton from "@/app/admin/ConfirmButton";
import SubmitButton from "@/app/admin/SubmitButton";
import { AddPanel, EditPanel, Empty, PageHeader, SectionHead, fmtDate, input, label, plural, summary } from "@/app/admin/ui";

type Inquiry = {
  id: number;
  service: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  created_at: string;
};

type Project = {
  id: number;
  title: string;
  link: string | null;
  tags: string[];
  description: string;
  image_url: string | null;
  image_path: string | null;
  sort: number;
  featured: boolean;
};

type Member = {
  id: number;
  name: string;
  role: string;
  link: string | null;
  photo_url: string | null;
  photo_path: string | null;
  sort: number;
};

type Testimonial = {
  id: number;
  name: string;
  org: string | null;
  quote: string;
  approved: boolean;
  declined: boolean;
  created_at: string;
};

async function getData() {
  const [inquiries, testimonials, projects, team, tags] = await Promise.all([
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("*").order("approved").order("created_at", { ascending: false }),
    supabase.from("projects").select("*, project_tags(tag)").order("sort").order("created_at"),
    supabase.from("team").select("*").order("sort").order("created_at"),
    supabase.from("tags").select("name").order("name"),
  ]);
  const error = inquiries.error ?? testimonials.error ?? projects.error ?? team.error ?? tags.error;
  if (error) console.error("Admin getData failed:", error.message);
  return {
    inquiries: (inquiries.data ?? []) as Inquiry[],
    testimonials: (testimonials.data ?? []) as Testimonial[],
    projects: withTags(projects.data ?? []) as Project[],
    team: (team.data ?? []) as Member[],
    tags: (tags.data ?? []).map((t) => t.name as string),
    error: error?.message ?? null,
    weekAgo: Date.now() - 7 * 864e5,
  };
}

async function approveTestimonial(id: number) {
  "use server";
  await requireSuper();
  await supabase.from("testimonials").update({ approved: true, declined: false }).eq("id", id);
  revalidatePath("/admin", "layout");
}

// Decline (pending) and Remove (live) both archive rather than delete.
async function declineTestimonial(id: number) {
  "use server";
  await requireSuper();
  await supabase.from("testimonials").update({ approved: false, declined: true }).eq("id", id);
  revalidatePath("/admin", "layout");
}

async function deleteTestimonial(id: number) {
  "use server";
  await requireSuper();
  await supabase.from("testimonials").delete().eq("id", id).eq("declined", true);
  revalidatePath("/admin", "layout");
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

// Uploads an optional image field to the public bucket. Returns nulls when no file was chosen.
async function uploadImage(file: FormDataEntryValue | null, folder = "") {
  if (!(file instanceof File) || file.size === 0) return { url: null, path: null };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Image must be JPEG, PNG, WebP or AVIF");
  const path = `${folder}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PROJECT_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return { url: supabase.storage.from(PROJECT_BUCKET).getPublicUrl(path).data.publicUrl, path };
}

// Shared by add and edit: the text fields, validated. Tags are optional and saved separately.
function projectFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const sort = Number(formData.get("sort")) || 0;
  if (!title || !description) throw new Error("Title and description are required");
  return { title, description, sort, featured: formData.get("featured") === "on", link: safeLink(formData.get("link")) };
}

// Replaces a project's tags with the ticked ones (none is fine). The foreign key rejects unknown tags.
async function saveTags(projectId: number, formData: FormData) {
  const tags = [...new Set(formData.getAll("tags").map(String))];
  const cleared = await supabase.from("project_tags").delete().eq("project_id", projectId);
  if (cleared.error) throw new Error(`Tag save failed: ${cleared.error.message}`);
  if (!tags.length) return;
  const { error } = await supabase.from("project_tags").insert(tags.map((tag) => ({ project_id: projectId, tag })));
  if (error) throw new Error(`Tag save failed: ${error.message}`);
}

function teamFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const role = String(formData.get("role") ?? "").trim().slice(0, 120);
  const sort = Number(formData.get("sort")) || 0;
  if (!name || !role) throw new Error("Name and role are required");
  return { name, role, sort, link: safeLink(formData.get("link")) };
}

async function addProject(formData: FormData) {
  "use server";
  await requireSuper();
  const fields = projectFields(formData);
  const { url: image_url, path: image_path } = await uploadImage(formData.get("image"));

  const { data, error } = await supabase.from("projects").insert({ ...fields, image_url, image_path }).select("id").single();
  if (error) {
    if (image_path) await supabase.storage.from(PROJECT_BUCKET).remove([image_path]);
    throw new Error(`Project save failed: ${error.message}`);
  }
  await saveTags(data.id, formData);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/projects");
}

// A new image replaces the old one, which is removed only once the row points at the new one.
// Old path comes from the row, not a bound arg: bound args aren't encrypted, so the browser could swap them.
async function updateProject(id: number, formData: FormData) {
  "use server";
  await requireSuper();
  const fields = projectFields(formData);
  const { data: old } = await supabase.from("projects").select("image_path").eq("id", id).maybeSingle<{ image_path: string | null }>();
  const { url: image_url, path: image_path } = await uploadImage(formData.get("image"));

  const { error } = await supabase.from("projects").update(image_path ? { ...fields, image_url, image_path } : fields).eq("id", id);
  if (error) {
    if (image_path) await supabase.storage.from(PROJECT_BUCKET).remove([image_path]);
    throw new Error(`Project update failed: ${error.message}`);
  }
  if (image_path && old?.image_path) await supabase.storage.from(PROJECT_BUCKET).remove([old.image_path]);
  await saveTags(id, formData);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/projects");
}

// Archives the project, then deletes it, its tags and its image.
async function deleteProject(id: number) {
  "use server";
  const me = await requireSuper();
  await deletePortfolioProject(me, id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/projects");
}

async function addTag(formData: FormData) {
  "use server";
  await requireSuper();
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  if (!name) throw new Error("Tag name is required");
  const { error } = await supabase.from("tags").insert({ name });
  if (error) throw new Error(error.code === "23505" ? `Tag "${name}" already exists` : `Tag save failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

// Deleting a tag just removes it from its projects (project_tags cascades).
async function deleteTag(name: string) {
  "use server";
  await requireSuper();
  const { error } = await supabase.from("tags").delete().eq("name", name);
  if (error) throw new Error(`Tag delete failed: ${error.message}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/projects");
}

async function addTeamMember(formData: FormData) {
  "use server";
  await requireSuper();
  const fields = teamFields(formData);
  // ponytail: team photos share the projects bucket under team/, own bucket if access rules ever differ
  const { url: photo_url, path: photo_path } = await uploadImage(formData.get("photo"), "team/");

  const { error } = await supabase.from("team").insert({ ...fields, photo_url, photo_path });
  if (error) {
    if (photo_path) await supabase.storage.from(PROJECT_BUCKET).remove([photo_path]);
    throw new Error(`Team member save failed: ${error.message}`);
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

async function updateTeamMember(id: number, formData: FormData) {
  "use server";
  await requireSuper();
  const fields = teamFields(formData);
  const { data: old } = await supabase.from("team").select("photo_path").eq("id", id).maybeSingle<{ photo_path: string | null }>();
  const { url: photo_url, path: photo_path } = await uploadImage(formData.get("photo"), "team/");

  const { error } = await supabase.from("team").update(photo_path ? { ...fields, photo_url, photo_path } : fields).eq("id", id);
  if (error) {
    if (photo_path) await supabase.storage.from(PROJECT_BUCKET).remove([photo_path]);
    throw new Error(`Team member update failed: ${error.message}`);
  }
  if (photo_path && old?.photo_path) await supabase.storage.from(PROJECT_BUCKET).remove([old.photo_path]);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

async function deleteTeamMember(id: number) {
  "use server";
  await requireSuper();
  const { data } = await supabase.from("team").delete().eq("id", id).select("photo_path").maybeSingle<{ photo_path: string | null }>();
  if (data?.photo_path) await supabase.storage.from(PROJECT_BUCKET).remove([data.photo_path]);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

const fileInput = "text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-ink";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

// Add and edit share these fields; edit passes the current row as defaults.
const ProjectFields = ({ p, sort, tags }: { p?: Project; sort: number; tags: string[] }) => (
  <>
    <label className={label}>Title<input name="title" required maxLength={200} defaultValue={p?.title} className={input} /></label>
    <fieldset className="col-span-full">
      <legend className="text-sm text-muted">Tags (optional, pick any)</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.length === 0 && <span className="text-sm text-muted">No tags yet. Add some below the projects.</span>}
        {tags.map((t) => (
          <label key={t} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-ink has-[:checked]:bg-surface">
            <input type="checkbox" name="tags" value={t} defaultChecked={p?.tags.includes(t)} className="size-3.5 accent-[var(--accent-text)]" />{t}
          </label>
        ))}
      </div>
    </fieldset>
    <label className={label}>Link (optional)<input name="link" type="url" placeholder="https://" defaultValue={p?.link ?? ""} className={input} /></label>
    <label className={label}>Order<input name="sort" type="number" defaultValue={sort} className={input} /></label>
    <label className={`${label} col-span-full`}>Description<textarea name="description" required rows={3} maxLength={2000} defaultValue={p?.description} className={input} /></label>
    <label className="flex items-center gap-2 self-end text-sm text-ink"><input name="featured" type="checkbox" defaultChecked={p?.featured} className="size-4 accent-[var(--accent-text)]" />Featured on home page</label>
    <label className={`${label} gap-3`}>{p ? "Replace image (optional)" : "Image, up to 5MB"}<input name="image" type="file" accept={IMAGE_ACCEPT} className={fileInput} /></label>
  </>
);

const TeamFields = ({ m, sort }: { m?: Member; sort: number }) => (
  <>
    <label className={label}>Name<input name="name" required maxLength={120} defaultValue={m?.name} className={input} /></label>
    <label className={label}>Role<input name="role" required maxLength={120} placeholder="Creative Director" defaultValue={m?.role} className={input} /></label>
    <label className={label}>Profile link (optional)<input name="link" type="url" placeholder="https://linkedin.com/in/..." defaultValue={m?.link ?? ""} className={input} /></label>
    <label className={label}>Order<input name="sort" type="number" defaultValue={sort} className={input} /></label>
    <label className={`${label} gap-3`}>{m ? "Replace photo (optional)" : "Photo, portrait 4:5, up to 5MB"}<input name="photo" type="file" accept={IMAGE_ACCEPT} className={fileInput} /></label>
  </>
);

export const metadata: Metadata = { title: "Website" };

export default async function SitePage() {
  await requireSuper();
  const { inquiries, testimonials, projects, team, tags, error, weekAgo } = await getData();
  const tagUse = Object.groupBy(projects.flatMap((p) => p.tags), (t) => t);
  const pending = testimonials.filter((t) => !t.approved && !t.declined);
  const approved = testimonials.filter((t) => t.approved);
  const archived = testimonials.filter((t) => t.declined);
  const recent = inquiries.filter((i) => new Date(i.created_at).getTime() > weekAgo).length;


  const testimonialActions = (t: Testimonial) => (
    <div className="flex flex-wrap gap-2">
      {!t.approved && (
        <form action={approveTestimonial.bind(null, t.id)}>
          <button type="submit" className="btn btn-sm bg-accent text-on-accent"><Check size={14} /> {t.declined ? "Restore and approve" : "Approve"}</button>
        </form>
      )}
      {t.declined ? (
        <form action={deleteTestimonial.bind(null, t.id)}>
          <ConfirmButton message={`Delete ${t.name}'s testimonial forever? This can't be undone.`} className="btn btn-ghost btn-sm"><Trash2 size={14} /> Delete forever</ConfirmButton>
        </form>
      ) : (
        <form action={declineTestimonial.bind(null, t.id)}>
          <button type="submit" className="btn btn-ghost btn-sm"><X size={14} /> {t.approved ? "Remove" : "Decline"}</button>
        </form>
      )}
    </div>
  );

  const byline = (t: Testimonial) => (
    <p className="text-sm"><span className="font-medium">{t.name}</span>{t.org && <span className="text-muted">, {t.org}</span>}</p>
  );

  return (
    <>

        <PageHeader title="Website" description={`What visitors see on the public site. ${recent > 0 ? `${plural(recent, "new inquiry", "new inquiries")} this week` : "No new inquiries this week"}, ${plural(pending.length, "testimonial")} to review.`} />

        {error && (
          <div role="alert" className="mt-8 rounded-2xl border border-accent/50 bg-accent/10 px-6 py-4 text-sm">
            <p className="font-medium">Couldn&rsquo;t load data from the database.</p>
            <p className="mt-1 text-muted">Check the Supabase connection, then reload. Details: {error}</p>
          </div>
        )}

        <div className="mt-10 space-y-24">

            {/* Inquiries */}
            <section id="inquiries" aria-labelledby="inquiries-title" className="scroll-mt-20">
              <SectionHead id="inquiries" title="Inquiries" meta={`${inquiries.length} total`} />
              {inquiries.length === 0 ? (
                <Empty>No inquiries yet. They land here when someone sends the form on a service page.</Empty>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {inquiries.map((row) => (
                    <li key={row.id} className="grid gap-x-8 gap-y-2 py-6 md:grid-cols-[110px_1fr_auto]">
                      <time dateTime={row.created_at} className="pt-1 font-mono text-xs text-muted">{fmtDate(row.created_at)}</time>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-x-3">
                          <span className="text-lg font-medium">{row.name}</span>
                          {row.company && <span className="text-sm text-muted">{row.company}</span>}
                        </p>
                        <p className="mt-1 text-sm text-accent">{row.service}</p>
                        {row.message && (
                          // ponytail: native <details>, the clamped preview opens to the full message
                          <details className="group mt-3 max-w-[65ch]">
                            <summary className={`${summary} line-clamp-2 whitespace-pre-wrap wrap-anywhere text-[15px] leading-relaxed text-muted group-open:line-clamp-none group-open:text-ink`}>{row.message}</summary>
                          </details>
                        )}
                      </div>
                      <a href={`mailto:${row.email}`} className="btn btn-ghost btn-sm self-start justify-self-start" title={row.email}><Mail size={14} /> Reply</a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Testimonials: pending first, as the decisions they are */}
            <section id="testimonials" aria-labelledby="testimonials-title" className="scroll-mt-20">
              <SectionHead id="testimonials" title="Testimonials" meta={`${pending.length} pending, ${approved.length} live, ${archived.length} archived`} />

              {pending.length > 0 && (
                <ul className="mb-12 grid gap-4 md:grid-cols-2">
                  {pending.map((t) => (
                    <li key={t.id} className="flex flex-col gap-5 rounded-2xl bg-surface p-6">
                      <blockquote className="font-display text-xl leading-snug">&ldquo;{t.quote}&rdquo;</blockquote>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                        <div>{byline(t)}<p className="mt-1 font-mono text-xs text-muted">{fmtDate(t.created_at)}</p></div>
                        {testimonialActions(t)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mb-3 text-sm font-medium">Live on the site</h3>
              {approved.length === 0 ? (
                <Empty>No live testimonials. Approve one above and it appears on the site.</Empty>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {approved.map((t) => (
                    <li key={t.id} className="flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between">
                      <div className="max-w-[65ch]">
                        <p className="text-[15px] leading-relaxed text-muted">&ldquo;{t.quote}&rdquo;</p>
                        <div className="mt-2">{byline(t)}</div>
                      </div>
                      {testimonialActions(t)}
                    </li>
                  ))}
                </ul>
              )}

              {archived.length > 0 && (
                <details className="group mt-8">
                  <summary className={`${summary} text-sm text-muted hover:text-ink`}>
                    <span className="inline-block transition-transform group-open:rotate-90">&rsaquo;</span> Archive ({plural(archived.length, "declined testimonial")})
                  </summary>
                  <ul className="mt-3 divide-y divide-line border-y border-line opacity-75">
                    {archived.map((t) => (
                      <li key={t.id} className="flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-[65ch]">
                          <p className="text-[15px] leading-relaxed text-muted line-through decoration-line">&ldquo;{t.quote}&rdquo;</p>
                          <div className="mt-2">{byline(t)}</div>
                        </div>
                        {testimonialActions(t)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            {/* Projects */}
            <section id="projects" aria-labelledby="projects-title" className="scroll-mt-20">
              <SectionHead id="projects" title="Projects" meta={`${projects.length} on the site`} />
              {projects.length === 0 ? (
                <Empty>No projects yet. Add one below and it shows in the Work section.</Empty>
              ) : (
                <ul className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {projects.map((p) => (
                    <li key={p.id} className="overflow-hidden rounded-2xl bg-surface">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, optimisation not worth it
                        <img src={p.image_url} alt="" className="aspect-[16/10] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center gap-2 bg-paper text-sm text-muted"><ImageOff size={16} /> No image</div>
                      )}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-accent">{p.tags.join(" / ") || <span className="text-muted">No tags</span>}{p.featured && <span className="text-muted"> / Featured</span>}</p>
                            <h3 className="mt-1 font-display text-xl leading-tight">{p.title}</h3>
                          </div>
                          <span className="pt-1 font-mono text-xs text-muted" title="Display order">#{p.sort}</span>
                        </div>
                        <p className="mt-2 truncate text-sm text-muted">{p.link ?? "In development"}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <EditPanel action={updateProject.bind(null, p.id)}><ProjectFields p={p} sort={p.sort} tags={tags} /></EditPanel>
                          <form action={deleteProject.bind(null, p.id)} className="self-start">
                            <ConfirmButton message={`Delete "${p.title}"? This removes the project and its image. A copy goes to the archive.`} className="btn btn-ghost btn-sm" label={`Delete ${p.title}`}><Trash2 size={14} /></ConfirmButton>
                          </form>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <AddPanel title="Add project" action={addProject}><ProjectFields sort={projects.length + 1} tags={tags} /></AddPanel>

              <h3 className="mb-3 mt-12 text-sm font-medium">Tags</h3>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => {
                  const used = tagUse[t]?.length ?? 0;
                  return (
                    <span key={t} className="inline-flex items-center gap-2 rounded-full border border-line py-1 pl-3 pr-1 text-sm">
                      {t}<span className="font-mono text-xs text-muted" title="Projects using this tag">{used}</span>
                      <form action={deleteTag.bind(null, t)} className="flex">
                        <ConfirmButton message={used ? `Delete the tag "${t}"? It comes off ${plural(used, "project")}.` : `Delete the tag "${t}"?`} className="rounded-full p-1.5 text-muted hover:text-ink" label={`Delete tag ${t}`}><X size={14} /></ConfirmButton>
                      </form>
                    </span>
                  );
                })}
                <form action={addTag} className="flex items-center gap-2">
                  <input name="name" required maxLength={100} placeholder="New tag" aria-label="New tag name" className={`${input} w-40`} />
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Adding…"><Plus size={14} /> Add tag</SubmitButton>
                </form>
              </div>
            </section>

            {/* Team */}
            <section id="team" aria-labelledby="team-title" className="scroll-mt-20">
              <SectionHead id="team" title="Team" meta={plural(team.length, "member")} />
              {team.length === 0 ? (
                <Empty>No team members yet. The Team section stays hidden on the site until you add one.</Empty>
              ) : (
                <ul className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {team.map((m) => (
                    <li key={m.id} className="overflow-hidden rounded-2xl bg-surface">
                      {m.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, optimisation not worth it
                        <img src={m.photo_url} alt="" className="aspect-[4/5] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[4/5] items-center justify-center gap-2 bg-paper text-sm text-muted"><ImageOff size={16} /> No photo</div>
                      )}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-display text-xl leading-tight">{m.name}</h3>
                            <p className="mt-1 text-sm text-accent">{m.role}</p>
                          </div>
                          <span className="pt-1 font-mono text-xs text-muted" title="Display order">#{m.sort}</span>
                        </div>
                        <p className="mt-2 truncate text-sm text-muted">{m.link ?? "No profile link"}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <EditPanel action={updateTeamMember.bind(null, m.id)}><TeamFields m={m} sort={m.sort} /></EditPanel>
                          <form action={deleteTeamMember.bind(null, m.id)} className="self-start">
                            <ConfirmButton message={`Remove ${m.name} from the team? Their photo is deleted for good.`} className="btn btn-ghost btn-sm" label={`Remove ${m.name}`}><Trash2 size={14} /></ConfirmButton>
                          </form>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <AddPanel title="Add member" action={addTeamMember}><TeamFields sort={team.length + 1} /></AddPanel>
            </section>

        </div>
    </>
  );
}
