"use client";

import { useState } from "react";
import Image from "next/image";
import type { Project } from "../Home";
import Freq from "../Freq";
import { ArrowUpRight, Clock } from "lucide-react";

// Rows repeat in groups of five: a 7/5 pair, then a 4/4/4 trio. A short final row stretches so no cell sits empty.
const SPAN: Record<number, string> = { 12: "md:col-span-12", 7: "md:col-span-7", 6: "md:col-span-6", 5: "md:col-span-5", 4: "md:col-span-4" };
function span(i: number, n: number) {
  const g = i % 5, base = i - g;
  if (g < 2) return n - base < 2 ? 12 : g ? 5 : 7;
  return 12 / Math.min(3, n - base - 2);
}

export default function ProjectsIndex({ projects }: { projects: Project[] }) {
  const tags = [...new Set(projects.flatMap((p) => p.tags))].sort();
  const [tag, setTag] = useState<string | null>(null);
  const shown = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;

  return (
    <>
      {tags.length > 1 && (
        <div role="group" aria-label="Filter by type" className="mb-10 flex flex-wrap gap-2 md:mb-14">
          {[null, ...tags].map((t) => (
            <button key={t ?? "all"} type="button" aria-pressed={tag === t} onClick={() => setTag(t)} className={`btn btn-sm ${tag === t ? "btn-solid" : "btn-ghost"}`}>
              {t ?? "All"}
            </button>
          ))}
        </div>
      )}
      <ul className="m-0 grid list-none grid-cols-1 items-start gap-x-6 gap-y-14 p-0 md:grid-cols-12 md:gap-y-20 lg:gap-x-8">
        {shown.map((p, i) => {
          const s = span(i, shown.length);
          // The 7/5 pair shares one height so both captions start on the same line.
          const frame = s === 12 ? "aspect-[16/10] md:aspect-[21/9]" : s === 7 || s === 5 ? "aspect-[16/10] md:aspect-auto md:h-[clamp(260px,30vw,440px)]" : "aspect-[16/10]";
          const body = (
            <>
              <div className={`relative overflow-hidden rounded-[20px] bg-surface ${frame}`}>
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.title}
                    fill
                    sizes={s === 12 ? "100vw" : `(max-width: 768px) 100vw, ${Math.round((s / 12) * 100)}vw`}
                    className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full place-items-center"><Freq seed={p.title} count={36} className="scale-150 text-accent" /></div>
                )}
              </div>
              <div className="mt-5 flex items-start justify-between gap-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.1em] text-accent">{p.tags.join(" / ")}</span>
                  <h2 className="m-0 mt-2 font-display text-2xl font-semibold leading-[1.05] tracking-tight md:text-3xl">{p.title}</h2>
                </div>
                {p.link ? (
                  <ArrowUpRight size={26} className="mt-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                ) : (
                  <span className="mt-5 inline-flex shrink-0 items-center gap-1.5 text-sm text-muted"><Clock size={15} /> In development</span>
                )}
              </div>
              <p className="m-0 mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted">{p.description}</p>
            </>
          );
          return (
            <li key={p.id} className={SPAN[s]}>
              {p.link ? (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="group block text-ink no-underline">{body}</a>
              ) : (
                <div className="group">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
