"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { totals, type InvoiceItem } from "@/lib/invoice-math";
import { fmtMoney } from "@/lib/format";
import SubmitButton from "@/app/admin/SubmitButton";

type Row = { key: number; description: string; qty: string; rate: string };
export type EditorValues = { client_id: number | null; issued_on: string; due_on: string | null; items: InvoiceItem[]; tax_rate: number; notes: string | null };

const label = "flex flex-col gap-1 text-sm text-muted";
const input = "field text-ink";
let nextKey = 0;
const toRow = (i?: Partial<InvoiceItem>): Row => ({ key: nextKey++, description: i?.description ?? "", qty: String(i?.qty ?? 1), rate: i?.rate != null ? String(i.rate) : "" });

// Line-item editor with live totals. Rows travel to the server as one JSON field; the server re-validates.
export default function InvoiceEditor({ projects, values, action, submitLabel }: {
  projects: { id: number; label: string }[];
  values: EditorValues;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [rows, setRows] = useState<Row[]>(() => (values.items.length ? values.items.map(toRow) : [toRow()]));
  const [tax, setTax] = useState(String(values.tax_rate));
  const items = rows.map((r) => ({ description: r.description.trim(), qty: Number(r.qty), rate: Number(r.rate) }));
  const t = totals(items, Number(tax));
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid gap-x-6 gap-y-5 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
        <label className={label}>Client project
          <select name="client_id" required defaultValue={values.client_id ?? ""} className={input}>
            <option value="" disabled>{projects.length ? "Choose a project" : "No projects you can bill"}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className={label}>Issue date<input name="issued_on" type="date" required defaultValue={values.issued_on} className={input} /></label>
        <label className={label}>Due date (optional)<input name="due_on" type="date" defaultValue={values.due_on ?? ""} className={input} /></label>
      </div>

      <fieldset>
        <legend className="mb-3 font-display text-xl tracking-tight">Line items</legend>
        <div className="hidden grid-cols-[minmax(0,1fr)_90px_140px_130px_40px] gap-4 pb-2 text-xs text-muted md:grid">
          <span>Description</span><span>Qty</span><span>Rate (₹)</span><span className="text-right">Amount</span><span />
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r, i) => (
            <li key={r.key} className="grid grid-cols-[1fr_1fr] gap-x-4 gap-y-2 py-3 md:grid-cols-[minmax(0,1fr)_90px_140px_130px_40px] md:items-center">
              <input aria-label={`Line ${i + 1} description`} placeholder="Brand film, 60s edit" required maxLength={300} value={r.description} onChange={(e) => set(r.key, { description: e.target.value })} className={`${input} col-span-2 md:col-span-1`} />
              <input aria-label={`Line ${i + 1} quantity`} type="number" min="0.01" step="0.01" required value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} className={input} />
              <input aria-label={`Line ${i + 1} rate in rupees`} type="number" min="0" step="0.01" required placeholder="0.00" value={r.rate} onChange={(e) => set(r.key, { rate: e.target.value })} className={input} />
              <span className="self-center text-right font-mono text-sm tabular-nums">{fmtMoney((Number(r.qty) || 0) * (Number(r.rate) || 0))}</span>
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} disabled={rows.length === 1} aria-label={`Remove line ${i + 1}`} className="justify-self-end rounded-full p-2 text-muted hover:text-ink disabled:opacity-30">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setRows((rs) => [...rs, toRow()])} className="btn btn-ghost btn-sm mt-4"><Plus size={14} /> Add line</button>
      </fieldset>

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_300px]">
        <label className={label}>Notes (optional, printed on the invoice)
          <textarea name="notes" rows={4} maxLength={2000} defaultValue={values.notes ?? ""} placeholder="Payment details, bank account, terms" className={input} />
        </label>
        <div className="space-y-3 rounded-2xl bg-surface p-6 text-sm">
          <label className={label}>GST %<input name="tax_rate" type="number" min="0" max="100" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} className={input} /></label>
          <p className="flex justify-between pt-2"><span className="text-muted">Subtotal</span><span className="font-mono tabular-nums">{fmtMoney(t.subtotal)}</span></p>
          <p className="flex justify-between"><span className="text-muted">GST</span><span className="font-mono tabular-nums">{fmtMoney(t.tax)}</span></p>
          <p className="flex justify-between border-t border-line pt-3 text-base font-medium"><span>Total</span><span className="font-mono tabular-nums">{fmtMoney(t.total)}</span></p>
        </div>
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
