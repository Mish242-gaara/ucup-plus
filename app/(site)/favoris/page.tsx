"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useFavorites } from "@/lib/hooks/useFavorites";
import MatchCard from "@/components/MatchCard";
import PushNotificationToggle from "@/components/PushNotificationToggle";

type ApiMatch = {
  id: number;
  status: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  currentMinute: number | null;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: { name: string; university: { logo: string | null } };
  awayTeam: { name: string; university: { logo: string | null } };
};

function FavoritesContent() {
  const { favoriteIds } = useFavorites();
  const [matches, setMatches] = useState<ApiMatch[] | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then(setMatches);
  }, []);

  const favoriteMatches = (matches ?? []).filter(
    (m) => favoriteIds.includes(m.homeTeamId) || favoriteIds.includes(m.awayTeamId)
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
        <Star size={22} className="fill-brand-500 text-brand-500" /> Mes favoris
      </h1>

      {favoriteIds.length > 0 && (
        <div className="mt-3">
          <PushNotificationToggle favoriteIds={favoriteIds} />
        </div>
      )}

      {favoriteIds.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">
          Tu n&apos;as pas encore d&apos;équipe favorite. Clique sur l&apos;étoile ⭐ sur la{" "}
          <Link href="/teams" className="text-brand-500 hover:underline">
            page équipes
          </Link>{" "}
          pour en suivre une.
        </p>
      ) : matches === null ? (
        <p className="mt-6 text-sm text-gray-400">Chargement…</p>
      ) : favoriteMatches.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">Aucun match pour tes équipes favorites pour le moment.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {favoriteMatches.map((m) => (
            <MatchCard key={m.id} m={{ ...m, matchDate: new Date(m.matchDate) }} />
          ))}
        </div>
      )}
    </main>
  );
}


export default function FavoritesPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-400">Chargement…</p>}>
      <FavoritesContent />
    </Suspense>
  );
}