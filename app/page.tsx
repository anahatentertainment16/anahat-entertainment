"use client";

import { useEffect, useState } from "react";

const services = [
  {
    n: "01",
    title: "Advertising & Branded Content",
    blurb: "Campaigns and films that earn attention instead of buying it — concept, production, and the kind of story people actually pass on.",
    tags: ["Strategy", "Film", "Art Direction"],
  },
  {
    n: "02",
    title: "Web Development",
    blurb: "Sites and digital products engineered to feel inevitable. Fast, considered, and built to convert without ever looking like it.",
    tags: ["Design", "Engineering", "Motion"],
  },
  {
    n: "03",
    title: "AI Partnerships",
    blurb: "Creative systems built with intelligent tools — generative pipelines and bespoke models that extend what a small team can make.",
    tags: ["R&D", "Generative", "Automation"],
  },
  {
    n: "04",
    title: "Social Media",
    blurb: "Always-on storytelling that compounds. Channels, content engines, and community that turn audiences into advocates.",
    tags: ["Content", "Community", "Growth"],
  },
];

const team = [
  { name: "Aria Mehra", role: "Founder · Creative Director", initials: "AM" },
  { name: "Devan Rao", role: "Head of Production", initials: "DR" },
  { name: "Noor Kapadia", role: "Technology & AI", initials: "NK" },
  { name: "Sam Oduya", role: "Strategy & Growth", initials: "SO" },
];

const quotes = [
  {
    quote: "They didn't just make our campaign — they made it impossible to ignore. The numbers followed.",
    name: "Priya Nair",
    org: "CMO, Lumen Beverages",
  },
  {
    quote: "Rare to find a studio fluent in story and in code. Anahat shipped both, beautifully.",
    name: "Marcus Hale",
    org: "Founder, Northwind",
  },
  {
    quote: "Their AI work cut our production timeline in half without ever feeling synthetic.",
    name: "Elena Ruiz",
    org: "VP Brand, Atlas Studios",
  },
];

export default function Home() {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
    const ring = document.getElementById("ah-cursor-ring");
    const dot = document.getElementById("ah-cursor-dot");
    let scale = 1;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf: number;

    if (fine && ring && dot) {
      document.documentElement.style.cursor = "none";

      const onMove = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      };
      window.addEventListener("mousemove", onMove);

      const loop = () => {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%) scale(${scale})`;
        raf = requestAnimationFrame(loop);
      };
      loop();

      const enter = () => { scale = 2.3; dot.style.opacity = "0"; };
      const leave = () => { scale = 1; dot.style.opacity = "1"; };
      const hoverEls = Array.from(document.querySelectorAll("[data-hover]"));
      hoverEls.forEach((el) => {
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        hoverEls.forEach((el) => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mouseleave", leave);
        });
        document.documentElement.style.cursor = "";
      };
    } else if (ring && dot) {
      ring.style.display = "none";
      dot.style.display = "none";
    }
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const el = en.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
    revealEls.forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${Math.min(i, 4) * 0.06}s`;
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 60, mixBlendMode: "difference", color: "#ffffff" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "22px clamp(24px,6vw,110px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#top" data-hover className="nav-logo">
            Anahat<span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, verticalAlign: "super", marginLeft: 3, letterSpacing: "0.1em" }}>&reg;</span>
          </a>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <a data-hover href="#services" className="nav-link">Services</a>
            <a data-hover href="#studio" className="nav-link">Studio</a>
            <a data-hover href="#voices" className="nav-link">Voices</a>
            <a data-hover href="#contact" className="nav-cta">Start a project</a>
          </div>
        </div>
      </nav>

      <div id="top" style={{ position: "relative" }}>

        {/* HERO */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "150px 0 70px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "clamp(30px,5vh,66px)" }}>
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#57503F", animation: "ah-fade .8s cubic-bezier(.16,1,.3,1) both", animationDelay: ".1s" }}>
                Creative studio — Mumbai / Worldwide
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#57503F", animation: "ah-fade .8s cubic-bezier(.16,1,.3,1) both", animationDelay: ".18s" }}>
                Est. 2026
              </span>
            </div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(50px,9.6vw,172px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: "#1C1814" }}>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: "0.04em" }}>
                <span style={{ display: "block", animation: "ah-rise 1.05s cubic-bezier(.16,1,.3,1) both", animationDelay: ".15s" }}>We make</span>
              </span>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: "0.04em" }}>
                <span style={{ display: "block", animation: "ah-rise 1.05s cubic-bezier(.16,1,.3,1) both", animationDelay: ".3s" }}>
                  brands <em style={{ fontStyle: "italic", color: "#9E5C3D" }}>resonate.</em>
                </span>
              </span>
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-end", justifyContent: "space-between", marginTop: "clamp(30px,5vh,58px)" }}>
              <p style={{ maxWidth: 560, margin: 0, fontSize: "clamp(16px,1.5vw,21px)", lineHeight: 1.5, color: "#57503F", animation: "ah-fade .9s cubic-bezier(.16,1,.3,1) both", animationDelay: ".55s" }}>
                Anahat is a creative studio for advertising and branded content, web development, social, and the intelligent tools shaping what comes next.
              </p>
              <div style={{ display: "flex", gap: 14, animation: "ah-fade .9s cubic-bezier(.16,1,.3,1) both", animationDelay: ".68s" }}>
                <a href="#contact" data-hover className="btn-primary">
                  Start a project <span style={{ fontSize: 15 }}>&rarr;</span>
                </a>
                <a href="#voices" data-hover className="btn-secondary">
                  Selected work
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SHOWREEL */}
        <section style={{ padding: "clamp(20px,5vh,60px) 0 clamp(50px,8vh,100px)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div
              data-reveal
              style={{ opacity: 0, transform: "translateY(30px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)", position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", background: "#E4DAC8" }}
            >
              {/* Showreel placeholder */}
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E4DAC8" }}>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E8E78", opacity: 0.6 }}>
                  Drop showreel still
                </span>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(28,24,20,0.42), rgba(28,24,20,0) 42%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div data-hover className="play-btn">
                  <span style={{ fontSize: 18, lineHeight: 1, marginLeft: 3 }}>&#9654;</span>
                  <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>Reel</span>
                </div>
              </div>
              <div style={{ position: "absolute", left: 20, bottom: 18, fontFamily: "var(--font-jetbrains), monospace", color: "#F1ECE1", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Showreel — 02:14
              </div>
              <div style={{ position: "absolute", right: 20, bottom: 18, fontFamily: "var(--font-jetbrains), monospace", color: "#F1ECE1", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                2026
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section style={{ borderTop: "1px solid rgba(28,24,20,0.14)", borderBottom: "1px solid rgba(28,24,20,0.14)", padding: "clamp(16px,2.4vh,26px) 0", overflow: "hidden" }}>
          <div style={{ display: "flex", width: "max-content", whiteSpace: "nowrap", animation: "ah-marquee 32s linear infinite" }}>
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
              style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: "clamp(28px,5vh,56px)" }}
            >
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9E5C3D" }}>(Services)</span>
              <h2 style={{ margin: 0, maxWidth: 680, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(30px,4.4vw,62px)", lineHeight: 1.02, letterSpacing: "-0.02em", color: "#1C1814" }}>
                Four disciplines, one <em style={{ fontStyle: "italic", color: "#9E5C3D" }}>resonance.</em>
              </h2>
            </div>
            <div>
              {services.map((item) => (
                <div key={item.n} data-reveal data-hover className="service-row">
                  <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, letterSpacing: "0.1em", color: "#9E5C3D", paddingTop: 14 }}>{item.n}</span>
                  <div>
                    <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(28px,3.6vw,52px)", lineHeight: 1, letterSpacing: "-0.02em", color: "#1C1814" }}>{item.title}</h3>
                    <p style={{ margin: "0 0 20px", maxWidth: 560, fontSize: "clamp(15px,1.3vw,18px)", lineHeight: 1.55, color: "#57503F" }}>{item.blurb}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                      {item.tags.map((tag) => (
                        <span key={tag} style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#57503F", border: "1px solid rgba(28,24,20,0.22)", borderRadius: 100, padding: "6px 13px" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 30, lineHeight: 1, color: "#1C1814", paddingTop: 8, justifySelf: "end" }}>&#8599;</span>
                </div>
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
              style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity .9s ease, transform .9s ease", display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: "clamp(26px,4vh,44px)" }}
            >(Studio)</span>
            <p
              data-reveal
              style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)", maxWidth: 1040, margin: "0 0 clamp(48px,8vh,96px)", fontFamily: "var(--font-newsreader), serif", fontWeight: 300, fontSize: "clamp(26px,3.6vw,52px)", lineHeight: 1.22, letterSpacing: "-0.015em", color: "#F1ECE1" }}
            >
              Anahat is the unstruck sound — resonance that needs no source. We build the same way: <em style={{ fontStyle: "italic", color: "#C99A7F" }}>work that keeps moving</em> once it&rsquo;s out in the world. A small, senior team of strategists, filmmakers, and engineers who&rsquo;d rather make one unforgettable thing than ten forgettable ones.
            </p>

            <div
              data-reveal
              style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "clamp(28px,4vw,56px)", paddingBottom: "clamp(54px,9vh,100px)", borderBottom: "1px solid rgba(241,236,225,0.16)" }}
            >
              {[
                { num: "01", title: "Taste first", body: "Craft is the strategy. We sweat the cut, the kerning, and the load time because that’s what people actually feel." },
                { num: "02", title: "Build to ship", body: "Ideas mean nothing on a deck. We make the thing, put it live, and stay accountable to what it does." },
                { num: "03", title: "Tools as leverage", body: "AI is a brush, not the painter. We use it to make a few people move like a studio of fifty." },
              ].map((p) => (
                <div key={p.num}>
                  <h4 style={{ margin: "0 0 10px", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C99A7F" }}>{p.num} / {p.title}</h4>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(241,236,225,0.72)" }}>{p.body}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "clamp(48px,8vh,88px)" }}>
              <span
                data-reveal
                style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity .9s ease, transform .9s ease", display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: "clamp(24px,4vh,40px)" }}
              >The people</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "clamp(24px,3vw,40px)" }}>
                {team.map((member) => (
                  <div
                    key={member.name}
                    data-reveal
                    style={{ opacity: 0, transform: "translateY(26px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)" }}
                  >
                    <div style={{ width: "clamp(96px,10vw,128px)", height: "clamp(96px,10vw,128px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, background: "repeating-linear-gradient(135deg, rgba(241,236,225,0.10) 0 7px, rgba(241,236,225,0.03) 7px 14px)", border: "1px solid rgba(241,236,225,0.18)" }}>
                      <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 30, color: "#C99A7F", letterSpacing: "0.02em" }}>{member.initials}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 22, lineHeight: 1.1, color: "#F1ECE1", marginBottom: 5 }}>{member.name}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "rgba(241,236,225,0.6)" }}>{member.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* VOICES */}
        <section id="voices" style={{ padding: "clamp(72px,12vh,150px) 0" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div
              data-reveal
              style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: "clamp(20px,4vh,40px)" }}
            >
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9E5C3D" }}>(Voices)</span>
              <h2 style={{ margin: 0, maxWidth: 560, fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(28px,4vw,56px)", lineHeight: 1.04, letterSpacing: "-0.02em", color: "#1C1814", textAlign: "right" }}>What partners say</h2>
            </div>
            {quotes.map((q) => (
              <div
                key={q.name}
                data-reveal
                style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)", display: "grid", gridTemplateColumns: "1fr auto", gap: "clamp(20px,4vw,64px)", alignItems: "start", padding: "clamp(34px,5vw,56px) 0", borderTop: "1px solid rgba(28,24,20,0.16)" }}
              >
                <p style={{ margin: 0, maxWidth: 920, fontFamily: "var(--font-newsreader), serif", fontWeight: 300, fontSize: "clamp(24px,3.2vw,44px)", lineHeight: 1.18, letterSpacing: "-0.015em", color: "#1C1814" }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div style={{ textAlign: "right", minWidth: 150, paddingTop: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1C1814", marginBottom: 4 }}>{q.name}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#57503F" }}>{q.org}</div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(28,24,20,0.16)" }} />
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" style={{ background: "#1C1814", color: "#F1ECE1", padding: "clamp(82px,14vh,172px) 0" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "clamp(48px,7vw,110px)", alignItems: "start" }}>
              <div data-reveal style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)" }}>
                <span style={{ display: "block", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C99A7F", marginBottom: "clamp(22px,4vh,38px)" }}>(Contact)</span>
                <h2 style={{ margin: "0 0 clamp(28px,5vh,44px)", fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(34px,5vw,76px)", lineHeight: 1.0, letterSpacing: "-0.025em", color: "#F1ECE1" }}>
                  Let&rsquo;s make something that <em style={{ fontStyle: "italic", color: "#C99A7F" }}>resonates.</em>
                </h2>
                <a href="mailto:hello@anahat.studio" data-hover className="contact-email-link">
                  hello@anahat.studio
                </a>
                <div style={{ display: "flex", gap: 22, marginTop: "clamp(30px,5vh,48px)" }}>
                  <a data-hover href="#top" className="footer-social-link">Instagram</a>
                  <a data-hover href="#top" className="footer-social-link">LinkedIn</a>
                  <a data-hover href="#top" className="footer-social-link">Vimeo</a>
                </div>
              </div>

              <div data-reveal style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)" }}>
                {sent ? (
                  <div style={{ border: "1px solid rgba(241,236,225,0.2)", borderRadius: 16, padding: "clamp(34px,4vw,52px)" }}>
                    <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.1, color: "#F1ECE1", marginBottom: 14 }}>
                      Thank you &mdash; <em style={{ fontStyle: "italic", color: "#C99A7F" }}>message received.</em>
                    </div>
                    <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "rgba(241,236,225,0.7)" }}>
                      We read everything ourselves and reply within two working days. Talk soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Name</span>
                        <input type="text" required className="form-input" />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Email</span>
                        <input type="email" required className="form-input" />
                      </label>
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Company</span>
                      <input type="text" className="form-input" />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,236,225,0.5)" }}>Tell us about the project</span>
                      <textarea rows={3} className="form-textarea" />
                    </label>
                    <button type="submit" data-hover className="submit-btn">
                      Send inquiry <span style={{ fontSize: 15 }}>&rarr;</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "#1C1814", color: "#F1ECE1", padding: "0 0 clamp(34px,5vh,56px)", borderTop: "1px solid rgba(241,236,225,0.14)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(24px,6vw,110px)", width: "100%" }}>
            <div style={{ fontFamily: "var(--font-newsreader), serif", fontWeight: 400, fontSize: "clamp(72px,21vw,360px)", lineHeight: 0.86, letterSpacing: "-0.03em", color: "#F1ECE1", padding: "clamp(40px,6vh,80px) 0 clamp(26px,4vh,48px)", overflow: "hidden" }}>
              Anahat
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 18, paddingTop: "clamp(22px,3vh,32px)", borderTop: "1px solid rgba(241,236,225,0.14)", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(241,236,225,0.55)" }}>
              <span>&copy; 2026 Anahat Entertainment</span>
              <span>Made to resonate</span>
              <span>Mumbai / Worldwide</span>
            </div>
          </div>
        </footer>

      </div>

      {/* CUSTOM CURSOR */}
      <div id="ah-cursor-ring" style={{ position: "fixed", top: 0, left: 0, width: 38, height: 38, border: "1.5px solid #ffffff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, mixBlendMode: "difference", transform: "translate(-100px,-100px)", willChange: "transform", transition: "border-color .3s ease" }} />
      <div id="ah-cursor-dot" style={{ position: "fixed", top: 0, left: 0, width: 6, height: 6, background: "#ffffff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, mixBlendMode: "difference", transform: "translate(-100px,-100px)", willChange: "transform", transition: "opacity .3s ease" }} />
    </>
  );
}
