"use client";

import Link from "next/link";

export default function PlayersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-card p-6">
      <h1 className="text-lg font-bold text-white">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-gray-500">{error.message || "Erreur inconnue."}</p>
      <div className="mt-4 flex gap-3">
        <button onClick={reset} className="btn">
          Réessayer
        </button>
        <Link href="/admin/players" className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-zinc-950">
          Retour à la liste
        </Link>
      </div>
    </div>
  );
}
