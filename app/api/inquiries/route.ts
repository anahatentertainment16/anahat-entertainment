import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  const body = await request.json();
  const { service, name, email, company, message } = body;

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

  const sql = neon(process.env.DATABASE_URL!);

  // ponytail: init on first request; move to a migration script if schema changes
  await sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      service TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO inquiries (service, name, email, company, message)
    VALUES (${service.slice(0, 100)}, ${name.trim()}, ${email.trim()}, ${company ? String(company).slice(0, 200) : null}, ${message ? String(message).slice(0, 5000) : null})
  `;

  return Response.json({ ok: true });
}
