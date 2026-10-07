import "server-only";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireStaff, type Client, type Me } from "@/lib/admin";
import { round, type InvoiceItem } from "@/lib/invoice-math";

export { totals, type InvoiceItem } from "@/lib/invoice-math";

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type Invoice = {
  id: number;
  number: string;
  client_id: number | null;
  bill_name: string;
  bill_email: string;
  project_label: string;
  issued_on: string;
  due_on: string | null;
  items: InvoiceItem[];
  tax_rate: number;
  notes: string | null;
  status: InvoiceStatus;
  created_by: string;
  created_at: string;
};

// Status pill classes, shared by the list and the invoice page.
export const statusChip = (s: Invoice["status"]) =>
  `rounded-full px-3 py-0.5 text-xs ${s === "paid" ? "bg-ink text-paper" : s === "sent" ? "bg-accent text-on-accent" : s === "void" ? "border border-line text-muted line-through" : "border border-line"}`;

export const STATUS_LABEL: Record<InvoiceStatus, string> = { draft: "Draft", sent: "Sent", paid: "Paid", void: "Void" };

// Projects this person can bill: super admins all, admins the ones they lead.
export async function billableProjects(me: Me) {
  let q = supabase.from("clients").select("*").order("name").order("project");
  if (!me.isSuper) q = q.eq("admin_id", me.id);
  return ((await q).data ?? []) as Client[];
}

// Invoice visible to super admins, and to the admin who currently leads its project.
export async function requireInvoice(id: number) {
  const me = await requireStaff();
  const { data } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle<Invoice>();
  if (!data) notFound();
  if (!me.isSuper) {
    const { data: project } = data.client_id ? await supabase.from("clients").select("admin_id").eq("id", data.client_id).maybeSingle<{ admin_id: string | null }>() : { data: null };
    if (project?.admin_id !== me.id) notFound();
  }
  return { me, invoice: data };
}

// Validates the form: line items arrive as JSON from the client-side editor.
export function invoiceFields(formData: FormData) {
  let raw: unknown;
  try { raw = JSON.parse(String(formData.get("items") ?? "[]")); } catch { throw new Error("Line items are invalid"); }
  if (!Array.isArray(raw)) throw new Error("Line items are invalid");
  const items: InvoiceItem[] = raw.slice(0, 50).map((r) => ({
    description: String(r?.description ?? "").trim().slice(0, 300),
    qty: round(Number(r?.qty)),
    rate: round(Number(r?.rate)),
  })).filter((i) => i.description);
  if (!items.length) throw new Error("Add at least one line item");
  if (items.some((i) => !(i.qty > 0 && i.qty <= 1e6) || !(i.rate >= 0 && i.rate <= 1e10))) throw new Error("Each line needs a quantity above 0 and a rate of 0 or more");

  const day = (k: string) => { const v = String(formData.get(k) ?? ""); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; };
  const issued_on = day("issued_on");
  if (!issued_on) throw new Error("Issue date is required");
  const tax_rate = Number(formData.get("tax_rate") ?? 0);
  if (!(tax_rate >= 0 && tax_rate <= 100)) throw new Error("GST must be between 0 and 100%");
  return { items, issued_on, due_on: day("due_on"), tax_rate: round(tax_rate), notes: String(formData.get("notes") ?? "").trim().slice(0, 2000) || null };
}

// Next "INV-<year>-0001". The unique constraint catches the rare race; the caller retries.
export async function nextNumber(issuedOn: string) {
  const year = issuedOn.slice(0, 4);
  const { data } = await supabase.from("invoices").select("number").like("number", `INV-${year}-%`).order("number", { ascending: false }).limit(1).maybeSingle<{ number: string }>();
  const n = data ? Number(data.number.split("-")[2]) + 1 : 1;
  return `INV-${year}-${String(n).padStart(4, "0")}`;
}
