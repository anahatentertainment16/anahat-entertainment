import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS, so it must never reach the browser.
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

export const PROJECT_BUCKET = "projects";

// ponytail: rate limit by counting the caller's recent rows in the table it writes to. No Redis; fine at this traffic.
export async function overLimit(table: string, column: string, value: string | number, max: number, minutes: number) {
  const since = new Date(Date.now() - minutes * 60e3).toISOString();
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value).gte("created_at", since);
  return (count ?? 0) >= max;
}

// Vercel sets x-forwarded-for to the real client IP (first entry); "unknown" callers share one bucket.
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
