"use client";

import { useEffect, useRef } from "react";

// Hairline figures. public/hairline/figures.js bundles hairline/kernel.js + hairline/figures/*.js; rebuild with `npm run figures`.
type Figure = {
  means: string;
  range: number[];
  mount: (host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } }, value: number) => { set: (v: number) => void; destroy: () => void };
};
type Kernel = { inject: (d: Document) => void; mk: (tag: string, attrs: object, parent: Element) => SVGSVGElement };
declare global {
  interface Window { hairlineFigures?: Record<string, Figure>; HL?: Kernel }
}

// Strokes follow the card's text colour; the plate (set by the caller via --hairline-plate) must match the card's background.
const strokes = {
  "--hairline-hi": "currentColor",
  "--hairline-edge": "color-mix(in srgb, currentColor 70%, transparent)",
  "--hairline-mid": "color-mix(in srgb, currentColor 45%, transparent)",
  "--hairline-lo": "color-mix(in srgb, currentColor 28%, transparent)",
} as React.CSSProperties;

// One shared load for every instance: next/script's onReady never fires for a second instance mounted mid-load.
let loading: Promise<void> | undefined;
const load = () =>
  (loading ??= new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "/hairline/figures.js";
    el.onload = () => resolve();
    el.onerror = reject;
    document.head.append(el);
  }));

// value: drive the figure's slider number from the page (e.g. load progress); omit for the figure's default.
export default function Hairline({ name, label, className = "", value }: { name: string; label: string; className?: string; value?: number }) {
  const stage = useRef<HTMLDivElement>(null);
  const handle = useRef<{ set: (v: number) => void } | null>(null);
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
    if (value !== undefined) handle.current?.set(value);
  }, [value]);

  useEffect(() => {
    let dispose: (() => void) | undefined, dead = false;
    load().then(() => {
      const fig = window.hairlineFigures?.[name], HL = window.HL, el = stage.current;
      if (dead || !fig || !HL || !el) return;
      HL.inject(document);
      const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, el);
      const h = fig.mount({ stage: el, svg, read: { textContent: "" } }, latest.current ?? fig.range[1]);
      handle.current = h;
      dispose = () => { h.destroy(); handle.current = null; svg.remove(); };
    }).catch(() => {}); // ponytail: figure is decorative; a failed load leaves the card without it
    return () => { dead = true; dispose?.(); };
  }, [name]);

  return <div ref={stage} data-hairline={name} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className={className} style={strokes} />;
}
