"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de l'erreur dans la console pour l'inspection de l'administrateur
    console.error("Admin Error Captured:", error);
  }, [error]);

  return (
    <div className="mx-auto my-12 max-w-xl rounded-xl border border-rose-500/20 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-extrabold tracking-tight text-white">
            Une erreur est survenue dans la console
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            L'opération n'a pas pu être exécutée correctement.
          </p>

          {/* Détails de l'erreur */}
          <div className="mt-4 rounded-lg border border-white/5 bg-zinc-950/80 p-3 font-mono text-xs text-rose-300">
            {error.message || "Erreur système non spécifiée."}
            {error.digest && (
              <span className="mt-1 block text-[10px] text-gray-500">
                Digest: {error.digest}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-brand-500 active:scale-[0.99]"
            >
              <RotateCcw size={14} /> Réessayer
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              <LayoutDashboard size={14} /> Tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}