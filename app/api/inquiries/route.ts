import { clientIp, overLimit, supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (await overLimit("inquiries", "ip", ip, 5, 10)) return Response.json({ error: "Too many requests, try again later" }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });
  const { service, name, email, company, message, website } = body;
  // Honeypot: hidden field real visitors never fill. Pretend success so bots don't retry.
  if (website) return Response.json({ ok: true });

  if (!service || !name || !email) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (typeof name !== "string" || name.length > 200) {
    return Response.json({ error: "Invalid name" }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  if (message && (typeof message !== "string" || message.length > 5000)) {
    return Response.json({ error: "Message too long" }, { status: 400 });
  }

  const { error } = await supabase.from("inquiries").insert({
    service: String(service).slice(0, 100),
    name: name.trim(),
    email: email.trim(),
    company: company ? String(company).slice(0, 200) : null,
    message: message ? String(message).slice(0, 5000) : null,
    ip,
  });
  if (error) {
    console.error("Inquiry insert error:", error.message);
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
