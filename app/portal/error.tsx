"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

// Shown when a page or a save fails. In production Next hides server error details, so the copy stays general.
export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[100dvh] items-center px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">That didn&rsquo;t go through.</h1>
        <p className="mt-4 text-muted">
          {process.env.NODE_ENV === "development" ? error.message : "Something failed while loading or saving. Check what you entered and try again. If it keeps happening, send us the reference below."}
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap gap-2">
          <button onClick={reset} className="btn btn-solid btn-sm"><RotateCcw size={14} /> Try again</button>
          <Link href="/portal" className="btn btn-ghost btn-sm">Back to your projects</Link>
        </div>
      </div>
    </main>
  );
}
