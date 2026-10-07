"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireClient, requireStaff } from "@/lib/admin";
import { invoiceFields, nextNumber, requireInvoice, type InvoiceStatus } from "@/lib/invoices";

// Bill-to details are copied onto the invoice, so it reads the same even if the client changes later.
async function billTo(formData: FormData) {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId)) throw new Error("Choose a client project");
  const { me, client } = await requireClient(clientId);
  if (!me.isSuper && client.admin_id !== me.id) throw new Error("You can only invoice projects you lead");
  return { client_id: client.id, bill_name: client.name, bill_email: client.email, project_label: client.project };
}

export async function createInvoice(formData: FormData) {
  const me = await requireStaff();
  const fields = { ...invoiceFields(formData), ...(await billTo(formData)), created_by: me.id };
  let id: number | null = null;
  for (let attempt = 0; attempt < 3 && id === null; attempt++) {
    const { data, error } = await supabase.from("invoices").insert({ ...fields, number: await nextNumber(fields.issued_on) }).select("id").single();
    if (!error) id = data.id;
    else if (error.code !== "23505") throw new Error(`Invoice save failed: ${error.message}`); // 23505 = number taken, retry
  }
  if (id === null) throw new Error("Couldn't reserve an invoice number, try again");
  revalidatePath("/admin", "layout");
  redirect(`/admin/invoices/${id}`);
}

// Paid and void invoices are final.
export async function updateInvoice(id: number, formData: FormData) {
  const { invoice } = await requireInvoice(id);
  if (invoice.status === "paid" || invoice.status === "void") throw new Error("Paid and void invoices can't be edited");
  const { error } = await supabase.from("invoices").update({ ...invoiceFields(formData), ...(await billTo(formData)) }).eq("id", id);
  if (error) throw new Error(`Invoice update failed: ${error.message}`);
  revalidatePath("/admin", "layout");
  redirect(`/admin/invoices/${id}`);
}

export async function setInvoiceStatus(id: number, status: string) {
  await requireInvoice(id);
  if (!["draft", "sent", "paid", "void"].includes(status)) throw new Error("Invalid status");
  const { error } = await supabase.from("invoices").update({ status: status as InvoiceStatus }).eq("id", id);
  if (error) throw new Error(`Invoice update failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

// Only drafts can be deleted; anything sent stays on record (mark it void instead).
export async function deleteInvoice(id: number) {
  const { invoice } = await requireInvoice(id);
  if (invoice.status !== "draft") throw new Error("Only drafts can be deleted. Mark it void instead.");
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/admin", "layout");
  redirect("/admin/invoices");
}
