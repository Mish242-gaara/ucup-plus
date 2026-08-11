"use client";

import { useRealtime } from "@/lib/hooks/useRealtime";
import MatchCard from "@/components/MatchCard";

type ApiMatch = {
  id: number;
  status: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  currentMinute: number | null;
  homeTeam: { name: string; university: { logo: string | null } };
  awayTeam: { name: string; university: { logo: string | null } };
};

export default function LiveFeed({
  initialMatches,
  filter,
  emptyMessage = "Aucun match à afficher pour le moment.",
}: {
  initialMatches: ApiMatch[];
  filter?: "live" | "finished" | "upcoming";
  emptyMessage?: string;
}) {
  const url =
    filter === "live"
      ? "/api/matches?status=live"
      : filter === "finished"
        ? "/api/matches?status=finished"
        : filter === "upcoming"
          ? "/api/matches?status=scheduled"
          : "/api/matches";

  const allMatches = useRealtime<ApiMatch[]>(url, initialMatches, "matches");

  // The homepage feed combines live + a handful of upcoming matches; the
  // dedicated /matches?filter=live already narrows server-side via `url`.
  const matches = filter ? allMatches : allMatches.filter((m) => m.status !== "finished").slice(0, 12);

  if (matches.length === 0) {
    return <div className="site-card p-6 text-sm text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchCard key={m.id} m={{ ...m, matchDate: new Date(m.matchDate) }} />
      ))}
    </div>
  );
}
