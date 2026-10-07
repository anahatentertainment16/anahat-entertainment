import "server-only";
import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/lib/admin";

export type ActivityKind = "joined" | "visit" | "message" | "upload";

// The signed-in user and their verified emails. A client sees every client row whose email is one of them.
// Proxy already requires a session on /portal; this is the per-page check.
export const portalUser = cache(async () => {
  const user = await currentUser();
  if (!user) redirect("/portal/sign-in");
  const emails = user.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress.toLowerCase());
  return { user, emails };
});

export const myClients = cache(async (): Promise<Client[]> => {
  const { emails } = await portalUser();
  if (!emails.length) return [];
  const { data } = await supabase.from("clients").select("*").in("email", emails).order("name");
  return (data ?? []) as Client[];
});

export async function requirePortalClient(id: number) {
  const client = (await myClients()).find((c) => c.id === id);
  if (!client) notFound();
  return client;
}

export async function logActivity(clientId: number, kind: ActivityKind, detail: string | null = null) {
  const { error } = await supabase.from("activity").insert({ client_id: clientId, kind, detail });
  if (error) console.error("Activity log failed:", error.message);
}

// First ever visit logs "joined"; after that one "visit" per 30 minutes so the log stays readable.
export async function logVisit(clientId: number) {
  const { data } = await supabase.from("activity").select("created_at").eq("client_id", clientId).in("kind", ["joined", "visit"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle<{ created_at: string }>();
  if (!data) return logActivity(clientId, "joined");
  if (Date.now() - new Date(data.created_at).getTime() > 30 * 60e3) return logActivity(clientId, "visit");
}
