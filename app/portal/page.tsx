import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { domainTitle } from "@/lib/admin";
import { fmtTime } from "@/lib/format";
import { myClients, portalUser } from "@/lib/portal";
import PortalHeader from "./PortalHeader";

type Msg = { client_id: number; author_id: string | null; created_at: string };

// Project picker. One project = straight into it.
export default async function PortalHome() {
  const [{ user, emails }, clients] = await Promise.all([portalUser(), myClients()]);
  if (clients.length === 1) redirect(`/portal/${clients[0].id}`);

  const { data } = clients.length
    ? await supabase.from("messages").select("client_id, author_id, created_at").in("client_id", clients.map((c) => c.id)).order("created_at", { ascending: false })
    : { data: [] };
  const latest = new Map<number, Msg>();
  for (const m of (data ?? []) as Msg[]) if (!latest.has(m.client_id)) latest.set(m.client_id, m);

  return (
    <main className="min-h-[100dvh] px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[1080px]">
        <PortalHeader email={emails[0]} />
        <h1 className="mt-14 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">Hi {clients[0]?.name ?? user.firstName ?? "there"}.</h1>

        {clients.length === 0 ? (
          <div className="mt-6 max-w-xl rounded-2xl bg-surface p-6">
            <h2 className="font-display text-xl tracking-tight">No projects linked to this email yet</h2>
            <p className="mt-2 text-muted">
              You&rsquo;re signed in as {emails[0] ?? "an unverified email"}. If we set you up with a different address, log out and sign in with that one.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-muted">Your projects with us. Open one to share files and write to the team.</p>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {clients.map((c) => {
                const m = latest.get(c.id);
                const reply = m?.author_id;
                return (
                  <li key={c.id}>
                    <Link href={`/portal/${c.id}`} className="group flex h-full flex-col rounded-2xl bg-surface p-6 transition-transform hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-4">
                        {c.domain ? <span className="rounded-full border border-line px-3 py-0.5 text-xs">{domainTitle(c.domain)}</span> : <span />}
                        <ArrowUpRight size={20} className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                      <h2 className="mt-8 font-display text-2xl leading-tight tracking-tight">{c.project}</h2>
                      <p className="mt-2 text-sm text-muted">
                        {reply ? <span className="font-medium text-accent">The team replied</span> : m ? "Sent, the team will reply here" : "No messages yet"}
                        {m && <> / {fmtTime(m.created_at)}</>}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
