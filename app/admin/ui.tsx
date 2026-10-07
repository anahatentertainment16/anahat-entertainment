import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { Check, LogOut, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Me } from "@/lib/admin";
import AdminNav, { type NavItem } from "./AdminNav";
import SubmitButton from "./SubmitButton";

// Shape rule for admin pages: buttons are pills (.btn), cards are 16px, inputs are underlines (.field).
export const label = "flex flex-col gap-1 text-sm text-muted";
export const input = "field text-ink";
export const formGrid = "grid gap-x-6 gap-y-5 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]";
export const summary = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

export { fmtDate, fmtTime, plural } from "@/lib/format";

const navItems = (me: Me, c: { projects?: number; todos?: number; suggested?: number; testimonials?: number } = {}): NavItem[] => [
  { href: "/admin", title: "Overview", icon: "overview" },
  { href: "/admin/clients", title: "Clients", icon: "clients", count: c.projects },
  { href: "/admin/todos", title: "Todos", icon: "todos", count: c.todos, flag: !!c.suggested },
  { href: "/admin/invoices", title: "Invoices", icon: "invoices" },
  { href: "/admin/payouts", title: me.isSuper ? "Payouts" : "My payouts", icon: "payouts" },
  ...(me.isSuper ? [
    { href: "/admin/site", title: "Website", icon: "site", count: c.testimonials, flag: !!c.testimonials } as NavItem,
    { href: "/admin/staff", title: "Staff", icon: "staff" } as NavItem,
    { href: "/admin/archive", title: "Archive", icon: "archive" } as NavItem,
  ] : []),
];

// Counts stream in after the shell paints, so they never hold up the page.
async function NavWithCounts({ me }: { me: Me }) {
  let suggestedQ = supabase.from("todos").select("id", { count: "exact", head: true }).eq("status", "suggested");
  let projectsQ = supabase.from("clients").select("id", { count: "exact", head: true });
  if (!me.isSuper) {
    suggestedQ = suggestedQ.eq("assignee_id", me.id);
    projectsQ = projectsQ.eq("admin_id", me.id);
  }
  const [open, suggested, projects, pendingT] = await Promise.all([
    supabase.from("todos").select("id", { count: "exact", head: true }).eq("status", "open").eq("assignee_id", me.id),
    suggestedQ,
    projectsQ,
    me.isSuper ? supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("approved", false).eq("declined", false) : null,
  ]);
  return <AdminNav items={navItems(me, {
    projects: projects.count ?? 0,
    todos: (open.count ?? 0) + (suggested.count ?? 0),
    suggested: suggested.count ?? 0,
    testimonials: pendingT?.count ?? 0,
  })} />;
}

// App frame, rendered once by the (desk) layout: it stays put while pages change beside it.
export function AdminShell({ me, children }: { me: Me; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[248px_1fr] print:block">
      <aside className="print:hidden border-b border-line px-4 pb-3 pt-4 lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
        <div className="mb-3 flex items-center justify-between gap-4 lg:mb-10 lg:block">
          <Link href="/admin" className="block leading-tight">
            <span className="font-display text-lg tracking-tight">Anahat</span>
            <span className="block text-xs text-muted">Studio desk</span>
          </Link>
        </div>
        <Suspense fallback={<AdminNav items={navItems(me)} />}><NavWithCounts me={me} /></Suspense>
        <div className="mt-auto hidden border-t border-line pt-5 lg:block">
          <p className="truncate text-sm font-medium">{me.name}</p>
          <p className="truncate text-xs text-muted">{me.isSuper ? "Super admin" : "Admin"}{me.title && ` / ${me.title}`}</p>
          <SignOutButton redirectUrl="/">
            <button className="btn btn-ghost btn-sm mt-4 w-full justify-center"><LogOut size={14} /> Log out</button>
          </SignOutButton>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-12 print:p-0">
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>
    </div>
  );
}

// One header pattern for every admin page: title, one plain sentence, optional actions on the right.
export const PageHeader = ({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) => (
  <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
    <div className="min-w-0 max-w-2xl">
      <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
      {description && <p className="mt-3 text-muted">{description}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </header>
);

export const SectionHead = ({ id, title, meta }: { id: string; title: string; meta: string }) => (
  <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
    <h2 id={`${id}-title`} className="font-display text-2xl tracking-tight md:text-3xl">{title}</h2>
    <span className="text-sm text-muted">{meta}</span>
  </div>
);

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted text-balance">{children}</p>
);

// Dashed tile that opens into the add form. ponytail: native <details>, no client state
export const AddPanel = ({ title, action, children }: { title: string; action: (fd: FormData) => Promise<void>; children: React.ReactNode }) => (
  <details className="group mt-6 rounded-2xl border border-dashed border-line transition-colors open:border-solid open:bg-surface">
    <summary className={`${summary} flex items-center gap-2 px-6 py-5 text-sm font-medium hover:text-accent`}>
      <Plus size={16} className="transition-transform group-open:rotate-45" /> {title}
    </summary>
    <form action={action} className={`${formGrid} px-6 pb-6`}>
      {children}
      <div className="col-span-full"><SubmitButton>{title}</SubmitButton></div>
    </form>
  </details>
);

export const EditPanel = ({ action, children }: { action: (fd: FormData) => Promise<void>; children: React.ReactNode }) => (
  <details className="group min-w-0 flex-1">
    <summary className={`${summary} text-sm text-muted underline-offset-4 hover:text-ink hover:underline group-open:text-ink`}>Edit</summary>
    <form action={action} className={`${formGrid} mt-5 border-t border-line pt-5`}>
      {children}
      <div className="col-span-full"><SubmitButton><Check size={14} /> Save changes</SubmitButton></div>
    </form>
  </details>
);
