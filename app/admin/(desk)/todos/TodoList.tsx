import Link from "next/link";
import { Check, Circle, Sparkles, Trash2, X } from "lucide-react";
import type { Me, Staff } from "@/lib/admin";
import ConfirmButton from "@/app/admin/ConfirmButton";
import { Empty, input } from "@/app/admin/ui";
import { assignTodo, deleteTodo, setTodoStatus } from "./actions";

export type Todo = {
  id: number;
  title: string;
  assignee_id: string | null;
  created_by: string | null;
  client_id: number | null;
  status: "suggested" | "open" | "done";
  created_at: string;
};

// One list for every todo view. Suggestions get Accept/Dismiss; super admins get an assignee picker.
export default function TodoList({ todos, me, staff, clients, empty }: {
  todos: Todo[];
  me: Me;
  staff: Staff[];
  clients: Record<number, string>;
  empty: string;
}) {
  if (!todos.length) return <Empty>{empty}</Empty>;
  const nameOf = (id: string | null) => (id ? staff.find((s) => s.id === id)?.name ?? "Former staff" : "Unassigned");

  return (
    <ul className="divide-y divide-line border-y border-line">
      {todos.map((t) => {
        const done = t.status === "done";
        const canDelete = me.isSuper || t.created_by === me.id || t.status === "suggested";
        return (
          <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
            {t.status === "suggested" ? (
              <Sparkles size={16} className="shrink-0 text-accent" aria-label="Suggested from a client message" />
            ) : (
              <form action={setTodoStatus.bind(null, t.id, done ? "open" : "done")} className="flex">
                <button type="submit" className="-m-2 p-2 text-muted hover:text-ink" aria-label={done ? `Reopen ${t.title}` : `Mark ${t.title} done`}>
                  {done ? <Check size={16} className="text-accent" /> : <Circle size={16} />}
                </button>
              </form>
            )}
            <div className="min-w-0 flex-1">
              <p className={`wrap-anywhere ${done ? "text-muted line-through decoration-line" : ""}`}>{t.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {t.client_id && clients[t.client_id] && <><Link href={`/admin/clients/${t.client_id}`} className="u-link hover:text-ink">{clients[t.client_id]}</Link> / </>}
                {t.created_by ? `from ${nameOf(t.created_by)}` : "suggested from client message"}
                {me.isSuper && ` / ${nameOf(t.assignee_id)}`}
              </p>
            </div>
            {me.isSuper && (
              <form action={assignTodo.bind(null, t.id)} className="flex items-center gap-2">
                <select name="assignee" defaultValue={t.assignee_id ?? ""} aria-label={`Assign ${t.title}`} className={`${input} w-auto max-w-48`}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="submit" className="btn btn-ghost btn-sm">Assign</button>
              </form>
            )}
            {t.status === "suggested" && (
              <form action={setTodoStatus.bind(null, t.id, "open")}>
                <button type="submit" className="btn btn-sm bg-accent text-on-accent"><Check size={14} /> Accept</button>
              </form>
            )}
            {canDelete && (
              <form action={deleteTodo.bind(null, t.id)} className="flex">
                {t.status === "suggested" ? (
                  <button type="submit" className="btn btn-ghost btn-sm"><X size={14} /> Dismiss</button>
                ) : (
                  <ConfirmButton message={`Delete "${t.title}"?`} className="btn btn-ghost btn-sm" label={`Delete ${t.title}`}><Trash2 size={14} /></ConfirmButton>
                )}
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
