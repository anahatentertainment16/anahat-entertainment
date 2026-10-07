"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EMAIL, WRAP } from "@/lib/site";
import Image from "next/image";
import { services } from "@/lib/services";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import HeroScene from "./HeroScene";
import Navbar from "./Navbar";
import Loader from "./Loader";
import { siteReady } from "./ready";
import Hairline from "./Hairline";
import Freq from "./Freq";
import InquiryForm from "./services/[slug]/InquiryForm";
import { ArrowRight, ArrowUp, ArrowUpRight, ChevronDown, Clock, Mail, MapPin } from "lucide-react";

type Testimonial = { id: number; name: string; org: string | null; quote: string };

export type Project = { id: number; title: string; link: string | null; tags: string[]; description: string; image_url: string | null; featured: boolean };
export type Member = { id: number; name: string; role: string; link: string | null; photo_url: string | null };

const NAV = ["Services", "Projects", "Studio", "Voices"];

// Services grid: span, tone and figure per discipline. --hairline-plate must match the cell background.
const DISCIPLINES: Record<string, { cell: string; wide: boolean; figure: React.ReactNode }> = {
  "advertising-branded-content": {
    cell: "bg-accent text-on-accent md:col-span-7 [--hairline-plate:var(--accent)]",
    wide: true,
    figure: <Hairline name="ovation" label="A cinema audience facing the screen, people standing up from their seats" />,
  },
  "web-development": {
    cell: "bg-surface text-ink md:col-span-5 [--hairline-plate:var(--surface)]",
    wide: false,
    figure: <Hairline name="layout" label="A web page laid flat in its window, its blocks lifting off the page" />,
  },
  "ai-partnerships": {
    cell: "bg-ink text-paper md:col-span-5 [--hairline-plate:var(--ink)]",
    wide: false,
    figure: <Hairline name="layers" label="A model as a stack of plates, noise at the bottom settling into a ring at the top" />,
  },
  "social-media": {
    cell: "border border-line text-ink md:col-span-7 [--hairline-plate:var(--paper)]",
    wide: true,
    figure: <Hairline name="ripple" label="A phone's grid of posts, one lifting and the lift spreading to its neighbours" />,
  },
  // Full-width row: a laptop lid opening, code writing itself until it ships.
  "custom-software": {
    cell: "bg-surface text-ink md:col-span-12 md:flex-row-reverse md:items-center md:gap-12 [--hairline-plate:var(--surface)]",
    wide: true,
    figure: <Hairline name="hinge" label="A laptop lid opening, code writing itself across the screen until it ships" />,
  },
};

export default function Home({ projects, projectCount, team }: { projects: Project[]; projectCount: number; team: Member[] }) {
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);
  // Team and Voices links only show once their sections have something to show.
  const nav = (team.length ? [...NAV.slice(0, 3), "Team", NAV[3]] : NAV).filter((l) => l !== "Voices" || testimonials?.length);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleTestimonial = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    fetch("/api/testimonials").then((r) => r.json()).then(setTestimonials).catch(() => setTestimonials([]));
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const splits: SplitText[] = [];

    const ctx = gsap.context(() => {
      if (reduce) return;

      // Hero: lines rise in, then the rest settles.
      const heroTl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
      siteReady.then(() => heroTl.play());
      heroTl
        .from(".hero-line", { yPercent: 110, duration: 1.15, stagger: 0.12 }, 0.1)
        .from(".hero-after", { opacity: 0, y: 20, duration: 0.9, stagger: 0.1 }, 0.6);

      gsap.utils.toArray<Element>("[data-reveal]").forEach((el) => {
        gsap.from(el, { opacity: 0, y: 36, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 87%", once: true } });
      });

      // Manifesto reads itself in as you scroll.
      const manifesto = document.querySelector<HTMLElement>(".studio-manifesto");
      if (manifesto) {
        const split = new SplitText(manifesto, { type: "words" });
        splits.push(split);
        gsap.fromTo(split.words, { opacity: 0.15 }, {
          opacity: 1, stagger: 0.09, ease: "none",
          scrollTrigger: { trigger: manifesto, start: "top 75%", end: "bottom 35%", scrub: 1 },
        });
      }
    });

    return () => {
      ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, []);

  useEffect(() => {
    if (!testimonials?.length) return;
    const viewport = document.querySelector<HTMLElement>(".testimonials-viewport");
    const track = document.querySelector<HTMLElement>(".testimonials-track");
    if (!viewport || !track) return;
    const maxX = -(track.scrollWidth - viewport.offsetWidth);
    const [dragger] = Draggable.create(track, {
      type: "x",
      bounds: { minX: Math.min(maxX, 0), maxX: 0 },
      edgeResistance: 0.92,
      inertia: true,
      onPress() { viewport.style.cursor = "grabbing"; },
      onRelease() { viewport.style.cursor = "grab"; },
    });
    return () => { dragger.kill(); };
  }, [testimonials]);

  return (
    <>
      <Loader />

      <Navbar items={nav} />

      <main id="top">
        {/* HERO: split, headline left, illustrated scene right */}
        <section className="flex min-h-[100dvh] items-center pb-10 pt-24 md:pb-14">
          <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-12 lg:gap-6`}>
            <div className="lg:col-span-6">
              <h1 className="m-0 font-display text-[clamp(44px,5.2vw,92px)] font-bold leading-[0.94] tracking-[-0.04em]">
                <span className="block overflow-hidden pb-[0.06em]"><span className="hero-line block">We make brands</span></span>
                <span className="block overflow-hidden pb-[0.06em]"><span className="hero-line block text-accent">resonate.</span></span>
              </h1>
              <p className="hero-after m-0 mt-7 max-w-[40ch] text-lg leading-relaxed text-muted md:mt-9 md:text-xl">
                A creative studio for brand films, advertising, websites, custom software, social and AI. Based in Pune, working worldwide.
              </p>
              <div className="hero-after mt-8 flex flex-wrap gap-3 md:mt-10">
                <a href="#contact" className="btn btn-solid">Start a project <ArrowRight size={18} /></a>
                <a href="#projects" className="btn btn-ghost">Selected work</a>
              </div>
            </div>
            <div className="hero-after lg:col-span-6 lg:-mr-10 xl:-mr-24">
              <HeroScene />
            </div>
          </div>
        </section>

        {/* SERVICES: figure-first 2x2, widths alternate 7/5 then 5/7; each discipline is an object you can play with */}
        <section id="services" className="border-t border-line py-20 md:py-32">
          <div className={WRAP}>
            <h2 data-reveal className="m-0 mb-10 max-w-[18ch] font-display text-4xl font-semibold leading-[1.02] tracking-tight md:mb-14 md:text-6xl">
              Five disciplines, one resonance.
            </h2>
            <div data-reveal className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
              {services.map((s) => {
                const d = DISCIPLINES[s.slug];
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className={`group flex flex-col gap-8 rounded-[20px] p-6 no-underline outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent md:p-8 ${d.cell}`}
                  >
                    <div className={`mx-auto w-full ${d.wide ? "max-w-[480px]" : "max-w-[360px]"}`}>{d.figure}</div>
                    <div className="mt-auto">
                      <div className="flex items-start justify-between gap-6">
                        <h3 className="m-0 max-w-[16ch] font-display text-3xl font-semibold leading-none tracking-tight md:text-4xl">{s.title}</h3>
                        <ArrowUpRight size={28} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                      </div>
                      <p className="m-0 mt-4 max-w-[46ch] text-[15px] leading-relaxed opacity-75">{s.blurb}</p>
                      {s.includes && (
                        <ul className="m-0 mt-6 flex list-none flex-wrap gap-2 p-0">
                          {s.includes.map(({ label, icon: Icon }) => (
                            <li key={label} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm">
                              <Icon size={14} className="text-accent" /> {label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROJECTS: featured work, lead project first */}
        <section id="projects" className="border-t border-line py-20 md:py-32">
          <div className={WRAP}>
            <h2 data-reveal className="m-0 mb-10 max-w-[20ch] font-display text-4xl font-semibold leading-[1.02] tracking-tight md:mb-14 md:text-6xl">
              Made to be felt, not just seen.
            </h2>
            {projects.length === 0 ? (
              <p className="m-0 text-muted">New work is on its way. <a href="#contact" className="u-link text-ink">Start a project</a> to be next.</p>
            ) : (
              <>
                {/* Lead project as a split panel, the rest two to a row */}
                {(() => {
                  const [lead, ...rest] = projects;
                  const thumb = (p: Project, sizes: string) =>
                    p.image_url ? (
                      <Image src={p.image_url} alt={p.title} fill sizes={sizes} className="object-cover object-top" />
                    ) : (
                      <div className="grid h-full place-items-center"><Freq seed={p.title} count={36} className="scale-150 text-accent" /></div>
                    );
                  return (
                    <>
                      <article data-reveal className="grid overflow-hidden rounded-[20px] bg-surface lg:grid-cols-12">
                        <div className="relative aspect-[16/10] bg-paper lg:col-span-8 lg:aspect-auto lg:min-h-[460px]">{thumb(lead, "(max-width: 1024px) 100vw, 66vw")}</div>
                        <div className="flex flex-col items-start p-6 md:p-10 lg:col-span-4 lg:justify-center">
                          <span className="font-mono text-xs uppercase tracking-[0.1em] text-accent">{lead.tags.join(" / ")}</span>
                          <h3 className="m-0 mt-3 font-display text-3xl font-semibold leading-[1.02] tracking-tight md:text-5xl">{lead.title}</h3>
                          <p className="m-0 mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">{lead.description}</p>
                          {lead.link ? (
                            <a href={lead.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-7">Visit site <ArrowUpRight size={18} /></a>
                          ) : (
                            <span className="mt-7 inline-flex items-center gap-1.5 text-sm text-muted"><Clock size={15} /> In development</span>
                          )}
                        </div>
                      </article>
                      {rest.length > 0 && (
                        <ul data-reveal className="m-0 mt-10 grid list-none grid-cols-1 gap-x-6 gap-y-12 p-0 md:mt-14 md:grid-cols-2 lg:gap-x-8">
                          {rest.map((p, i) => {
                            // An odd one out takes the full row (wider crop) so no cell sits empty.
                            const wide = i === rest.length - 1 && rest.length % 2 === 1;
                            const body = (
                              <>
                                <div className={`relative aspect-[16/10] overflow-hidden rounded-[20px] bg-surface ${wide ? "md:aspect-[21/9]" : ""}`}>{thumb(p, wide ? "100vw" : "(max-width: 768px) 100vw, 50vw")}</div>
                                <div className="mt-5 flex items-start justify-between gap-6">
                                  <div>
                                    <span className="font-mono text-xs uppercase tracking-[0.1em] text-accent">{p.tags.join(" / ")}</span>
                                    <h3 className="m-0 mt-2 font-display text-2xl font-semibold leading-[1.05] tracking-tight md:text-3xl">{p.title}</h3>
                                  </div>
                                  {p.link ? <ArrowUpRight size={26} className="mt-5 shrink-0" /> : <span className="mt-5 inline-flex shrink-0 items-center gap-1.5 text-sm text-muted"><Clock size={15} /> In development</span>}
                                </div>
                              </>
                            );
                            return (
                              <li key={p.id} className={wide ? "md:col-span-2" : ""}>
                                {p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer" className="block text-ink no-underline">{body}</a> : body}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  );
                })()}
                <Link href="/projects" className="btn btn-ghost mt-10">See all {projectCount} projects <ArrowRight size={18} /></Link>
              </>
            )}
          </div>
        </section>

        {/* STUDIO */}
        <section id="studio" className="border-t border-line py-24 md:py-40">
          <div className={WRAP}>
            <p className="studio-manifesto m-0 mb-16 max-w-[26ch] font-display text-[clamp(30px,4.4vw,64px)] font-medium leading-[1.08] tracking-[-0.025em] md:mb-24">
              Anahat is the unstruck sound, resonance that needs no source. We build the same way: <span className="text-accent">work that keeps moving </span>once it&rsquo;s out in the world.
            </p>
            <div data-reveal className="grid gap-10 border-t border-line pt-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-14">
              <p className="m-0 max-w-[36ch] text-lg leading-relaxed text-ink">
                A small, senior team of strategists, filmmakers and engineers who&rsquo;d rather make one unforgettable thing than ten forgettable ones.
              </p>
              {[
                { title: "Taste first", body: "Craft is the strategy. We sweat the cut, the kerning and the load time, because that's what people feel." },
                { title: "Tools as leverage", body: "AI is a brush, not the painter. It lets a few people move like a studio of fifty." },
              ].map((p) => (
                <div key={p.title}>
                  <h3 className="m-0 mb-2 font-display text-xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-muted">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM */}
        {team.length > 0 && (
          <section id="team" className="border-t border-line py-20 md:py-32">
            <div className={WRAP}>
              <h2 data-reveal className="m-0 mb-10 max-w-[18ch] font-display text-4xl font-semibold leading-[1.02] tracking-tight md:mb-14 md:text-6xl">
                The people behind the work.
              </h2>
              <ul data-reveal className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-10 p-0 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
                {team.map((m) => {
                  const body = (
                    <>
                      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-[20px] bg-surface">
                        {m.photo_url ? (
                          <Image
                            src={m.photo_url}
                            alt={m.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover grayscale transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
                          />
                        ) : (
                          <span aria-hidden className="grid h-full place-items-center font-display text-5xl font-bold tracking-tight text-accent">
                            {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="m-0 font-display text-lg font-semibold leading-tight tracking-tight md:text-xl">{m.name}</h3>
                          <p className="m-0 mt-1 text-sm text-muted">{m.role}</p>
                        </div>
                        {m.link && <ArrowUpRight size={18} className="mt-1 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />}
                      </div>
                    </>
                  );
                  return (
                    <li key={m.id}>
                      {m.link ? (
                        <a href={m.link} target="_blank" rel="noopener noreferrer" className="group block text-ink no-underline">{body}</a>
                      ) : (
                        <div className="group">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* VOICES: only once approved testimonials exist; footer keeps the "Leave a testimonial" link */}
        {testimonials && testimonials.length > 0 && (
        <section id="voices" className="border-t border-line py-20 md:py-32">
          <div className={WRAP}>
            <h2 data-reveal className="m-0 mb-10 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">What partners say</h2>
            <div className="testimonials-viewport cursor-grab select-none overflow-hidden">
                <div className="testimonials-track flex gap-4">
                  {testimonials.map((q) => {
                    const open = expanded.has(q.id);
                    return (
                      <figure key={q.id} className="m-0 flex w-[clamp(280px,42vw,560px)] shrink-0 flex-col justify-between gap-6 rounded-[20px] bg-surface p-7 md:p-10">
                        <blockquote className={`m-0 font-display text-xl font-medium leading-snug tracking-tight md:text-2xl ${open ? "" : "line-clamp-3"}`}>
                          &ldquo;{q.quote}&rdquo;
                        </blockquote>
                        {q.quote.length > 160 && (
                          <button type="button" onClick={() => toggleTestimonial(q.id)} className="inline-flex items-center gap-1.5 cursor-pointer self-start bg-transparent p-0 font-mono text-xs uppercase tracking-[0.1em] text-accent">
                            {open ? "Show less" : "Read more"} <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                          </button>
                        )}
                        <figcaption>
                          <div className="text-sm font-semibold">{q.name}</div>
                          {q.org && <div className="mt-1 text-sm text-muted">{q.org}</div>}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            <div className="mt-8">
              <Link href="/testimonial" className="btn btn-ghost">Share your experience <ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
        )}

        {/* CONTACT: the one accent panel */}
        <section id="contact" className="py-6 md:py-10">
          <div className={WRAP}>
            <div className="on-accent grid gap-12 rounded-[28px] bg-accent p-7 text-on-accent md:grid-cols-2 md:gap-16 md:p-14 lg:p-20">
              <div data-reveal>
                <h2 className="m-0 mb-8 font-display text-[clamp(40px,5.4vw,80px)] font-bold leading-[0.95] tracking-[-0.035em]">
                  Let&rsquo;s make something that resonates.
                </h2>
                <a href={`mailto:${EMAIL}`} className="u-link inline-flex items-center gap-2 text-[15px] text-on-accent [overflow-wrap:anywhere] sm:text-lg md:text-xl"><Mail size={18} className="shrink-0" />{EMAIL}</a>
                <Hairline name="inbox" label="A letter tray of envelopes, a new one standing up out of the stack" className="-mb-[10%] -ml-[16%] -mt-[6%] max-w-[480px] [--hairline-plate:var(--accent)]" />
              </div>
              <div data-reveal>
                <InquiryForm service={{ title: "General Inquiry" }} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER: quiet link grid, then the wordmark as the one loud thing. Letters ripple on hover, like a struck note. */}
      <footer className="border-t border-line pt-16 md:pt-24">
        <div className={WRAP}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-12 lg:gap-8">
            <p className="m-0 max-w-[30ch] text-lg leading-snug text-ink col-span-2 lg:col-span-3">
              Brand films, advertising, websites, custom software, social and AI, made by a small senior team.
            </p>

            <nav aria-label="Footer" className="lg:col-span-2">
              <h3 className="m-0 mb-4 text-sm font-normal text-muted">Explore</h3>
              <ul className="m-0 grid list-none gap-2.5 p-0">
                {nav.map((l) => (
                  <li key={l}><a href={`#${l.toLowerCase()}`} className="u-link text-ink">{l}</a></li>
                ))}
                <li><Link href="/projects" className="u-link text-ink">All projects</Link></li>
                <li><Link href="/testimonial" className="u-link text-ink">Leave a testimonial</Link></li>
              </ul>
            </nav>

            <nav aria-label="Services" className="lg:col-span-3">
              <h3 className="m-0 mb-4 text-sm font-normal text-muted">Services</h3>
              <ul className="m-0 grid list-none gap-2.5 p-0">
                {services.map((s) => (
                  <li key={s.slug}><Link href={`/services/${s.slug}`} className="u-link text-ink">{s.title}</Link></li>
                ))}
              </ul>
            </nav>

            <address className="col-span-2 not-italic lg:col-span-4">
              <h3 className="m-0 mb-4 text-sm font-normal text-muted">Contact</h3>
              <a href={`mailto:${EMAIL}`} className="u-link inline-flex items-center gap-2 text-ink [overflow-wrap:anywhere]"><Mail size={16} className="shrink-0 text-accent" />{EMAIL}</a>
              <p className="m-0 mt-2.5 inline-flex items-center gap-2 text-ink"><MapPin size={16} className="shrink-0 text-accent" />Pune, Maharashtra, India</p>
            </address>
          </div>

          <a href="#top" aria-label="Anahat Entertainment, back to top" className="footer-wordmark mt-16 block select-none font-display text-[clamp(48px,24.4vw,330px)] font-bold leading-[0.78] tracking-[-0.055em] text-ink no-underline md:mt-24">
            {"Anahat".split("").map((ch, i) => (
              <span key={i} aria-hidden style={{ "--i": i } as React.CSSProperties}>{ch}</span>
            ))}
            <span aria-hidden className="text-accent" style={{ "--i": 6 } as React.CSSProperties}>.</span>
          </a>

          <div className="flex flex-col gap-4 border-t border-line py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0">&copy; {new Date().getFullYear()} Anahat Entertainment. All rights reserved.</p>
            <a href="#top" className="u-link inline-flex items-center gap-1.5 self-start text-ink sm:self-auto">Back to top <ArrowUp size={15} /></a>
          </div>
        </div>
      </footer>
    </>
  );
}
