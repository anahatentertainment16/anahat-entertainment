import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { billableProjects, statusChip, totals, STATUS_LABEL, type Invoice } from "@/lib/invoices";
import { fmtDay, fmtMoney } from "@/lib/format";
import { Empty, PageHeader } from "@/app/admin/ui";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const me = await requireStaff();
  const projects = await billableProjects(me);
  let q = supabase.from("invoices").select("*").order("issued_on", { ascending: false }).order("number", { ascending: false });
  if (!me.isSuper) q = q.in("client_id", projects.map((p) => p.id));
  const invoices = ((await q).data ?? []) as Invoice[];
  const sum = (s: Invoice["status"]) => invoices.filter((i) => i.status === s).reduce((n, i) => n + totals(i.items, i.tax_rate).total, 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`${fmtMoney(sum("sent"))} sent and awaiting payment, ${fmtMoney(sum("paid"))} paid.${me.isSuper ? "" : " Showing invoices for projects you lead."}`}
      >
        {projects.length > 0 && <Link href="/admin/invoices/new" className="btn btn-solid btn-sm"><Plus size={14} /> New invoice</Link>}
      </PageHeader>

      {invoices.length === 0 ? (
        <Empty>{projects.length ? "No invoices yet. Create one for any client project." : "Invoices are made for client projects. You don't lead any projects yet."}</Empty>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <Link href={`/admin/invoices/${inv.id}`} className="grid gap-x-6 gap-y-1 py-4 hover:bg-surface md:grid-cols-[130px_minmax(0,1fr)_120px_90px_140px] md:items-center md:px-4">
                <span className="font-mono text-sm">{inv.number}</span>
                <span className="min-w-0 truncate"><span className="font-medium">{inv.bill_name}</span> <span className="text-muted">/ {inv.project_label}</span></span>
                <span className="text-sm text-muted">{fmtDay(inv.issued_on)}</span>
                <span><span className={statusChip(inv.status)}>{STATUS_LABEL[inv.status]}</span></span>
                <span className="font-mono text-sm tabular-nums md:text-right">{fmtMoney(totals(inv.items, inv.tax_rate).total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
