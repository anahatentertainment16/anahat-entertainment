"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Hairline from "./Hairline";
import { markReady } from "./ready";

const FILL_S = 2;    // the bar always takes 2s from 0 to 100
const MAX_MS = 6000; // after the fill, wait for the page at most this long
let shown = false;   // once per visit: client-side returns to the homepage skip it

export default function Loader() {
  const [visible, setVisible] = useState(() => !shown);
  const [segs, setSegs] = useState(0); // the figure takes whole segments, so React only re-renders 10 times
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (shown) { markReady(); return; }
    shown = true;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    let dead = false;

    // Timed fill: 0 to 100 over FILL_S, the % written straight to the DOM each frame.
    const p = { v: 0 };
    const fill = gsap.to(p, {
      v: 1, duration: FILL_S, ease: "power1.inOut",
      onUpdate: () => {
        if (label.current) label.current.textContent = `${Math.round(p.v * 100)}%`;
        setSegs(Math.floor(p.v * 10 + 1e-6));
      },
    });

    // The page still has to be ready: fonts, eager images and the load event, capped at MAX_MS.
    const once = (t: EventTarget, ...evs: string[]) => new Promise<void>((r) => evs.forEach((e) => t.addEventListener(e, () => r(), { once: true })));
    const loaded = Promise.race([
      Promise.all([
        document.fonts.ready,
        document.readyState === "complete" ? Promise.resolve() : once(window, "load"),
        ...Array.from(document.images).filter((i) => !i.complete && i.loading !== "lazy").map((i) => once(i, "load", "error")),
      ]),
      new Promise((r) => setTimeout(r, MAX_MS)),
    ]);

    Promise.all([fill.then(), loaded]).then(() => {
      if (dead) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to(root.current, {
        ...(reduce ? { autoAlpha: 0, duration: 0.3 } : { yPercent: -100, duration: 0.9, ease: "power4.inOut" }),
        delay: 0.7, // let the last tile land first
        onStart: markReady,
        onComplete: () => { html.style.overflow = ""; setVisible(false); },
      });
    });
    return () => { dead = true; fill.kill(); html.style.overflow = ""; };
  }, []);

  if (!visible) return null;
  return (
    <div ref={root} className="site-loader fixed inset-0 z-[95] flex flex-col items-center justify-center gap-2 bg-paper px-4 text-ink" role="status" aria-label="Loading">
      <noscript><style>{".site-loader{display:none}"}</style></noscript>
      <span className="font-display text-4xl font-bold tracking-tight md:text-6xl">Anahat<span className="text-accent">.</span></span>
      <Hairline name="blocks" value={segs} label="" className="-my-[4vh] w-[min(92vw,calc(100dvh*1.25),880px)] [--hairline-plate:var(--paper)]" />
      <span ref={label} className="font-mono text-sm tabular-nums tracking-[0.12em] text-muted md:text-base">0%</span>
    </div>
  );
}
