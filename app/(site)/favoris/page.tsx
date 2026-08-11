import { Suspense } from "react";
import FavorisClient from "./FavorisClient";

// Ce fichier est un Server Component (pas de "use client"), donc cette option est bien prise en compte par Next.js
export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-400">Chargement…</p>}>
      <FavorisClient />
    </Suspense>
  );
}