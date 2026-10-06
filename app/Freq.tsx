// Deterministic "frequency" fingerprint per title: each project and service has its own signal.
function freqPattern(seed: string, count = 22): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(14 + ((h % 1000) / 1000) * 50);
  }
  return bars;
}

export default function Freq({ seed, count, className = "" }: { seed: string; count?: number; className?: string }) {
  return (
    <div aria-hidden className={`flex h-16 items-end gap-[3px] ${className}`}>
      {freqPattern(seed, count).map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-current" style={{ height: h, opacity: 0.35 + (i % 3) * 0.22 }} />
      ))}
    </div>
  );
}
