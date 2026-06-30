"use client";

import { useState } from "react";
import Link from "next/link";

export default function TestimonialPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          org: fd.get("org"),
          quote: fd.get("quote"),
        }),
      });
      if (res.ok) setSent(true);
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#1C1814", color: "#F1ECE1", padding: "clamp(80px,12vh,140px) clamp(24px,6vw,110px)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Link
          href="/"
          style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(241,236,225,0.45)", textDecoration: "none", display: "inline-block", marginBottom: "clamp(48px,8vh,96px)", transition: "color 0.3s ease" }}
        >
          &larr; Back
        </Link>

        <span style={{ display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: 18 }}>
          (Voices)
        </span>
        <h1 style={{ margin: "0 0 clamp(14px,2vh,20px)", fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(36px,6vw,72px)", lineHeight: 1.0, letterSpacing: "-0.025em", color: "#F1ECE1" }}>
          Share your experience.
        </h1>
        <p style={{ margin: "0 0 clamp(40px,7vh,72px)", fontSize: 16, lineHeight: 1.6, color: "rgba(241,236,225,0.55)" }}>
          Your testimonial will be reviewed before appearing on the site.
        </p>

        {sent ? (
          <div>
            <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.1, color: "#F1ECE1", marginBottom: 14 }}>
              Thank you, <em style={{ fontStyle: "italic", color: "#C99A7F" }}>we appreciate it.</em>
            </div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(241,236,225,0.7)" }}>
              We&rsquo;ll review your testimonial and publish it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Name</span>
                <input name="name" type="text" required className="form-input" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Role / Company</span>
                <input name="org" type="text" className="form-input" />
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Your testimonial</span>
              <textarea name="quote" rows={5} required className="form-textarea" />
            </label>
            {error && <p style={{ margin: 0, color: "#C99A7F", fontSize: 14 }}>{error}</p>}
            <button type="submit" className="submit-btn">
              Submit <span style={{ fontSize: 15 }}>&rarr;</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
