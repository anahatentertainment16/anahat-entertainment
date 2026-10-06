"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck } from "lucide-react";

export default function TestimonialPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), org: fd.get("org"), quote: fd.get("quote"), website: fd.get("website") }),
      });
      if (res.ok) setSent(true);
      else setError("Your testimonial didn't send. Check your connection and try again.");
    } catch {
      setError("Your testimonial didn't send. Check your connection and try again.");
    }
    setBusy(false);
  }

  const label = "flex flex-col gap-2";
  const cap = "font-mono text-xs uppercase tracking-[0.12em] text-muted";

  return (
    <main className="min-h-[100dvh] px-4 py-16 sm:px-8 md:py-24">
      <div className="mx-auto max-w-[700px]">
        <Link href="/#voices" className="u-link mb-16 inline-flex items-center gap-1.5 text-sm text-muted md:mb-24"><ArrowLeft size={15} /> Back to site</Link>
        <h1 className="m-0 mb-4 font-display text-[clamp(40px,6vw,72px)] font-bold leading-[0.95] tracking-[-0.035em]">Share your experience.</h1>
        <p className="m-0 mb-14 text-base leading-relaxed text-muted">We review every testimonial before it appears on the site.</p>

        {sent ? (
          <div role="status">
            <p className="m-0 mb-3 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight md:text-4xl"><CircleCheck size={32} className="text-accent" /> Testimonial sent.</p>
            <p className="m-0 text-base leading-relaxed text-muted">Thank you. It will appear on the site once reviewed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {/* Honeypot: hidden from people, filled by bots */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              <label className={label}>
                <span className={cap}>Name</span>
                <input name="name" type="text" required autoComplete="name" className="field" />
              </label>
              <label className={label}>
                <span className={cap}>Role / Company</span>
                <input name="org" type="text" autoComplete="organization" className="field" />
              </label>
            </div>
            <label className={label}>
              <span className={cap}>Your testimonial</span>
              <textarea name="quote" rows={5} required className="field" />
            </label>
            {error && <p role="alert" className="m-0 flex items-center gap-2 text-sm font-medium text-accent"><CircleAlert size={16} /> {error}</p>}
            <button type="submit" disabled={busy} className="btn btn-solid self-start disabled:opacity-60">
              {busy ? "Sending..." : "Send testimonial"} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
