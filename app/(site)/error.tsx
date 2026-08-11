"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-3 text-xl font-bold text-ink">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-gray-500">
        Quelque chose s&apos;est mal passé. Réessaie, ou reviens plus tard si le problème persiste.
      </p>
      <button onClick={reset} className="site-btn mt-6">
        Réessayer
      </button>
    </main>
  );
}
