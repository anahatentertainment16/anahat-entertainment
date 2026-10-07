// Placeholder for the page area only; the sidebar stays on screen from the layout.
export default function DeskLoading() {
  const block = "rounded-2xl bg-ink/[0.05] motion-safe:animate-pulse";
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-10 border-b border-line pb-8">
        <div className="h-11 w-64 max-w-full rounded-full bg-ink/[0.07] motion-safe:animate-pulse" />
        <div className="mt-4 h-4 w-96 max-w-full rounded-full bg-ink/[0.07] motion-safe:animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className={`${block} h-28`} />)}</div>
        <div className={`${block} h-64`} />
      </div>
    </div>
  );
}
