export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="site-card overflow-hidden">
            <div className="aspect-square w-full animate-pulse bg-gray-100" />
            <div className="p-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
