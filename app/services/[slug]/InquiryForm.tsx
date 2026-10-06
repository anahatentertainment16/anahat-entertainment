"use client";

import { useState } from "react";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";

// Colors inherit from the parent, so the same form works on paper and on the accent panel.
export default function InquiryForm({ service }: { service: { title: string } }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.title,
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
          message: fd.get("message"),
          website: fd.get("website"),
        }),
      });
      if (res.ok) setSent(true);
      else setError("Your message didn't send. Check your connection and try again.");
    } catch {
      setError("Your message didn't send. Check your connection and try again.");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div role="status">
        <p className="m-0 mb-3 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight md:text-4xl"><CircleCheck size={32} /> Message sent.</p>
        <p className="m-0 text-base leading-relaxed opacity-80">We read every message ourselves and reply within two working days.</p>
      </div>
    );
  }

  const label = "flex flex-col gap-2";
  const cap = "font-mono text-xs uppercase tracking-[0.12em] opacity-80";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Honeypot: hidden from people, filled by bots */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <label className={label}>
          <span className={cap}>Name</span>
          <input name="name" type="text" required autoComplete="name" className="field" />
        </label>
        <label className={label}>
          <span className={cap}>Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
      </div>
      <label className={label}>
        <span className={cap}>Company</span>
        <input name="company" type="text" autoComplete="organization" className="field" />
      </label>
      <label className={label}>
        <span className={cap}>Tell us about the project</span>
        <textarea name="message" rows={4} className="field" />
      </label>
      {error && <p role="alert" className="m-0 flex items-center gap-2 text-sm font-medium"><CircleAlert size={16} /> {error}</p>}
      <button type="submit" disabled={busy} className="btn btn-solid self-start disabled:opacity-60">
        {busy ? "Sending..." : "Send message"} <ArrowRight size={18} />
      </button>
    </form>
  );
}
