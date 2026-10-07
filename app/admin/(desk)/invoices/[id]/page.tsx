import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Pencil, Send, Trash2, X } from "lucide-react";
import { requireInvoice, statusChip, totals, STATUS_LABEL } from "@/lib/invoices";
import { EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";
import { fmtDay, fmtMoney } from "@/lib/format";
import ConfirmButton from "@/app/admin/ConfirmButton";
import SubmitButton from "@/app/admin/SubmitButton";
import PrintButton from "../PrintButton";
import { deleteInvoice, setInvoiceStatus } from "../actions";

export const metadata: Metadata = { title: "Invoice" };

// The invoice as a printable sheet. Everything outside the sheet is hidden when printing.
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { invoice: inv } = await requireInvoice(id);
  const t = totals(inv.items, inv.tax_rate);
  const final = inv.status === "paid" || inv.status === "void";
  const status = (s: string) => setInvoiceStatus.bind(null, id, s);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/admin/invoices" className="u-link inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> Invoices</Link>
        <div className="flex flex-wrap gap-2">
          {!final && <Link href={`/admin/invoices/${id}/edit`} className="btn btn-ghost btn-sm"><Pencil size={14} /> Edit</Link>}
          {inv.status === "draft" && <form action={status("sent")}><SubmitButton className="btn btn-ghost btn-sm" pending="Saving…"><Send size={14} /> Mark sent</SubmitButton></form>}
          {(inv.status === "draft" || inv.status === "sent") && <form action={status("paid")}><SubmitButton className="btn btn-ghost btn-sm" pending="Saving…"><Check size={14} /> Mark paid</SubmitButton></form>}
          {inv.status === "sent" && <form action={status("void")}><ConfirmButton message={`Void ${inv.number}? It stays on record but can't be edited or paid.`} className="btn btn-ghost btn-sm"><X size={14} /> Void</ConfirmButton></form>}
          {inv.status === "draft" && <form action={deleteInvoice.bind(null, id)}><ConfirmButton message={`Delete draft ${inv.number}?`} className="btn btn-ghost btn-sm" label="Delete draft"><Trash2 size={14} /></ConfirmButton></form>}
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto max-w-[820px] rounded-2xl bg-surface p-6 sm:p-12 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
          <div>
            <p className="font-display text-2xl tracking-tight">{SITE_NAME}</p>
            <p className="mt-1 text-sm text-muted">Pune, Maharashtra, India</p>
            <p className="text-sm text-muted">{EMAIL}</p>
            <p className="text-sm text-muted">{SITE_URL.replace("https://", "")}</p>
          </div>
          <div className="text-right">
            <h1 className="font-display text-4xl tracking-tight">Invoice</h1>
            <p className="mt-1 font-mono text-sm">{inv.number}</p>
            <p className="mt-2"><span className={`${statusChip(inv.status)} print:border print:border-line print:bg-transparent print:text-ink`}>{STATUS_LABEL[inv.status]}</span></p>
          </div>
        </header>

        <div className="grid gap-6 py-8 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="text-xs text-muted">Bill to</p>
            <p className="mt-1 font-medium">{inv.bill_name}</p>
            <p className="wrap-anywhere text-sm text-muted">{inv.bill_email}</p>
            <p className="mt-3 text-xs text-muted">Project</p>
            <p className="mt-1 text-sm">{inv.project_label}</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm sm:text-right">
            <dt className="text-muted">Issued</dt><dd>{fmtDay(inv.issued_on)}</dd>
            {inv.due_on && <><dt className="text-muted">Due</dt><dd>{fmtDay(inv.due_on)}</dd></>}
          </dl>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs text-muted">
                <th className="py-3 pr-4 font-normal">Description</th>
                <th className="py-3 pr-4 text-right font-normal">Qty</th>
                <th className="py-3 pr-4 text-right font-normal">Rate</th>
                <th className="py-3 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className="border-b border-line align-top">
                  <td className="wrap-anywhere py-3 pr-4">{item.description}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums">{item.qty}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums">{fmtMoney(item.rate)}</td>
                  <td className="py-3 text-right font-mono tabular-nums">{fmtMoney(item.qty * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-6 max-w-[300px] space-y-2 text-sm">
          <p className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-mono tabular-nums">{fmtMoney(t.subtotal)}</span></p>
          {Number(inv.tax_rate) > 0 && <p className="flex justify-between"><span className="text-muted">GST ({Number(inv.tax_rate)}%)</span><span className="font-mono tabular-nums">{fmtMoney(t.tax)}</span></p>}
          <p className="flex justify-between border-t border-line pt-3 text-lg font-medium"><span>Total</span><span className="font-mono tabular-nums">{fmtMoney(t.total)}</span></p>
        </div>

        {inv.notes && (
          <div className="mt-10 border-t border-line pt-6">
            <p className="text-xs text-muted">Notes</p>
            <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed">{inv.notes}</p>
          </div>
        )}
      </article>
    </>
  );
}
