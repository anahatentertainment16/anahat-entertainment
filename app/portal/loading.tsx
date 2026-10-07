export default function PortalLoading() {
  const bar = "rounded-full bg-ink/[0.07] motion-safe:animate-pulse";
  return (
    <div className="min-h-[100dvh] px-4 py-6 sm:px-8" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-[1080px]">
        <div className={`${bar} h-6 w-32`} />
        <div className={`${bar} mt-16 h-12 w-80 max-w-full`} />
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-96 rounded-2xl bg-ink/[0.05] motion-safe:animate-pulse" />
          <div className="h-48 rounded-2xl bg-ink/[0.05] motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}
