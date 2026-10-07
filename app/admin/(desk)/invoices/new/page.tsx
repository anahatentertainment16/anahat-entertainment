import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin";
import { billableProjects } from "@/lib/invoices";
import { todayIST } from "@/lib/format";
import { PageHeader } from "@/app/admin/ui";
import InvoiceEditor from "../InvoiceEditor";
import { createInvoice } from "../actions";

export const metadata: Metadata = { title: "New invoice" };

// ?project=<id> preselects the project (from a project page's "New invoice" button).
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const me = await requireStaff();
  const projects = await billableProjects(me);
  const pick = Number((await searchParams).project);
  return (
    <>
      <PageHeader title="New invoice" description="Saved as a draft with the next invoice number. You can edit it until it's paid." />
      <InvoiceEditor
        projects={projects.map((p) => ({ id: p.id, label: `${p.name} / ${p.project}` }))}
        values={{ client_id: projects.some((p) => p.id === pick) ? pick : null, issued_on: todayIST(), due_on: null, items: [], tax_rate: 0, notes: null }}
        action={createInvoice}
        submitLabel="Create invoice"
      />
    </>
  );
}
