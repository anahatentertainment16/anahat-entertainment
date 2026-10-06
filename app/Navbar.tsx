"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { EMAIL, WRAP } from "@/lib/site";

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

// Transparent over the hero, solid once scrolled. Slides away while reading down, back on any scroll up.
// Desktop links share one track; an ink pill slides to whichever section is in view.
export default function Navbar({ items }: { items: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const key = items.join(",");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        setScrolled(y > 8);
        setHidden(y > 160 && self.direction === 1);
      },
    });
    return () => st.kill();
  }, []);

  // Scroll-spy: a section is current while it crosses the middle of the viewport. Above the first one (the hero), none is.
  useEffect(() => {
    const ids = key.toLowerCase().split(",");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setActive(e.target.id);
        else if (e.target.id === ids[0] && e.boundingClientRect.top > 0) setActive(null);
      }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [key]);

  useLayoutEffect(() => {
    const t = track.current, p = pill.current;
    if (!t || !p) return;
    const place = () => {
      const a = active ? t.querySelector<HTMLElement>(`[data-id="${active}"]`) : null;
      p.style.opacity = a ? "1" : "0";
      if (!a) return;
      p.style.width = `${a.offsetWidth}px`;
      p.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(t);
    return () => ro.disconnect();
  }, [active]);

  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(el, { clipPath: "inset(0 0 100% 0)", visibility: "hidden" });
    tl.current = gsap.timeline({ paused: true })
      .set(el, { visibility: "visible" })
      .to(el, { clipPath: "inset(0 0 0% 0)", duration: reduce ? 0 : 0.7, ease: "power4.inOut" })
      .fromTo(el.querySelectorAll(".menu-item"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: reduce ? 0 : 0.5, stagger: 0.06, ease: "power3.out" }, "-=0.3");
    return () => { tl.current?.kill(); tl.current = null; };
  }, []);

  useEffect(() => {
    if (open) tl.current?.play();
    else tl.current?.reverse();
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  // Open menu: bar goes clear and sits above the overlay, so the logo and close button read on orange.
  const solid = scrolled && !open;

  return (
    <>
      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 top-0 ${open ? "z-[60]" : "z-50"} border-b transition-[transform,background-color,border-color] duration-500 motion-reduce:transition-none ${EASE} ${
          solid ? "border-line bg-paper/85 backdrop-blur-md" : "border-transparent bg-transparent"
        } ${hidden && !open ? "-translate-y-full" : ""}`}
      >
        <div className={`${WRAP} grid h-16 grid-cols-[1fr_auto] items-center gap-6 lg:h-[72px] lg:grid-cols-[1fr_auto_1fr]`}>
          <a href="#top" className="justify-self-start font-display text-xl font-bold tracking-tight text-ink no-underline">
            Anahat<span className={open ? "text-on-accent" : "text-accent"}>.</span>
          </a>

          <div ref={track} className="relative hidden items-center rounded-full border border-line bg-surface p-1 lg:flex">
            <span ref={pill} aria-hidden className={`absolute bottom-1 left-0 top-1 rounded-full bg-ink opacity-0 transition-[transform,width,opacity] duration-500 motion-reduce:transition-none ${EASE}`} />
            {items.map((l) => {
              const id = l.toLowerCase(), on = active === id;
              return (
                <a
                  key={l}
                  data-id={id}
                  href={`#${id}`}
                  aria-current={on ? "location" : undefined}
                  className={`relative rounded-full px-4 py-1.5 text-sm no-underline transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? "text-paper" : "text-muted hover:text-ink"}`}
                >
                  {l}
                </a>
              );
            })}
          </div>

          {/* wrapper owns visibility: .btn sets display and would beat `hidden` */}
          <div className="hidden justify-self-end lg:block">
            <a href="#contact" className="btn btn-solid !px-5 !py-2.5 !text-sm">Start a project</a>
          </div>

          <button
            className={`nav-hamburger relative z-[60] -mr-2.5 flex h-11 w-11 flex-col items-end justify-center gap-[5px] justify-self-end p-2.5 text-ink lg:hidden${open ? " open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        ref={menu}
        inert={!open}
        className="nav-mobile-menu on-accent fixed inset-0 z-[55] flex flex-col justify-between bg-accent px-6 pb-10 pt-28 text-on-accent lg:hidden"
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {items.map((l) => {
            const id = l.toLowerCase();
            return (
              <a
                key={l}
                href={`#${id}`}
                onClick={close}
                aria-current={active === id ? "location" : undefined}
                className="menu-item self-start font-display text-5xl font-semibold leading-[1.1] tracking-tight text-on-accent no-underline aria-[current]:underline aria-[current]:decoration-2 aria-[current]:underline-offset-8"
              >
                {l}
              </a>
            );
          })}
        </nav>
        <div className="menu-item flex flex-col items-start gap-5 border-t border-on-accent/40 pt-6">
          <a href="#contact" onClick={close} className="btn btn-solid">Start a project <ArrowRight size={16} /></a>
          <a href={`mailto:${EMAIL}`} className="u-link text-on-accent [overflow-wrap:anywhere]">{EMAIL}</a>
        </div>
      </div>
    </>
  );
}
