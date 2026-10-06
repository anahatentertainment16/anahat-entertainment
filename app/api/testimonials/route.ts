import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, name, org, quote")
    .eq("approved", true)
    .order("created_at", { ascending: false });
  if (error) console.error("Testimonials load error:", error.message);
  return Response.json(data ?? []);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });
  const { name, org, quote, website } = body;
  // Honeypot: hidden field real visitors never fill. Pretend success so bots don't retry.
  if (website) return Response.json({ ok: true });

  if (!name || !quote) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (typeof name !== "string" || name.length > 200) {
    return Response.json({ error: "Invalid name" }, { status: 400 });
  }
  if (typeof quote !== "string" || quote.length < 10 || quote.length > 2000) {
    return Response.json({ error: "Quote must be 10-2000 characters" }, { status: 400 });
  }

  const { error } = await supabase
    .from("testimonials")
    .insert({ name: name.trim(), org: org ? String(org).slice(0, 200) : null, quote: quote.trim() });
  if (error) {
    console.error("Testimonial insert error:", error.message);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
