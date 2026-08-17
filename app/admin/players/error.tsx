"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PlayersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de l'erreur côté client pour le débogage
    console.error("Erreur détectée dans le module Joueurs :", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl text-center">
        {/* Badge d'erreur */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-black tracking-tight text-white sm:text-2xl">
          Une erreur est survenue
        </h1>

        <p className="mt-2 text-xs font-medium text-gray-400 leading-relaxed">
          {error.message || "Une erreur inattendue est survenue lors du chargement des données des joueurs."}
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-zinc-600">
            ID Erreur: {error.digest}
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn w-full sm:w-auto rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-brand-500 active:scale-[0.99]"
          >
            Réessayer
          </button>

          <Link
            href="/admin/players"
            className="w-full sm:w-auto rounded-lg border border-white/10 bg-zinc-800 px-5 py-2.5 text-xs font-bold text-gray-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    </div>
  );
}