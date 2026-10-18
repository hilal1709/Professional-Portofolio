/** Kerangka instan saat halaman CMS memuat data, supaya navigasi terasa cepat. */
export default function Loading() {
  return (
    <div className="max-w-5xl animate-pulse" aria-busy="true" aria-label="Memuat">
      <div className="h-10 w-64 rounded-lg bg-paper-deep" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-paper-deep" />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-14 rounded-xl bg-card ring-1 ring-border" />
        ))}
      </div>
    </div>
  );
}
