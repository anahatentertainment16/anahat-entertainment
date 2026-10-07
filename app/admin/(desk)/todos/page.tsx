import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { listStaff, requireStaff } from "@/lib/admin";
import { AddPanel, PageHeader, input, label, plural, summary } from "@/app/admin/ui";
import TodoList, { type Todo } from "./TodoList";
import { addTodo } from "./actions";

export const metadata: Metadata = { title: "Todos" };

export default async function TodosPage() {
  const me = await requireStaff();
  let todosQ = supabase.from("todos").select("*").order("created_at", { ascending: false });
  let clientsQ = supabase.from("clients").select("id, name, project").order("name").order("project");
  if (!me.isSuper) {
    todosQ = todosQ.eq("assignee_id", me.id);
    clientsQ = clientsQ.eq("admin_id", me.id);
  }
  const [todosRes, staff, clientsRes] = await Promise.all([todosQ, listStaff(), clientsQ]);
  const todos = (todosRes.data ?? []) as Todo[];
  const clientList = ((clientsRes.data ?? []) as { id: number; name: string; project: string }[]).map((c) => ({ id: c.id, name: `${c.name} / ${c.project}` }));
  const clients = Object.fromEntries(clientList.map((c) => [c.id, c.name]));

  const suggested = todos.filter((t) => t.status === "suggested");
  const open = todos.filter((t) => t.status === "open");
  const mine = open.filter((t) => t.assignee_id === me.id);
  const team = open.filter((t) => t.assignee_id !== me.id);
  const done = todos.filter((t) => t.status === "done");
  const list = { me, staff, clients };

  return (
    <>
      <PageHeader
        title="Todos"
        description={`${plural(mine.length, "open todo")} on your list${suggested.length ? `, ${plural(suggested.length, "suggestion")} from client messages to accept or dismiss` : ""}.${me.isSuper ? " Assign any todo to anyone on the team." : ""}`}
      />

      {suggested.length > 0 && (
        <section className="mb-12">
          <h3 className="mb-3 text-sm font-medium">Suggested from client messages</h3>
          <TodoList todos={suggested} {...list} empty="" />
        </section>
      )}

      <section className="mb-12">
        <h3 className="mb-3 text-sm font-medium">My todos</h3>
        <TodoList todos={mine} {...list} empty="Nothing on your list. Add one below." />
        <AddPanel title="Add todo" action={addTodo}>
          <label className={`${label} col-span-full`}>Todo<input name="title" required maxLength={300} className={input} /></label>
          {me.isSuper && (
            <label className={label}>Assign to
              <select name="assignee" defaultValue={me.id} className={input}>
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.title && ` (${s.title})`}</option>)}
              </select>
            </label>
          )}
          <label className={label}>Client project (optional)
            <select name="client_id" defaultValue="" className={input}>
              <option value="">None</option>
              {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </AddPanel>
      </section>

      {me.isSuper && (
        <section className="mb-12">
          <h3 className="mb-3 text-sm font-medium">Team todos</h3>
          <TodoList todos={team} {...list} empty="No open todos on the team." />
        </section>
      )}

      {done.length > 0 && (
        <details className="group">
          <summary className={`${summary} text-sm text-muted hover:text-ink`}>
            <span className="inline-block transition-transform group-open:rotate-90">&rsaquo;</span> Done ({plural(done.length, "todo")})
          </summary>
          <div className="mt-3 opacity-75"><TodoList todos={done} {...list} empty="" /></div>
        </details>
      )}
    </>
  );
}
