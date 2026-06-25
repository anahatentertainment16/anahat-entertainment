import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`CREATE TABLE IF NOT EXISTS testimonials (id SERIAL PRIMARY KEY, name TEXT NOT NULL, org TEXT, quote TEXT NOT NULL, approved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`;
    const rows = await sql`SELECT id, name, org, quote FROM testimonials WHERE approved = TRUE ORDER BY created_at DESC`;
    return Response.json(rows);
  } catch {
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, org, quote } = body;

  if (!name || !quote) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (typeof name !== "string" || name.length > 200) {
    return Response.json({ error: "Invalid name" }, { status: 400 });
  }
  if (typeof quote !== "string" || quote.length < 10 || quote.length > 2000) {
    return Response.json({ error: "Quote must be 10-2000 characters" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`CREATE TABLE IF NOT EXISTS testimonials (id SERIAL PRIMARY KEY, name TEXT NOT NULL, org TEXT, quote TEXT NOT NULL, approved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`;
  await sql`INSERT INTO testimonials (name, org, quote) VALUES (${name.trim()}, ${org ? String(org).slice(0, 200) : null}, ${quote.trim()})`;
  return Response.json({ ok: true });
}
