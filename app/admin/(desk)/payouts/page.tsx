import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { listStaff, requireStaff, requireSuper, type Client } from "@/lib/admin";
import { fmtDay, fmtMoney, plural, todayIST } from "@/lib/format";
import ConfirmButton from "@/app/admin/ConfirmButton";
import SubmitButton from "@/app/admin/SubmitButton";
import { AddPanel, Empty, PageHeader, input, label } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Payouts" };

type Payout = {
  id: number;
  staff_id: string;
  staff_name: string;
  project_label: string | null;
  description: string;
  amount: number;
  status: "due" | "paid";
  paid_on: string | null;
  created_at: string;
};

// Super admins record what the studio owes each person; admins see their own, read-only.
async function addPayout(formData: FormData) {
  "use server";
  const me = await requireSuper();
  const staff = (await listStaff()).find((s) => s.id === formData.get("staff_id"));
  if (!staff) throw new Error("Choose who this is for");
  const description = String(formData.get("description") ?? "").trim().slice(0, 300);
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!description) throw new Error("Description is required");
  if (!(amount > 0 && amount <= 1e10)) throw new Error("Amount must be more than 0");
  const clientId = Number(formData.get("client_id")) || null;
  const { data: project } = clientId ? await supabase.from("clients").select("name, project").eq("id", clientId).maybeSingle<Pick<Client, "name" | "project">>() : { data: null };
  const { error } = await supabase.from("payouts").insert({
    staff_id: staff.id,
    staff_name: staff.name,
    client_id: project ? clientId : null,
    project_label: project ? `${project.name} / ${project.project}` : null,
    description,
    amount,
    created_by: me.id,
  });
  if (error) throw new Error(`Payout save failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

async function setPaid(id: number, paid: boolean) {
  "use server";
  await requireSuper();
  await supabase.from("payouts").update(paid ? { status: "paid", paid_on: todayIST() } : { status: "due", paid_on: null }).eq("id", id);
  revalidatePath("/admin", "layout");
}

async function deletePayout(id: number) {
  "use server";
  await requireSuper();
  await supabase.from("payouts").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}

const total = (list: Payout[]) => list.reduce((n, p) => n + Number(p.amount), 0);

export default async function PayoutsPage() {
  const me = await requireStaff();
  let q = supabase.from("payouts").select("*").order("created_at", { ascending: false });
  if (!me.isSuper) q = q.eq("staff_id", me.id);
  const [payoutsRes, staff, projectsRes] = await Promise.all([
    q,
    me.isSuper ? listStaff() : [],
    me.isSuper ? supabase.from("clients").select("id, name, project").order("name").order("project") : { data: [] },
  ]);
  const payouts = (payoutsRes.data ?? []) as Payout[];
  const projects = (projectsRes.data ?? []) as Pick<Client, "id" | "name" | "project">[];
  const due = payouts.filter((p) => p.status === "due");
  const paid = payouts.filter((p) => p.status === "paid");

  // Super admins get a per-person summary of what is still owed.
  const owed = Object.entries(Object.groupBy(due, (p) => p.staff_name)).map(([name, list]) => ({ name, amount: total(list ?? []), count: list?.length ?? 0 }));

  const row = (p: Payout) => (
    <li key={p.id} className="grid gap-x-6 gap-y-2 py-4 md:grid-cols-[minmax(0,1fr)_150px_auto] md:items-center">
      <div className="min-w-0">
        <p className="wrap-anywhere">{p.description}</p>
        <p className="text-xs text-muted">
          {me.isSuper && <>{p.staff_name} / </>}
          {p.project_label ?? "Not tied to a project"} / {p.status === "paid" && p.paid_on ? `paid ${fmtDay(p.paid_on)}` : `added ${fmtDay(p.created_at.slice(0, 10))}`}
        </p>
      </div>
      <span className="font-mono text-sm tabular-nums md:text-right">{fmtMoney(p.amount)}</span>
      {me.isSuper && (
        <div className="flex gap-2 md:justify-end">
          <form action={setPaid.bind(null, p.id, p.status === "due")}>
            {p.status === "due"
              ? <SubmitButton className="btn btn-sm bg-accent text-on-accent" pending="Saving…"><Check size={14} /> Mark paid</SubmitButton>
              : <SubmitButton className="btn btn-ghost btn-sm" pending="Saving…"><RotateCcw size={14} /> Mark due</SubmitButton>}
          </form>
          <form action={deletePayout.bind(null, p.id)}>
            <ConfirmButton message={`Delete this ${fmtMoney(p.amount)} payout for ${p.staff_name}?`} className="btn btn-ghost btn-sm" label="Delete payout"><Trash2 size={14} /></ConfirmButton>
          </form>
        </div>
      )}
    </li>
  );

  return (
    <>
      <PageHeader
        title={me.isSuper ? "Payouts" : "My payouts"}
        description={me.isSuper
          ? `${fmtMoney(total(due))} owed to the team across ${plural(due.length, "charge")}. ${fmtMoney(total(paid))} paid so far.`
          : `${fmtMoney(total(due))} due to you, ${fmtMoney(total(paid))} paid. Added by a super admin.`}
      />

      {me.isSuper && owed.length > 0 && (
        <ul className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {owed.map((o) => (
            <li key={o.name} className="rounded-2xl bg-surface p-5">
              <p className="text-sm text-muted">{o.name}</p>
              <p className="mt-1 font-display text-2xl tracking-tight tabular-nums">{fmtMoney(o.amount)}</p>
              <p className="text-xs text-muted">{plural(o.count, "charge")} due</p>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="due-title" className="mb-12">
        <h2 id="due-title" className="mb-3 font-display text-xl tracking-tight">Due</h2>
        {due.length === 0 ? <Empty>{me.isSuper ? "Nothing owed right now. Add a charge below." : "Nothing due to you right now."}</Empty> : <ul className="divide-y divide-line border-y border-line">{due.map(row)}</ul>}
        {me.isSuper && (
          <AddPanel title="Add payout" action={addPayout}>
            <label className={label}>Pay to
              <select name="staff_id" required defaultValue="" className={input}>
                <option value="" disabled>Choose a person</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title && ` (${s.title})`}</option>)}
              </select>
            </label>
            <label className={label}>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required className={input} /></label>
            <label className={label}>Project (optional)
              <select name="client_id" defaultValue="" className={input}>
                <option value="">Not tied to a project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} / {p.project}</option>)}
              </select>
            </label>
            <label className={`${label} col-span-full`}>What it&rsquo;s for<input name="description" required maxLength={300} placeholder="Edit and colour, brand film" className={input} /></label>
          </AddPanel>
        )}
      </section>

      {paid.length > 0 && (
        <section aria-labelledby="paid-title">
          <h2 id="paid-title" className="mb-3 font-display text-xl tracking-tight">Paid</h2>
          <ul className="divide-y divide-line border-y border-line opacity-80">{paid.map(row)}</ul>
        </section>
      )}
    </>
  );
}
