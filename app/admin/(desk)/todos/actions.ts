"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireClient, requireStaff, requireSuper } from "@/lib/admin";

// Bound ids/values arrive from the browser, so every action re-checks who may touch the row.
// Admins: only todos assigned to them. Super admins: everything.

export async function addTodo(formData: FormData) {
  const me = await requireStaff();
  const title = String(formData.get("title") ?? "").trim().slice(0, 300);
  if (!title) throw new Error("Todo title is required");
  const assignee_id = me.isSuper ? String(formData.get("assignee") ?? "") || null : me.id;
  const client_id = Number(formData.get("client_id")) || null;
  if (client_id) await requireClient(client_id);

  const { error } = await supabase.from("todos").insert({ title, assignee_id, client_id, created_by: me.id, status: "open" });
  if (error) throw new Error(`Todo save failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

// Accepting a suggestion and ticking a todo are both status changes.
export async function setTodoStatus(id: number, status: string) {
  const me = await requireStaff();
  if (status !== "open" && status !== "done") throw new Error("Invalid status");
  let q = supabase.from("todos").update({ status }).eq("id", id);
  if (!me.isSuper) q = q.eq("assignee_id", me.id);
  const { error } = await q;
  if (error) throw new Error(`Todo update failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

export async function assignTodo(id: number, formData: FormData) {
  await requireSuper();
  const assignee_id = String(formData.get("assignee") ?? "") || null;
  const { error } = await supabase.from("todos").update({ assignee_id }).eq("id", id);
  if (error) throw new Error(`Todo assign failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

// Admins can delete todos they wrote and dismiss suggestions; ones a super admin assigned stay put.
export async function deleteTodo(id: number) {
  const me = await requireStaff();
  let q = supabase.from("todos").delete().eq("id", id);
  if (!me.isSuper) q = q.eq("assignee_id", me.id).or(`created_by.eq."${me.id}",status.eq.suggested`);
  const { error } = await q;
  if (error) throw new Error(`Todo delete failed: ${error.message}`);
  revalidatePath("/admin", "layout");
}
