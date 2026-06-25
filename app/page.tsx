"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { services } from "@/lib/services";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Testimonial = { id: number; name: string; org: string | null; quote: string };

export default function Home() {
  const [sent, setSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    fetch("/api/testimonials").then((r) => r.json()).then(setTestimonials).catch(() => {});
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {

      // ── HERO TIMELINE ──────────────────────────────────────────────────
      const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
      heroTl
        .from(".ah-nav", { y: -28, opacity: 0, duration: 0.9, ease: "power3.out" }, 0)
        .from(".hero-label", { opacity: 0, y: 22, duration: 0.9 }, 0.1)
        .from(".hero-line-inner", { yPercent: 115, duration: 1.2, stagger: 0.14 }, 0.2)
        .from(".hero-desc", { opacity: 0, y: 28, duration: 1 }, 0.72)
        .from(".hero-cta-group", { opacity: 0, y: 22, duration: 0.9 }, 0.88)
        .from(".hero-deco-ring", { opacity: 0, scale: 0.72, duration: 1.4, ease: "power3.out" }, 0.0);

      // ── SCROLL PROGRESS BAR ────────────────────────────────────────────
      ScrollTrigger.create({
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          gsap.set("#scroll-progress", { scaleX: self.progress, transformOrigin: "left center" });
        },
      });

      // ── GENERIC data-reveal ────────────────────────────────────────────
      gsap.utils.toArray<Element>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 42 },
          {
            opacity: 1,
            y: 0,
            duration: 1.15,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 87%", once: true },
          }
        );
      });

      // ── SERVICE ROWS stagger batch ─────────────────────────────────────
      ScrollTrigger.batch(".service-row", {
        onEnter: (els) => {
          gsap.fromTo(els, { opacity: 0, y: 38 }, {
            opacity: 1, y: 0, duration: 1.05, ease: "power3.out", stagger: 0.11,
          });
        },
        start: "top 88%",
        once: true,
      });

      // ── TESTIMONIAL ROWS stagger ───────────────────────────────────────
      ScrollTrigger.batch(".testimonial-row", {
        onEnter: (els) => {
          gsap.fromTo(els, { opacity: 0, y: 32 }, {
            opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.13,
          });
        },
        start: "top 88%",
        once: true,
      });

      // ── HERO PARALLAX (deco ring) ──────────────────────────────────────
      gsap.to(".hero-deco-ring", {
        yPercent: -45,
        ease: "none",
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          end: "80% top",
          scrub: 1.8,
        },
      });

      // ── HERO TEXT PARALLAX ─────────────────────────────────────────────
      gsap.to(".hero-text-block", {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // ── STUDIO SECTION: big text scrub ────────────────────────────────
      gsap.from(".studio-manifesto", {
        opacity: 0.18,
        ease: "none",
        scrollTrigger: {
          trigger: ".studio-manifesto",
          start: "top 75%",
          end: "bottom 30%",
          scrub: true,
        },
      });

      // ── MARQUEE: speed boost on scroll ────────────────────────────────
      let marqSpeed = 32;
      ScrollTrigger.create({
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const v = Math.abs(self.getVelocity());
          const target = Math.max(32, 32 - v * 0.012);
          if (Math.abs(target - marqSpeed) > 0.5) {
            marqSpeed = target;
            (document.querySelector(".ah-marquee") as HTMLElement | null)
              ?.style.setProperty("animation-duration", `${marqSpeed}s`);
          }
        },
      });

      // ── MAGNETIC BUTTONS ──────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
        el.addEventListener("mousemove", (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.45, ease: "power2.out" });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.35)" });
        });
      });

    }); // end ctx

    // ── MOBILE MENU TIMELINE ──────────────────────────────────────────
    const menuEl = menuRef.current;
    let menuTl: gsap.core.Timeline | null = null;
    if (menuEl) {
      gsap.set(menuEl, { clipPath: "inset(0 0 100% 0)", visibility: "hidden" });
      menuTl = gsap.timeline({ paused: true })
        .set(menuEl, { visibility: "visible" })
        .to(menuEl, { clipPath: "inset(0 0 0% 0)", duration: 0.72, ease: "power4.inOut" })
        .fromTo(
          menuEl.querySelectorAll(".nav-mobile-link, .nav-mobile-cta, .nav-mobile-meta"),
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power3.out" },
          "-=0.32"
        );
      menuTlRef.current = menuTl;
    }

    // ── CUSTOM CURSOR (outside ctx so it doesn't get reverted) ────────
    const fine = window.matchMedia?.("(pointer:fine)").matches;
    const ring = document.getElementById("ah-cursor-ring");
    const dot = document.getElementById("ah-cursor-dot");
    let cleanupCursor: (() => void) | null = null;

    if (fine && ring && dot) {
      document.documentElement.style.cursor = "none";

      gsap.set(ring, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
      gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });

      const xTo = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
      const yTo = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

      const onMove = (e: MouseEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
        gsap.set(dot, { x: e.clientX, y: e.clientY });
      };
      window.addEventListener("mousemove", onMove);

      const onEnter = () => {
        gsap.to(ring, { scale: 2.3, duration: 0.4, ease: "power2.out" });
        gsap.to(dot, { opacity: 0, duration: 0.25 });
      };
      const onLeave = () => {
        gsap.to(ring, { scale: 1, duration: 0.4, ease: "power2.out" });
        gsap.to(dot, { opacity: 1, duration: 0.25 });
      };

      const hoverEls = Array.from(document.querySelectorAll("[data-hover]"));
      hoverEls.forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });

      cleanupCursor = () => {
        window.removeEventListener("mousemove", onMove);
        hoverEls.forEach((el) => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
        document.documentElement.style.cursor = "";
      };
    } else if (ring && dot) {
      ring.style.display = "none";
      dot.style.display = "none";
    }

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      menuTl?.kill();
      menuTlRef.current = null;
      cleanupCursor?.();
    };
  }, []);

  const handleMenuToggle = () => {
    const tl = menuTlRef.current;
    setMenuOpen((o) => {
      if (!o) tl?.play();
      else tl?.reverse().then(() => gsap.set(menuRef.current, { visibility: "hidden" }));
      return !o;
    });
  };

  const handleMenuClose = () => {
    menuTlRef.current?.reverse().then(() => gsap.set(menuRef.current, { visibility: "hidden" }));
    setMenuOpen(false);
  };

  return (
    <>
      {/* SCROLL PROGRESS */}
      <div
        id="scroll-progress"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 2,
          background: "#9E5C3D", zIndex: 200, transformOrigin: "left center",
          transform: "scaleX(0)",
        }}
      />

      {/* NAV */}
      <nav className="ah-nav" style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 60, mixBlendMode: "difference", color: "#ffffff" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "22px clamp(24px,6vw,110px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#top" data-hover className="nav-logo">
            Anahat Entertainment<span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, verticalAlign: "super", marginLeft: 3, letterSpacing: "0.1em" }}>&reg;</span>
          </a>
          <div className="nav-desktop-links" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <a data-hover href="#services" className="nav-link">Services</a>
            <a data-hover href="#studio" className="nav-link">Studio</a>
            <a data-hover href="#voices" className="nav-link">Voices</a>
            <a data-hover href="#contact" className="nav-cta">Start a project</a>
          </div>
          <button className={`nav-hamburger${menuOpen ? " open" : ""}`} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={handleMenuToggle}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU — GSAP-controlled, always in DOM */}
      <div ref={menuRef} className="nav-mobile-menu">
        <button className="nav-mobile-close" aria-label="Close menu" onClick={handleMenuClose}>
          <span /><span />
        </button>
        {["Services", "Studio", "Voices"].map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="nav-mobile-link" onClick={handleMenuClose}>{l}</a>
        ))}
        <a href="#contact" className="nav-mobile-cta" onClick={handleMenuClose}>Start a project</a>
        <div className="nav-mobile-meta">
          <span>Pune, India</span>
          <a href="mailto:hello@anahat.studio">hello@anahat.studio</a>
        </div>
      </div>

      <div id="top" style={{ position: "relative" }}>

        {/* HERO */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "150px 0 70px", overflow: "hidden" }}>

          {/* Decorative ring — GSAP parallax target */}
          <div
            className="hero-deco-ring"
            aria-hidden
            style={{
              position: "absolute",
              right: "clamp(-120px,-8vw,-40px)",
              top: "50%",
              transform: "translateY(-50%)",
              width: "clamp(320px,38vw,620px)",
              height: "clamp(320px,38vw,620px)",
              borderRadius: "50%",
              border: "1px solid rgba(158,92,61,0.22)",
              pointerEvents: "none",
            }}
          />
          <div
            className="hero-deco-ring"
            aria-hidden
            style={{
              position: "absolute",
              right: "clamp(-80px,-4vw,-10px)",
              top: "50%",
              transform: "translateY(-50%)",
              width: "clamp(200px,24vw,400px)",
              height: "clamp(200px,24vw,400px)",
              borderRadius: "50%",
              border: "1px solid rgba(158,92,61,0.12)",
              pointerEvents: "none",
            }}
          />

          <div className="hero-text-block" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "clamp(30px,5vh,66px)" }}>
              <span className="hero-label" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#57503F" }}>
                Creative studio, Pune / Worldwide
              </span>
            </div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(50px,9.6vw,172px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: "#1C1814" }}>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: "0.04em" }}>
                <span className="hero-line-inner" style={{ display: "block" }}>We make</span>
              </span>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: "0.04em" }}>
                <span className="hero-line-inner" style={{ display: "block" }}>
                  brands <em style={{ fontStyle: "italic", color: "#9E5C3D" }}>resonate.</em>
                </span>
              </span>
            </h1>
            <div className="hero-cta-group" style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-end", justifyContent: "space-between", marginTop: "clamp(30px,5vh,58px)" }}>
              <p className="hero-desc" style={{ maxWidth: 560, margin: 0, fontSize: "clamp(16px,1.5vw,21px)", lineHeight: 1.5, color: "#57503F" }}>
                Anahat Entertainment is a creative studio for advertising and branded content, web development, social, and the intelligent tools shaping what comes next.
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <a href="#contact" data-hover data-magnetic className="btn-primary">
                  Start a project <span style={{ fontSize: 15 }}>&rarr;</span>
                </a>
                <a href="#voices" data-hover data-magnetic className="btn-secondary">
                  Selected work
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section style={{ borderTop: "1px solid rgba(28,24,20,0.14)", borderBottom: "1px solid rgba(28,24,20,0.14)", padding: "clamp(16px,2.4vh,26px) 0", overflow: "hidden" }}>
          <div className="ah-marquee" style={{ display: "flex", width: "max-content", whiteSpace: "nowrap", animation: "ah-marquee 32s linear infinite" }}>
            {[0, 1].map((k) => (
              <span key={k} style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(26px,4vw,54px)", lineHeight: 1, color: "#1C1814", letterSpacing: "-0.01em" }}>
                Advertising&nbsp;&nbsp;<em style={{ fontStyle: "italic", color: "#9E5C3D" }}>&#10038;</em>&nbsp;&nbsp;
                Branded Content&nbsp;&nbsp;<em style={{ fontStyle: "italic", color: "#9E5C3D" }}>&#10038;</em>&nbsp;&nbsp;
                Web Development&nbsp;&nbsp;<em style={{ fontStyle: "italic", color: "#9E5C3D" }}>&#10038;</em>&nbsp;&nbsp;
                AI Partnerships&nbsp;&nbsp;<em style={{ fontStyle: "italic", color: "#9E5C3D" }}>&#10038;</em>&nbsp;&nbsp;
                Social Media&nbsp;&nbsp;<em style={{ fontStyle: "italic", color: "#9E5C3D" }}>&#10038;</em>&nbsp;&nbsp;
                Brand Films&nbsp;&nbsp;<em style={{ fontStyle: "italic", color: "#9E5C3D" }}>&#10038;</em>&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" style={{ padding: "clamp(72px,12vh,150px) 0" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div
              data-reveal
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: "clamp(28px,5vh,56px)" }}
            >
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9E5C3D" }}>(Services)</span>
              <h2 style={{ margin: 0, maxWidth: 680, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(30px,4.4vw,62px)", lineHeight: 1.02, letterSpacing: "-0.02em", color: "#1C1814" }}>
                Four disciplines, one <em style={{ fontStyle: "italic", color: "#9E5C3D" }}>resonance.</em>
              </h2>
            </div>
            <div>
              {services.map((item) => (
                <Link key={item.n} href={`/services/${item.slug}`} data-hover className="service-row" style={{ textDecoration: "none" }}>
                  <span className="service-row-num" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, letterSpacing: "0.1em", color: "#9E5C3D", paddingTop: 14 }}>{item.n}</span>
                  <div>
                    <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(28px,3.6vw,52px)", lineHeight: 1, letterSpacing: "-0.02em", color: "#1C1814" }}>{item.title}</h3>
                    <p style={{ margin: 0, maxWidth: 560, fontSize: "clamp(15px,1.3vw,18px)", lineHeight: 1.55, color: "#57503F" }}>{item.blurb}</p>
                  </div>
                  <span className="service-row-arrow" style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 30, lineHeight: 1, color: "#1C1814", paddingTop: 8, justifySelf: "end" }}>&#8599;</span>
                </Link>
              ))}
              <div style={{ borderTop: "1px solid rgba(28,24,20,0.16)" }} />
            </div>
          </div>
        </section>

        {/* STUDIO */}
        <section id="studio" style={{ background: "#1C1814", color: "#F1ECE1", padding: "clamp(82px,14vh,172px) 0" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <span
              data-reveal
              style={{ display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: "clamp(26px,4vh,44px)" }}
            >(Studio)</span>
            <p
              className="studio-manifesto"
              style={{ maxWidth: 1040, margin: "0 0 clamp(48px,8vh,96px)", fontFamily: "var(--font-newsreader), serif", fontWeight: 300, fontSize: "clamp(26px,3.6vw,52px)", lineHeight: 1.22, letterSpacing: "-0.015em", color: "#F1ECE1" }}
            >
              Anahat Entertainment is the unstruck sound, resonance that needs no source. We build the same way: <em style={{ fontStyle: "italic", color: "#C99A7F" }}>work that keeps moving </em>once it&rsquo;s out in the world. A small, senior team of strategists, filmmakers, and engineers who&rsquo;d rather make one unforgettable thing than ten forgettable ones.
            </p>

            <div
              data-reveal
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "clamp(28px,4vw,56px)", paddingBottom: "clamp(54px,9vh,100px)", borderBottom: "1px solid rgba(241,236,225,0.16)" }}
            >
              {[
                { num: "01", title: "Taste first", body: "Craft is the strategy. We sweat the cut, the kerning, and the load time because that's what people actually feel." },
                { num: "02", title: "Build to ship", body: "Ideas mean nothing on a deck. We make the thing, put it live, and stay accountable to what it does." },
                { num: "03", title: "Tools as leverage", body: "AI is a brush, not the painter. We use it to make a few people move like a studio of fifty." },
              ].map((p) => (
                <div key={p.num}>
                  <h4 style={{ margin: "0 0 10px", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C99A7F" }}>{p.num} / {p.title}</h4>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(241,236,225,0.72)" }}>{p.body}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* VOICES */}
        <section id="voices" style={{ padding: "clamp(72px,12vh,150px) 0" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div
              data-reveal
              className="voices-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: "clamp(20px,4vh,40px)" }}
            >
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9E5C3D" }}>(Voices)</span>
              <h2 style={{ margin: 0, maxWidth: 560, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(28px,4vw,56px)", lineHeight: 1.04, letterSpacing: "-0.02em", color: "#1C1814", textAlign: "right" }}>What partners say</h2>
            </div>
            {testimonials.map((q) => (
              <div
                key={q.id}
                className="testimonial-row"
                style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "clamp(20px,4vw,64px)", alignItems: "start", padding: "clamp(34px,5vw,56px) 0", borderTop: "1px solid rgba(28,24,20,0.16)" }}
              >
                <p style={{ margin: 0, maxWidth: 920, fontFamily: "var(--font-newsreader), serif", fontWeight: 300, fontSize: "clamp(24px,3.2vw,44px)", lineHeight: 1.18, letterSpacing: "-0.015em", color: "#1C1814" }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="testimonial-attribution" style={{ textAlign: "right", minWidth: 150, paddingTop: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1C1814", marginBottom: 4 }}>{q.name}</div>
                  {q.org && <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#57503F" }}>{q.org}</div>}
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(28,24,20,0.16)", display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
              <Link href="/testimonial" data-hover data-magnetic className="btn-secondary">Share your experience &rarr;</Link>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" style={{ background: "#1C1814", color: "#F1ECE1", padding: "clamp(82px,14vh,172px) 0" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "clamp(48px,7vw,110px)", alignItems: "start" }}>
              <div data-reveal>
                <span style={{ display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: "clamp(22px,4vh,38px)" }}>(Contact)</span>
                <h2 style={{ margin: "0 0 clamp(28px,5vh,44px)", fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(34px,5vw,76px)", lineHeight: 1.0, letterSpacing: "-0.025em", color: "#F1ECE1" }}>
                  Let&rsquo;s make something that <em style={{ fontStyle: "italic", color: "#C99A7F" }}>resonates.</em>
                </h2>
                <a href="mailto:hello@anahat.studio" data-hover className="contact-email-link">
                  hello@anahat.studio
                </a>
              </div>

              <div data-reveal>
                {sent ? (
                  <div style={{ border: "1px solid rgba(241,236,225,0.2)", borderRadius: 16, padding: "clamp(34px,4vw,52px)" }}>
                    <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.1, color: "#F1ECE1", marginBottom: 14 }}>
                      Thank you, <em style={{ fontStyle: "italic", color: "#C99A7F" }}>message received.</em>
                    </div>
                    <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(241,236,225,0.7)" }}>
                      We read everything ourselves and reply within two working days. Talk soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setContactError("");
                    const fd = new FormData(e.currentTarget);
                    const res = await fetch("/api/inquiries", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        service: "General Inquiry",
                        name: fd.get("name"),
                        email: fd.get("email"),
                        company: fd.get("company"),
                        message: fd.get("message"),
                      }),
                    });
                    if (res.ok) setSent(true);
                    else setContactError("Something went wrong. Please try again.");
                  }} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
                    <div className="form-name-email" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
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
                      <textarea name="message" rows={3} className="form-textarea" />
                    </label>
                    {contactError && <p style={{ margin: 0, color: "#C99A7F", fontSize: 14 }}>{contactError}</p>}
                    <button type="submit" data-hover data-magnetic className="submit-btn">
                      Send inquiry <span style={{ fontSize: 15 }}>&rarr;</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "#1C1814", color: "#F1ECE1", borderTop: "1px solid rgba(241,236,225,0.14)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div className="footer-links-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "clamp(40px,5vw,72px)", padding: "clamp(56px,8vh,96px) 0 clamp(48px,7vh,80px)", borderBottom: "1px solid rgba(241,236,225,0.10)" }}>
              <div>
                <p style={{ margin: "0 0 22px", fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(241,236,225,0.4)" }}>Navigate</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {["Services", "Studio", "Voices"].map((l) => (
                    <a key={l} href={`#${l.toLowerCase()}`} data-hover style={{ textDecoration: "none", fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(18px,1.6vw,22px)", color: "#F1ECE1", transition: "color .3s ease", lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#C99A7F")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#F1ECE1")}
                    >{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ margin: "0 0 22px", fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(241,236,225,0.4)" }}>Services</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {["Advertising & Branded Content", "Web Development", "AI Partnerships", "Social Media"].map((s) => (
                    <a key={s} href="#services" data-hover style={{ textDecoration: "none", fontSize: 15, lineHeight: 1.3, color: "rgba(241,236,225,0.65)", transition: "color .3s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#F1ECE1")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(241,236,225,0.65)")}
                    >{s}</a>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ margin: "0 0 22px", fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(241,236,225,0.4)" }}>Say hello</p>
                <a href="mailto:hello@anahat.studio" data-hover style={{ textDecoration: "none", fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(16px,1.4vw,20px)", color: "#C99A7F", display: "block", marginBottom: 20, transition: "opacity .3s ease", lineHeight: 1.3 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >hello@anahat.studio</a>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(241,236,225,0.45)" }}>Pune, India<br />Available worldwide</p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 18, paddingTop: "clamp(18px,2.5vh,28px)", paddingBottom: "clamp(28px,4vh,44px)", borderTop: "1px solid rgba(241,236,225,0.10)", fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(241,236,225,0.4)" }}>
              <span>&copy; 2026 Anahat Entertainment</span>
              <span style={{ color: "#C99A7F", letterSpacing: "0.12em" }}>Made to resonate</span>
              <span>Pune / Worldwide</span>
            </div>
          </div>
        </footer>

      </div>

      {/* CUSTOM CURSOR */}
      <div id="ah-cursor-ring" style={{ position: "fixed", top: 0, left: 0, width: 38, height: 38, border: "1.5px solid #ffffff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, mixBlendMode: "difference", willChange: "transform" }} />
      <div id="ah-cursor-dot" style={{ position: "fixed", top: 0, left: 0, width: 6, height: 6, background: "#ffffff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, mixBlendMode: "difference", willChange: "transform" }} />
    </>
  );
}
