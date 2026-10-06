"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { siteReady } from "./ready";
import { Asterisk, Hash, Heart, MousePointer2, Music2, Play, Sparkles, type LucideIcon } from "lucide-react";

// Layered hero illustration. A speaker keeps the beat and sends out resonance rings;
// one object per discipline (five, on a pentagon) sits on an orbit around it and links to that service.
// Images: transparent PNGs, 1254x1254, in /public/hero/scene/.
// x/y = center in % of the stage, size = % of stage width, depth = pointer parallax strength (px).
const SATELLITES = [
  { src: "clapperboard", alt: "Brand films", href: "/services/advertising-branded-content", x: 28, y: 22, size: 25, depth: 26 },
  { src: "browser", alt: "Web development", href: "/services/web-development", x: 72, y: 22, size: 27, depth: 18 },
  { src: "ai-spark", alt: "AI partnerships", href: "/services/ai-partnerships", x: 85, y: 63, size: 22, depth: 22 },
  { src: "phone", alt: "Social media", href: "/services/social-media", x: 50, y: 87, size: 21, depth: 30 },
  { src: "laptop", alt: "Custom software", href: "/services/custom-software", x: 15, y: 63, size: 23, depth: 24 },
];

// Small icon particles in the gaps between satellites. solid = orange disc, otherwise a plain ink glyph.
const PARTICLES: { Icon: LucideIcon; x: number; y: number; size: number; solid?: boolean; spin?: boolean }[] = [
  { Icon: Asterisk, x: 50, y: 8, size: 6.5, solid: true, spin: true },
  { Icon: Play, x: 38, y: 5, size: 4.5 },
  { Icon: MousePointer2, x: 62, y: 5, size: 4.5 },
  { Icon: Music2, x: 8, y: 41, size: 5.5, solid: true },
  { Icon: Hash, x: 92, y: 41, size: 4.5 },
  { Icon: Heart, x: 74, y: 87, size: 5.5, solid: true },
  { Icon: Sparkles, x: 26, y: 87, size: 4.5 },
  { Icon: Asterisk, x: 93, y: 84, size: 3.5, spin: true },
];

const CENTER = { x: 50, y: 52 };
const ORIGIN = `${CENTER.x} ${CENTER.y}`;
const BEAT = 0.6; // 100 BPM. Every loop is a multiple of this so everything stays in time.
const RING_TEXT = "We make brands resonate  /  Advertising  /  Web  /  Software  /  Social  /  AI  /  ";
const TEXT_R = 31;

// Each animation owns one wrapper so tweens never fight over the same transform:
// .sat (scroll) > .launch (entrance) > .par (pointer) > .drift (idle) > .bump (beat) > img (hover)
// .pt  (entrance, pointer, scroll) > .pt-drift (idle) > .pt-pop (beat)
export default function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();

    let dead = false;
    // Wait for the loading screen, so the entrance plays in view.
    siteReady.then(() => { if (!dead) mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", fine: "(pointer: fine)" },
      (ctx) => {
        const { motion, fine } = ctx.conditions as { motion: boolean; fine: boolean };
        if (!motion) return;

        const q = gsap.utils.selector(el);
        const sats = q(".sat");
        const pts = q(".pt");
        const start = 0.45; // lets the headline land first
        const dist = (x: number, y: number) => Math.hypot(x - CENTER.x, y - CENTER.y);

        // ── ENTRANCE ───────────────────────────────────────────────────────
        const intro = gsap.timeline({ delay: start, defaults: { ease: "power3.out" } });
        intro
          // anticipation: the speaker winds up before it lands
          .fromTo(".speaker-launch", { autoAlpha: 0, scale: 0.2, rotation: -35, y: 40 }, { autoAlpha: 1, scale: 0.9, rotation: 6, y: 0, duration: 0.55, ease: "power2.out" })
          // impact: squash on contact, stretch on rebound, settle
          .to(".speaker-launch", { scaleX: 1.12, scaleY: 0.86, rotation: 0, duration: 0.12, ease: "power2.in" })
          .addLabel("hit")
          .to(".speaker-launch", { scaleX: 1, scaleY: 1, duration: 1.1, ease: "elastic.out(1, 0.4)" })
          // shockwave drawn from the impact point outward
          .fromTo(".shock", { drawSVG: "50% 50%", scale: 0.55, autoAlpha: 1, svgOrigin: ORIGIN },
            { drawSVG: "0% 100%", scale: 1.45, autoAlpha: 0, duration: 1.1, ease: "expo.out" }, "hit")
          // orbit track and text ring open up behind everything
          .fromTo(".orbit", { autoAlpha: 0, scale: 0.7, svgOrigin: ORIGIN }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: "expo.out" }, "hit")
          .fromTo(".badge", { autoAlpha: 0, scale: 0.6, rotation: -120, svgOrigin: ORIGIN }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.6, ease: "expo.out" }, "hit+=0.05")
          // satellites launch from behind the speaker on curved arcs:
          // x and y ease differently, so the path bends instead of travelling straight
          .from(q(".launch"), {
            xPercent: (i) => ((CENTER.x - SATELLITES[i].x) / SATELLITES[i].size) * 100,
            duration: 1.15, ease: "power4.out", stagger: 0.08,
          }, "hit")
          .from(q(".launch"), {
            yPercent: (i) => ((CENTER.y - SATELLITES[i].y) / SATELLITES[i].size) * 100,
            duration: 1.15, ease: "back.out(1.5)", stagger: 0.08,
          }, "hit")
          .from(q(".launch"), {
            scale: 0.15, autoAlpha: 0, rotation: (i) => (i % 2 ? 140 : -140),
            duration: 1.25, ease: "back.out(1.8)", stagger: 0.08,
          }, "hit")
          // particles burst out of the speaker like confetti, in random order
          .from(pts, {
            xPercent: (i) => ((CENTER.x - PARTICLES[i].x) / PARTICLES[i].size) * 100,
            yPercent: (i) => ((CENTER.y - PARTICLES[i].y) / PARTICLES[i].size) * 100,
            scale: 0, autoAlpha: 0, rotation: () => gsap.utils.random(-220, 220),
            duration: 1.3, ease: "expo.out", stagger: { each: 0.045, from: "random" },
          }, "hit+=0.12");

        // ── TEMPO ──────────────────────────────────────────────────────────
        // One beat every 2 counts: speaker thumps, everything else answers a moment later
        // (further away = later), like the sound reaching it.
        const loops: gsap.core.Animation[] = [];
        const t0 = start + 1.6;
        const beat = gsap.timeline({ repeat: -1, delay: t0, defaults: { overwrite: "auto" } });
        beat
          .to(".speaker-img", { scaleX: 1.05, scaleY: 0.94, duration: 0.07, ease: "power2.in" }, 0)
          .to(".speaker-img", { scaleX: 1, scaleY: 1, duration: BEAT * 2 - 0.07, ease: "elastic.out(1.1, 0.35)" }, 0.07);
        SATELLITES.forEach((s, i) => {
          beat.fromTo(q(".bump")[i], { scale: 1.06, rotation: i % 2 ? -3 : 3 },
            { scale: 1, rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.45)", immediateRender: false }, dist(s.x, s.y) / 300);
        });
        PARTICLES.forEach((p, i) => {
          beat.fromTo(q(".pt-pop")[i], { scale: 1.3 },
            { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)", immediateRender: false }, dist(p.x, p.y) / 300);
        });
        beat.set({}, {}, BEAT * 2); // pad the loop to exactly two counts
        loops.push(beat);

        // Rings: three of them, each re-emitted every 3 beats, offset by one beat.
        q(".ring").forEach((ring, k) => {
          loops.push(gsap.fromTo(ring, { scale: 0.42, autoAlpha: 0.75, strokeWidth: 0.7, svgOrigin: ORIGIN }, {
            scale: 1.6, autoAlpha: 0, strokeWidth: 0.12, duration: BEAT * 6, ease: "power2.out",
            repeat: -1, delay: t0 + k * BEAT * 2,
          }));
        });

        // Text ring and orbit turn slowly in opposite directions.
        loops.push(
          gsap.to(".badge-spin", { rotation: 360, svgOrigin: ORIGIN, duration: BEAT * 64, ease: "none", repeat: -1 }),
          gsap.to(".orbit-spin", { rotation: -360, svgOrigin: ORIGIN, duration: BEAT * 128, ease: "none", repeat: -1 }),
        );

        // ── IDLE DRIFT ─────────────────────────────────────────────────────
        // x, y and rotation run on mismatched periods, so each orbit never visibly repeats.
        const r = gsap.utils.random;
        q(".drift").forEach((d, i) => {
          loops.push(
            gsap.to(d, { x: r(-9, 9), duration: r(3.1, 4.3), ease: "sine.inOut", yoyo: true, repeat: -1 }),
            gsap.to(d, { y: i % 2 ? 11 : -11, duration: r(2.4, 3.2), ease: "sine.inOut", yoyo: true, repeat: -1 }),
            gsap.to(d, { rotation: r(-5, 5), duration: r(4.5, 6), ease: "sine.inOut", yoyo: true, repeat: -1 }),
          );
        });
        q(".pt-drift").forEach((d, i) => {
          loops.push(
            gsap.to(d, { x: r(-14, 14), y: r(-14, 14), duration: r(2.2, 3.4), ease: "sine.inOut", yoyo: true, repeat: -1 }),
            PARTICLES[i].spin
              ? gsap.to(d, { rotation: 360, duration: BEAT * 16, ease: "none", repeat: -1 })
              : gsap.to(d, { rotation: r(-18, 18), duration: r(1.8, 2.8), ease: "sine.inOut", yoyo: true, repeat: -1 }),
          );
        });

        // Pause every loop while the hero is off screen.
        ScrollTrigger.create({
          trigger: el, start: "top bottom", end: "bottom top",
          onToggle: (self) => loops.forEach((l) => (self.isActive ? l.resume() : l.pause())),
        });

        // ── SCROLL EXIT ────────────────────────────────────────────────────
        // Particles scatter hardest, satellites next, the speaker barely moves: depth on exit too.
        gsap.timeline({ scrollTrigger: { trigger: el, start: "center center", end: "bottom top", scrub: 0.8 } })
          .to(pts, {
            xPercent: (i) => (PARTICLES[i].x - CENTER.x) * 14,
            yPercent: (i) => (PARTICLES[i].y - CENTER.y) * 14,
            rotation: () => r(-180, 180), autoAlpha: 0, ease: "power1.in",
          }, 0)
          .to(sats, {
            xPercent: (i) => (SATELLITES[i].x - CENTER.x) * 3.2,
            yPercent: (i) => (SATELLITES[i].y - CENTER.y) * 3.2,
            rotation: (i) => (i % 2 ? 25 : -25),
            autoAlpha: 0, ease: "power1.in",
          }, 0)
          .to([".badge", ".orbit"], { scale: 1.3, autoAlpha: 0, svgOrigin: ORIGIN, ease: "power1.in" }, 0)
          .to(".speaker", { scale: 0.82, yPercent: -12, autoAlpha: 0, ease: "power1.in" }, 0.1);

        if (!fine) return;

        // ── POINTER ────────────────────────────────────────────────────────
        // Depth parallax plus a slight tilt toward the cursor; quickTo reuses one tween per prop.
        // Particles get the most depth so they read as the closest layer.
        const layers = [
          ...q(".par").map((p, i) => ({ p, d: SATELLITES[i].depth, tilt: 8 })),
          ...pts.map((p, i) => ({ p, d: 40 + i * 3, tilt: 0 })),
        ].map(({ p, d, tilt }) => ({
          x: gsap.quickTo(p, "x", { duration: 0.9, ease: "power3" }),
          y: gsap.quickTo(p, "y", { duration: 0.9, ease: "power3" }),
          r: tilt ? gsap.quickTo(p, "rotation", { duration: 1.2, ease: "power3" }) : null,
          d, tilt,
        }));
        const sx = gsap.quickTo(".speaker-par", "x", { duration: 1.2, ease: "power3" });
        const sy = gsap.quickTo(".speaker-par", "y", { duration: 1.2, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const b = el.getBoundingClientRect();
          const nx = (e.clientX - b.left) / b.width - 0.5;
          const ny = (e.clientY - b.top) / b.height - 0.5;
          layers.forEach((l) => { l.x(nx * l.d); l.y(ny * l.d); l.r?.(nx * l.tilt); });
          sx(nx * -10); sy(ny * -10);
        };
        const onLeave = () => { layers.forEach((l) => { l.x(0); l.y(0); l.r?.(0); }); sx(0); sy(0); };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);

        // Hover: pop with a wiggle, spring back on leave.
        const hovers = sats.map((s) => {
          const img = s.querySelector("img");
          const enter = () => gsap.timeline()
            .to(img, { scale: 1.14, duration: 0.35, ease: "back.out(2.5)", overwrite: true }, 0)
            .to(img, { keyframes: { rotation: [0, -7, 5, -2, 0] }, duration: 0.6, ease: "power1.out" }, 0);
          const leave = () => gsap.to(img, { scale: 1, rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: true });
          s.addEventListener("pointerenter", enter);
          s.addEventListener("pointerleave", leave);
          return () => { s.removeEventListener("pointerenter", enter); s.removeEventListener("pointerleave", leave); };
        });

        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          hovers.forEach((off) => off());
        };
      },
      root,
    ); });

    return () => { dead = true; mm.revert(); };
  }, []);

  return (
    <div ref={root} className="relative mx-auto aspect-square w-full max-w-[min(820px,calc(100dvh-7rem))]">
      {/* Orbit track, text ring and resonance rings: plain SVG so they stay crisp at any size */}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <path id="ring-path" d={`M ${CENTER.x - TEXT_R},${CENTER.y} a ${TEXT_R},${TEXT_R} 0 1,1 ${TEXT_R * 2},0 a ${TEXT_R},${TEXT_R} 0 1,1 -${TEXT_R * 2},0`} />
        </defs>
        <g className="orbit">
          <circle className="orbit-spin" cx={CENTER.x} cy={CENTER.y} r="42.5" fill="none" stroke="var(--ink)" strokeOpacity="0.22" strokeWidth="0.25" strokeDasharray="0.8 1.6" />
        </g>
        <g className="badge">
          <g className="badge-spin">
            <text className="fill-muted font-mono uppercase" fontSize="2.3" letterSpacing="0.35">
              <textPath href="#ring-path" textLength={2 * Math.PI * TEXT_R - 1} lengthAdjust="spacing">{RING_TEXT}</textPath>
            </text>
          </g>
        </g>
        {[0, 1, 2].map((k) => (
          <circle key={k} className="ring invisible" cx={CENTER.x} cy={CENTER.y} r="30" fill="none" stroke="var(--accent)" />
        ))}
        <circle className="shock invisible" cx={CENTER.x} cy={CENTER.y} r="30" fill="none" stroke="var(--accent)" strokeWidth="0.6" />
      </svg>

      <div className="speaker absolute w-[46%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}>
        <div className="speaker-launch">
          <div className="speaker-par">
            <Image
              src="/hero/scene/speaker.png"
              alt=""
              width={1254}
              height={1254}
              priority
              sizes="(max-width: 1024px) 45vw, 28vw"
              className="speaker-img h-auto w-full origin-[50%_85%]"
            />
          </div>
        </div>
      </div>

      {PARTICLES.map(({ Icon, x, y, size, solid }, i) => (
        <div key={i} aria-hidden className="pt absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` }}>
          <div className="pt-drift">
            <div className="pt-pop">
              {solid ? (
                <span className="grid aspect-square place-items-center rounded-full bg-accent text-on-accent">
                  <Icon className="h-[58%] w-[58%]" />
                </span>
              ) : (
                <Icon className="h-auto w-full text-ink" />
              )}
            </div>
          </div>
        </div>
      ))}

      {SATELLITES.map((s) => (
        <Link
          key={s.src}
          href={s.href}
          aria-label={s.alt}
          className="sat group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}%` }}
        >
          <div className="launch">
            <div className="par">
              <div className="drift">
                <div className="bump">
                  <Image src={`/hero/scene/${s.src}.png`} alt="" width={1254} height={1254} sizes="(max-width: 1024px) 30vw, 18vw" className="h-auto w-full" />
                </div>
              </div>
            </div>
          </div>
          {/* Discipline label on hover/focus */}
          <span className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            {s.alt}
          </span>
        </Link>
      ))}
    </div>
  );
}
