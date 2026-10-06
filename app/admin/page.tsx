import { revalidatePath } from "next/cache";
import { SignOutButton } from "@clerk/nextjs";
import { supabase, PROJECT_BUCKET } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { Check, ImageOff, LogOut, Mail, Plus, Trash2, X } from "lucide-react";
import ConfirmButton from "./ConfirmButton";

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
  tag: string;
  description: string;
  image_url: string | null;
  image_path: string | null;
  sort: number;
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
  const [inquiries, testimonials, projects, team] = await Promise.all([
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("*").order("approved").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("sort").order("created_at"),
    supabase.from("team").select("*").order("sort").order("created_at"),
  ]);
  const error = inquiries.error ?? testimonials.error ?? projects.error ?? team.error;
  if (error) console.error("Admin getData failed:", error.message);
  return {
    inquiries: (inquiries.data ?? []) as Inquiry[],
    testimonials: (testimonials.data ?? []) as Testimonial[],
    projects: (projects.data ?? []) as Project[],
    team: (team.data ?? []) as Member[],
    error: error?.message ?? null,
    weekAgo: Date.now() - 7 * 864e5,
  };
}

async function approveTestimonial(id: number) {
  "use server";
  await requireAdmin();
  await supabase.from("testimonials").update({ approved: true, declined: false }).eq("id", id);
  revalidatePath("/admin");
}

// Decline (pending) and Remove (live) both archive rather than delete.
async function declineTestimonial(id: number) {
  "use server";
  await requireAdmin();
  await supabase.from("testimonials").update({ approved: false, declined: true }).eq("id", id);
  revalidatePath("/admin");
}

async function deleteTestimonial(id: number) {
  "use server";
  await requireAdmin();
  await supabase.from("testimonials").delete().eq("id", id).eq("declined", true);
  revalidatePath("/admin");
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

// Rendered as a public href, so only allow http(s) to block javascript: URLs.
const safeLink = (raw: FormDataEntryValue | null) => {
  const v = String(raw ?? "").trim();
  return v && /^https?:\/\//i.test(v) ? new URL(v).toString() : null;
};

// Shared by add and edit: the text fields, validated.
function projectFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const tag = String(formData.get("tag") ?? "").trim().slice(0, 100);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const sort = Number(formData.get("sort")) || 0;
  if (!title || !tag || !description) throw new Error("Title, tag and description are required");
  return { title, tag, description, sort, link: safeLink(formData.get("link")) };
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
  await requireAdmin();
  const fields = projectFields(formData);
  const { url: image_url, path: image_path } = await uploadImage(formData.get("image"));

  const { error } = await supabase.from("projects").insert({ ...fields, image_url, image_path });
  if (error) {
    if (image_path) await supabase.storage.from(PROJECT_BUCKET).remove([image_path]);
    throw new Error(`Project save failed: ${error.message}`);
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

// A new image replaces the old one, which is removed only once the row points at the new one.
async function updateProject(id: number, oldPath: string | null, formData: FormData) {
  "use server";
  await requireAdmin();
  const fields = projectFields(formData);
  const { url: image_url, path: image_path } = await uploadImage(formData.get("image"));

  const { error } = await supabase.from("projects").update(image_path ? { ...fields, image_url, image_path } : fields).eq("id", id);
  if (error) {
    if (image_path) await supabase.storage.from(PROJECT_BUCKET).remove([image_path]);
    throw new Error(`Project update failed: ${error.message}`);
  }
  if (image_path && oldPath) await supabase.storage.from(PROJECT_BUCKET).remove([oldPath]);
  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteProject(id: number, imagePath: string | null) {
  "use server";
  await requireAdmin();
  await supabase.from("projects").delete().eq("id", id);
  if (imagePath) await supabase.storage.from(PROJECT_BUCKET).remove([imagePath]);
  revalidatePath("/admin");
  revalidatePath("/");
}

async function addTeamMember(formData: FormData) {
  "use server";
  await requireAdmin();
  const fields = teamFields(formData);
  // ponytail: team photos share the projects bucket under team/, own bucket if access rules ever differ
  const { url: photo_url, path: photo_path } = await uploadImage(formData.get("photo"), "team/");

  const { error } = await supabase.from("team").insert({ ...fields, photo_url, photo_path });
  if (error) {
    if (photo_path) await supabase.storage.from(PROJECT_BUCKET).remove([photo_path]);
    throw new Error(`Team member save failed: ${error.message}`);
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

async function updateTeamMember(id: number, oldPath: string | null, formData: FormData) {
  "use server";
  await requireAdmin();
  const fields = teamFields(formData);
  const { url: photo_url, path: photo_path } = await uploadImage(formData.get("photo"), "team/");

  const { error } = await supabase.from("team").update(photo_path ? { ...fields, photo_url, photo_path } : fields).eq("id", id);
  if (error) {
    if (photo_path) await supabase.storage.from(PROJECT_BUCKET).remove([photo_path]);
    throw new Error(`Team member update failed: ${error.message}`);
  }
  if (photo_path && oldPath) await supabase.storage.from(PROJECT_BUCKET).remove([oldPath]);
  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteTeamMember(id: number, photoPath: string | null) {
  "use server";
  await requireAdmin();
  await supabase.from("team").delete().eq("id", id);
  if (photoPath) await supabase.storage.from(PROJECT_BUCKET).remove([photoPath]);
  revalidatePath("/admin");
  revalidatePath("/");
}

// Shape rule for this page: buttons are pills (.btn), cards are 16px, inputs are underlines (.field).
const label = "flex flex-col gap-1 text-sm text-muted";
const input = "field text-ink";
const fileInput = "text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-ink";
const formGrid = "grid gap-x-6 gap-y-5 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]";
const summary = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Add and edit share these fields; edit passes the current row as defaults.
const ProjectFields = ({ p, sort }: { p?: Project; sort: number }) => (
  <>
    <label className={label}>Title<input name="title" required maxLength={200} defaultValue={p?.title} className={input} /></label>
    <label className={label}>Tag<input name="tag" required maxLength={100} placeholder="Web Application" defaultValue={p?.tag} className={input} /></label>
    <label className={label}>Link (optional)<input name="link" type="url" placeholder="https://" defaultValue={p?.link ?? ""} className={input} /></label>
    <label className={label}>Order<input name="sort" type="number" defaultValue={sort} className={input} /></label>
    <label className={`${label} col-span-full`}>Description<textarea name="description" required rows={3} maxLength={2000} defaultValue={p?.description} className={input} /></label>
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

const SectionHead = ({ id, title, meta }: { id: string; title: string; meta: string }) => (
  <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
    <h2 id={`${id}-title`} className="font-display text-3xl tracking-tight md:text-4xl">{title}</h2>
    <span className="text-sm text-muted">{meta}</span>
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">{children}</p>
);

// Dashed tile that opens into the add form. ponytail: native <details>, no client state
const AddPanel = ({ title, action, children }: { title: string; action: (fd: FormData) => Promise<void>; children: React.ReactNode }) => (
  <details className="group mt-6 rounded-2xl border border-dashed border-line transition-colors open:border-solid open:bg-surface">
    <summary className={`${summary} flex items-center gap-2 px-6 py-5 text-sm font-medium hover:text-accent`}>
      <Plus size={16} className="transition-transform group-open:rotate-45" /> {title}
    </summary>
    <form action={action} className={`${formGrid} px-6 pb-6`}>
      {children}
      <div className="col-span-full"><button type="submit" className="btn btn-solid btn-sm">{title}</button></div>
    </form>
  </details>
);

const EditPanel = ({ action, children }: { action: (fd: FormData) => Promise<void>; children: React.ReactNode }) => (
  <details className="group min-w-0 flex-1">
    <summary className={`${summary} text-sm text-muted underline-offset-4 hover:text-ink hover:underline group-open:text-ink`}>Edit</summary>
    <form action={action} className={`${formGrid} mt-5 border-t border-line pt-5`}>
      {children}
      <div className="col-span-full"><button type="submit" className="btn btn-solid btn-sm"><Check size={14} /> Save changes</button></div>
    </form>
  </details>
);

export default async function AdminPage() {
  await requireAdmin();
  const { inquiries, testimonials, projects, team, error, weekAgo } = await getData();
  const pending = testimonials.filter((t) => !t.approved && !t.declined);
  const approved = testimonials.filter((t) => t.approved);
  const archived = testimonials.filter((t) => t.declined);
  const recent = inquiries.filter((i) => new Date(i.created_at).getTime() > weekAgo).length;

  const nav = [
    { id: "inquiries", title: "Inquiries", count: inquiries.length },
    { id: "testimonials", title: "Testimonials", count: pending.length, flag: pending.length > 0 },
    { id: "projects", title: "Projects", count: projects.length },
    { id: "team", title: "Team", count: team.length },
  ];

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
    <main className="min-h-[100dvh] px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-[1280px]">

        {/* Header: the page's job is "what needs me", so the headline is built from live counts */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-10">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm text-muted">Anahat Entertainment admin</p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
              {pending.length > 0 ? (
                <><a href="#testimonials" className="text-accent u-link">{plural(pending.length, "testimonial")}</a> waiting for a decision.</>
              ) : "Nothing waiting on you."}
            </h1>
            <p className="mt-4 text-base text-muted">
              {recent > 0 ? `${plural(recent, "new inquiry", "new inquiries")} in the last 7 days.` : "No new inquiries in the last 7 days."}
            </p>
          </div>
          <SignOutButton redirectUrl="/">
            <button className="btn btn-ghost btn-sm"><LogOut size={14} /> Log out</button>
          </SignOutButton>
        </header>

        {error && (
          <div role="alert" className="mt-8 rounded-2xl border border-accent/50 bg-accent/10 px-6 py-4 text-sm">
            <p className="font-medium">Couldn&rsquo;t load data from the database.</p>
            <p className="mt-1 text-muted">Check the Supabase connection, then reload. Details: {error}</p>
          </div>
        )}

        <div className="mt-10 lg:grid lg:grid-cols-[200px_1fr] lg:gap-16">
          {/* Section rail: sticky on desktop, a scrollable strip on mobile */}
          <nav aria-label="Admin sections" className="sticky top-0 z-10 -mx-4 mb-10 overflow-x-auto border-b border-line bg-paper px-4 lg:top-10 lg:mx-0 lg:mb-0 lg:self-start lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0">
            <ul className="flex gap-6 lg:flex-col lg:gap-1">
              {nav.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center justify-between gap-3 whitespace-nowrap py-3 text-sm hover:text-accent lg:rounded-full lg:px-4 lg:py-2 lg:hover:bg-surface">
                    {s.title}
                    <span className={`font-mono text-xs ${s.flag ? "rounded-full bg-accent px-2 py-0.5 text-on-accent" : "text-muted"}`}>{s.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-24">

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
                            <summary className={`${summary} line-clamp-2 whitespace-pre-wrap text-[15px] leading-relaxed text-muted group-open:line-clamp-none group-open:text-ink`}>{row.message}</summary>
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
                            <p className="text-sm text-accent">{p.tag}</p>
                            <h3 className="mt-1 font-display text-xl leading-tight">{p.title}</h3>
                          </div>
                          <span className="pt-1 font-mono text-xs text-muted" title="Display order">#{p.sort}</span>
                        </div>
                        <p className="mt-2 truncate text-sm text-muted">{p.link ?? "In development"}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <EditPanel action={updateProject.bind(null, p.id, p.image_path)}><ProjectFields p={p} sort={p.sort} /></EditPanel>
                          <form action={deleteProject.bind(null, p.id, p.image_path)} className="self-start">
                            <ConfirmButton message={`Delete "${p.title}"? This removes the project and its image for good.`} className="btn btn-ghost btn-sm" label={`Delete ${p.title}`}><Trash2 size={14} /></ConfirmButton>
                          </form>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <AddPanel title="Add project" action={addProject}><ProjectFields sort={projects.length + 1} /></AddPanel>
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
                          <EditPanel action={updateTeamMember.bind(null, m.id, m.photo_path)}><TeamFields m={m} sort={m.sort} /></EditPanel>
                          <form action={deleteTeamMember.bind(null, m.id, m.photo_path)} className="self-start">
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
        </div>
      </div>
    </main>
  );
}
