"use client";

import { useState } from "react";

type Service = { title: string; n: string };

export default function InquiryForm({ service }: { service: Service }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: service.title,
        name: fd.get("name"),
        email: fd.get("email"),
        company: fd.get("company"),
        message: fd.get("message"),
      }),
    });
    if (res.ok) setSent(true);
    else setError("Something went wrong. Please try again.");
  }

  if (sent) {
    return (
      <div>
        <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.1, color: "#F1ECE1", marginBottom: 14 }}>
          Thank you, <em style={{ fontStyle: "italic", color: "#C99A7F" }}>message received.</em>
        </div>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(241,236,225,0.7)" }}>
          We read everything ourselves and reply within two working days. Talk soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Name</span>
          <input name="name" type="text" required className="form-input" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Email</span>
          <input name="email" type="email" required className="form-input" />
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Company</span>
        <input name="company" type="text" className="form-input" />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Tell us about the project</span>
        <textarea name="message" rows={4} className="form-textarea" />
      </label>
      {error && <p style={{ margin: 0, color: "#C99A7F", fontSize: 14 }}>{error}</p>}
      <button type="submit" className="submit-btn">
        Send inquiry <span style={{ fontSize: 15 }}>&rarr;</span>
      </button>
    </form>
  );
}
