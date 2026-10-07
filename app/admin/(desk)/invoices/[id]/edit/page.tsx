import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { billableProjects, requireInvoice } from "@/lib/invoices";
import { PageHeader } from "@/app/admin/ui";
import InvoiceEditor from "../../InvoiceEditor";
import { updateInvoice } from "../../actions";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { me, invoice } = await requireInvoice(id);
  if (invoice.status === "paid" || invoice.status === "void") redirect(`/admin/invoices/${id}`);
  const projects = await billableProjects(me);
  return (
    <>
      <PageHeader title={`Edit ${invoice.number}`} description="The number stays the same. Bill-to details refresh from the project you pick." />
      <InvoiceEditor
        projects={projects.map((p) => ({ id: p.id, label: `${p.name} / ${p.project}` }))}
        values={invoice}
        action={updateInvoice.bind(null, id)}
        submitLabel="Save invoice"
      />
    </>
  );
}
