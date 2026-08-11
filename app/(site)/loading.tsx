export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="site-card h-28 animate-pulse bg-gray-100" />
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="site-card h-40 animate-pulse bg-gray-100" />
          <div className="site-card h-48 animate-pulse bg-gray-100" />
          <div className="site-card h-40 animate-pulse bg-gray-100" />
        </aside>
      </div>
    </main>
  );
}
