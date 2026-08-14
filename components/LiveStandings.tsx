"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useRealtime } from "@/lib/hooks/useRealtime";
import TeamLogo from "@/components/TeamLogo";

type ApiStanding = {
  id: number;
  teamId: number;
  group: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  team: {
    name: string;
    university?: {
      logo: string | null;
    } | null;
  };
};

type LiveMatch = {
  id: number;
  status: string; // "live" | "halftime" | "finished" | etc.
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
};

type ComputedStanding = ApiStanding & {
  initialPosition: number;
  livePosition: number;
  positionChange: number;
  isLive: boolean;
};

export default function LiveStandings({
  initialStandings,
  initialLiveMatches = [],
}: {
  initialStandings: ApiStanding[];
  initialLiveMatches?: LiveMatch[];
}) {
  // Écoute en temps réel des classements de base & des matchs en direct
  const standings = useRealtime<ApiStanding[]>("/api/standings", initialStandings, "standings");
  const liveMatches = useRealtime<LiveMatch[]>("/api/matches/live", initialLiveMatches, "live-matches");

  const groups = Array.from(new Set(standings.map((s) => s.group ?? "—"))).sort();

  // Recalcul du classement par groupe incluant les résultats en direct
  const computedGroups = useMemo(() => {
    const result: Record<string, ComputedStanding[]> = {};

    groups.forEach((group) => {
      // 1. Filtrer et trier pour connaître la position de départ (officielle)
      const groupStandings = standings
        .filter((s) => (s.group ?? "—") === group)
        .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

      // Créer une copie avec la position initiale enregistrée
      const map = new Map<number, ComputedStanding>();
      groupStandings.forEach((s, idx) => {
        map.set(s.teamId, {
          ...s,
          initialPosition: idx + 1,
          livePosition: idx + 1,
          positionChange: 0,
          isLive: false,
        });
      });

      // 2. Appliquer l'impact des matchs en direct
      const activeLiveMatches = liveMatches.filter(
        (m) => m.status === "live" || m.status === "halftime"
      );

      activeLiveMatches.forEach((match) => {
        const home = map.get(match.homeTeamId);
        const away = map.get(match.awayTeamId);

        if (home) {
          home.isLive = true;
          home.played += 1;
          home.goalsFor += match.homeScore;
          home.goalsAgainst += match.awayScore;
          home.goalDifference = home.goalsFor - home.goalsAgainst;

          if (match.homeScore > match.awayScore) {
            home.won += 1;
            home.points += 3;
          } else if (match.homeScore < match.awayScore) {
            home.lost += 1;
          } else {
            home.drawn += 1;
            home.points += 1;
          }
        }

        if (away) {
          away.isLive = true;
          away.played += 1;
          away.goalsFor += match.awayScore;
          away.goalsAgainst += match.homeScore;
          away.goalDifference = away.goalsFor - away.goalsAgainst;

          if (match.awayScore > match.homeScore) {
            away.won += 1;
            away.points += 3;
          } else if (match.awayScore < match.homeScore) {
            away.lost += 1;
          } else {
            away.drawn += 1;
            away.points += 1;
          }
        }
      });

      // 3. Retrier selon les règles du tournoi
      const sortedRows = Array.from(map.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // 4. Calculer la variation de position live (ex: 3ème -> 1er = +2)
      result[group] = sortedRows.map((row, idx) => {
        const livePos = idx + 1;
        return {
          ...row,
          livePosition: livePos,
          positionChange: row.initialPosition - livePos,
        };
      });
    });

    return result;
  }, [standings, liveMatches, groups]);

  if (groups.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-400">
        Le classement sera disponible une fois les premiers matchs terminés.
      </p>
    );
  }

  const hasAnyLive = liveMatches.some((m) => m.status === "live" || m.status === "halftime");

  return (
    <>
      {hasAnyLive && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400">
          <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
          <span>CLASSEMENT EN DIRECT — Mis à jour automatiquement selon les scores en cours</span>
        </div>
      )}

      {groups.map((group) => {
        const rows = computedGroups[group] ?? [];

        return (
          <section key={group} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">
              Groupe {group}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th className="pb-2 w-8 text-center">#</th>
                    <th className="pb-2">Équipe</th>
                    <th className="pb-2 text-center">J</th>
                    <th className="pb-2 text-center">G</th>
                    <th className="pb-2 text-center">N</th>
                    <th className="pb-2 text-center">P</th>
                    <th className="pb-2 text-center">BP</th>
                    <th className="pb-2 text-center">BC</th>
                    <th className="pb-2 text-center">Diff.</th>
                    <th className="pb-2 text-center font-extrabold text-white">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, i) => {
                    const qualifies = i < 2;
                    const eliminated = i === rows.length - 1 && rows.length > 2;

                    return (
                      <tr
                        key={s.id}
                        className={`border-t border-gray-200 transition-colors ${
                          s.isLive ? "bg-amber-500/10" : qualifies ? "bg-green-50/50" : eliminated ? "bg-brand-50/50" : ""
                        }`}
                      >
                        {/* Rang & Variation */}
                        <td className="py-2.5 text-center font-bold">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs">{s.livePosition}</span>
                            {s.positionChange > 0 && (
                              <ArrowUp size={12} className="text-emerald-500 stroke-[3]" />
                            )}
                            {s.positionChange < 0 && (
                              <ArrowDown size={12} className="text-rose-500 stroke-[3]" />
                            )}
                            {s.positionChange === 0 && (
                              <Minus size={10} className="text-gray-400" />
                            )}
                          </div>
                        </td>

                        {/* Équipe */}
                        <td className="py-2.5">
                          <Link href={`/teams/${s.teamId}`} className="flex items-center gap-2 hover:text-brand-500">
                            <TeamLogo
                              name={s.team.name}
                              logo={s.team.university?.logo}
                              size={20}
                            />
                            <span className="font-semibold text-ink">{s.team.name}</span>
                            {s.isLive && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-500">
                                LIVE
                              </span>
                            )}
                          </Link>
                        </td>

                        {/* Stats */}
                        <td className="py-2.5 text-center">{s.played}</td>
                        <td className="py-2.5 text-center">{s.won}</td>
                        <td className="py-2.5 text-center">{s.drawn}</td>
                        <td className="py-2.5 text-center">{s.lost}</td>
                        <td className="py-2.5 text-center">{s.goalsFor}</td>
                        <td className="py-2.5 text-center">{s.goalsAgainst}</td>
                        <td className="py-2.5 text-center font-medium">
                          <span className={s.goalDifference > 0 ? "text-emerald-600 font-bold" : s.goalDifference < 0 ? "text-rose-600" : ""}>
                            {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-extrabold text-black">{s.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Qualifié pour la phase suivante
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Zone d&apos;élimination
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> En match actuellement (score en direct)
        </span>
      </div>
    </>
  );
}