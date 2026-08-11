"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-card p-6">
      <h1 className="text-lg font-bold text-white">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-gray-500">{error.message || "Erreur inconnue."}</p>
      <button onClick={reset} className="btn mt-4">
        Réessayer
      </button>
    </div>
  );
}
