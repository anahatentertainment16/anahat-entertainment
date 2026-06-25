import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import LogoutButton from "./LogoutButton";

type Inquiry = {
  id: number;
  service: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  created_at: string;
};

type Testimonial = {
  id: number;
  name: string;
  org: string | null;
  quote: string;
  approved: boolean;
  created_at: string;
};

async function getData() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [inquiries, testimonials] = await Promise.all([
      sql`SELECT * FROM inquiries ORDER BY created_at DESC`,
      sql`SELECT * FROM testimonials ORDER BY approved ASC, created_at DESC`,
    ]);
    return { inquiries: inquiries as Inquiry[], testimonials: testimonials as Testimonial[] };
  } catch {
    return { inquiries: [], testimonials: [] };
  }
}

async function approveTestimonial(id: number) {
  "use server";
  const sql = neon(process.env.DATABASE_URL!);
  await sql`UPDATE testimonials SET approved = TRUE WHERE id = ${id}`;
  revalidatePath("/admin");
}

async function deleteTestimonial(id: number) {
  "use server";
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM testimonials WHERE id = ${id}`;
  revalidatePath("/admin");
}

const cell: React.CSSProperties = { padding: "14px 16px 14px 0", fontSize: 13 };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 16px 10px 0", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C99A7F", fontWeight: 400, whiteSpace: "nowrap" };

export default async function AdminPage() {
  const { inquiries, testimonials } = await getData();
  const pending = testimonials.filter((t) => !t.approved);
  const approved = testimonials.filter((t) => t.approved);

  return (
    <main style={{ minHeight: "100vh", background: "#0E0C0A", color: "#F1ECE1", padding: "clamp(48px,8vh,80px) clamp(24px,5vw,80px)", fontFamily: "var(--font-jetbrains), monospace" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: "clamp(40px,6vh,64px)", borderBottom: "1px solid rgba(241,236,225,0.12)", paddingBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C99A7F", marginBottom: 8 }}>Anahat Entertainment</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.02em", color: "#F1ECE1" }}>Admin</h1>
          </div>
          <LogoutButton />
        </div>

        {/* Inquiries */}
        <section style={{ marginBottom: "clamp(56px,9vh,96px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(20px,2.5vw,32px)", color: "#F1ECE1", letterSpacing: "-0.01em" }}>Inquiries</h2>
            <span style={{ fontSize: 12, color: "rgba(241,236,225,0.4)" }}>{inquiries.length} total</span>
          </div>
          {inquiries.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(241,236,225,0.35)" }}>No inquiries yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(241,236,225,0.14)" }}>
                    {["Date", "Service", "Name", "Email", "Company", "Message"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid rgba(241,236,225,0.07)" }}>
                      <td style={{ ...cell, color: "rgba(241,236,225,0.4)", whiteSpace: "nowrap", fontSize: 12 }}>
                        {new Date(row.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ ...cell, color: "#C99A7F", whiteSpace: "nowrap" }}>{row.service}</td>
                      <td style={{ ...cell, color: "#F1ECE1", whiteSpace: "nowrap" }}>{row.name}</td>
                      <td style={cell}>
                        <a href={`mailto:${row.email}`} style={{ color: "rgba(241,236,225,0.7)", textDecoration: "none" }}>{row.email}</a>
                      </td>
                      <td style={{ ...cell, color: "rgba(241,236,225,0.45)" }}>{row.company || "—"}</td>
                      <td style={{ ...cell, color: "rgba(241,236,225,0.55)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Testimonials */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(20px,2.5vw,32px)", color: "#F1ECE1", letterSpacing: "-0.01em" }}>Testimonials</h2>
            <span style={{ fontSize: 12, color: "rgba(241,236,225,0.4)" }}>{pending.length} pending · {approved.length} live</span>
          </div>

          {testimonials.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(241,236,225,0.35)" }}>No testimonials yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {testimonials.map((t) => (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start", padding: "20px 0", borderBottom: "1px solid rgba(241,236,225,0.07)" }}>
                  <div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#F1ECE1" }}>{t.name}</span>
                      {t.org && <span style={{ fontSize: 11, color: "rgba(241,236,225,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.org}</span>}
                      <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: t.approved ? "#6FCF97" : "#C99A7F", border: `1px solid ${t.approved ? "rgba(111,207,151,0.4)" : "rgba(201,154,127,0.4)"}`, borderRadius: 100, padding: "2px 8px" }}>
                        {t.approved ? "Live" : "Pending"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(241,236,225,0.6)", maxWidth: 720 }}>&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                    {!t.approved && (
                      <form action={approveTestimonial.bind(null, t.id)}>
                        <button type="submit" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(111,207,151,0.12)", color: "#6FCF97", border: "1px solid rgba(111,207,151,0.3)", borderRadius: 100, padding: "7px 14px", cursor: "pointer" }}>
                          Approve
                        </button>
                      </form>
                    )}
                    <form action={deleteTestimonial.bind(null, t.id)}>
                      <button type="submit" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(201,154,127,0.10)", color: "#C99A7F", border: "1px solid rgba(201,154,127,0.25)", borderRadius: 100, padding: "7px 14px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
