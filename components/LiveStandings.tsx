"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react";
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
  status: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeTeam?: { id: number };
  awayTeam?: { id: number };
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
  const realtimeStandings = useRealtime<ApiStanding[]>("/api/standings", initialStandings, "standings");
  const realtimeLiveMatches = useRealtime<LiveMatch[]>("/api/matches/live", initialLiveMatches, "live-matches");

  const [standings, setStandings] = useState<ApiStanding[]>(initialStandings);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>(initialLiveMatches);

  // Synchronisation avec Realtime
  useEffect(() => {
    if (Array.isArray(realtimeStandings) && realtimeStandings.length > 0) {
      setStandings(realtimeStandings);
    }
  }, [realtimeStandings]);

  useEffect(() => {
    if (Array.isArray(realtimeLiveMatches)) {
      setLiveMatches(realtimeLiveMatches);
    }
  }, [realtimeLiveMatches]);

  // AUTO-POLLING : Rafraîchit les matchs en direct toutes les 5 secondes sans recharger la page
  useEffect(() => {
    const fetchLiveUpdates = async () => {
      try {
        const resMatches = await fetch("/api/matches/live");
        if (resMatches.ok) {
          const data = await resMatches.json();
          setLiveMatches(data);
        }
      } catch (err) {
        console.error("Erreur de rafraîchissement auto:", err);
      }
    };

    const interval = setInterval(fetchLiveUpdates, 5000);
    return () => clearInterval(interval);
  }, []);

  const groups = Array.from(new Set(standings.map((s) => s.group ?? "—"))).sort();

  const computedGroups = useMemo(() => {
    const result: Record<string, ComputedStanding[]> = {};

    groups.forEach((group) => {
      const groupStandings = standings
        .filter((s) => (s.group ?? "—") === group)
        .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

      const map = new Map<number, ComputedStanding>();
      groupStandings.forEach((s, idx) => {
        map.set(Number(s.teamId), {
          ...s,
          initialPosition: idx + 1,
          livePosition: idx + 1,
          positionChange: 0,
          isLive: false,
        });
      });

      const activeLiveMatches = liveMatches.filter((m) => {
        const st = String(m.status || "").toLowerCase();
        return st === "live" || st === "halftime" || st === "in_play";
      });

      activeLiveMatches.forEach((match) => {
        const homeId = Number(match.homeTeamId ?? match.homeTeam?.id);
        const awayId = Number(match.awayTeamId ?? match.awayTeam?.id);

        const home = map.get(homeId);
        const away = map.get(awayId);

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

      const sortedRows = Array.from(map.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

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

  const hasAnyLive = liveMatches.some((m) => {
    const st = String(m.status || "").toLowerCase();
    return st === "live" || st === "halftime" || st === "in_play";
  });

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Le classement sera disponible dès le début des rencontres.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bandeau Live stylisé */}
      {hasAnyLive && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              Classement en direct
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-600/80">
            <RefreshCw size={12} className="animate-spin" />
            <span>Mis à jour toutes les 5s</span>
          </div>
        </div>
      )}

      {/* Cartes de classement par groupe */}
      {groups.map((group) => {
        const rows = computedGroups[group] ?? [];

        return (
          <div key={group} className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Groupe {group}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50/30 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="py-3 pl-4 pr-2 text-center w-10">#</th>
                    <th className="py-3 px-3">Équipe</th>
                    <th className="py-3 px-2 text-center w-10">J</th>
                    <th className="py-3 px-2 text-center w-10">G</th>
                    <th className="py-3 px-2 text-center w-10">N</th>
                    <th className="py-3 px-2 text-center w-10">P</th>
                    <th className="py-3 px-2 text-center w-10">BP</th>
                    <th className="py-3 px-2 text-center w-10">BC</th>
                    <th className="py-3 px-2 text-center w-12">Diff.</th>
                    <th className="py-3 pl-2 pr-4 text-center w-12 font-black text-gray-900">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((s, i) => {
                    const qualifies = i < 2;

                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-gray-50/80 ${
                          s.isLive ? "bg-amber-50/60" : ""
                        }`}
                      >
                        {/* Position + Evolution */}
                        <td className="py-3 pl-4 pr-2 text-center font-bold text-gray-800">
                          <div className="flex items-center justify-center gap-1">
                            <span>{s.livePosition}</span>
                            {s.positionChange > 0 && (
                              <ArrowUp size={12} className="text-emerald-500 stroke-[2.5]" />
                            )}
                            {s.positionChange < 0 && (
                              <ArrowDown size={12} className="text-red-500 stroke-[2.5]" />
                            )}
                            {s.positionChange === 0 && (
                              <Minus size={10} className="text-gray-300" />
                            )}
                          </div>
                        </td>

                        {/* Équipe */}
                        <td className="py-3 px-3">
                          <Link
                            href={`/teams/${s.teamId}`}
                            className="flex items-center gap-2.5 font-semibold text-gray-900 hover:text-red-600 transition-colors"
                          >
                            <TeamLogo
                              name={s.team.name}
                              logo={s.team.university?.logo}
                              size={22}
                            />
                            <span>{s.team.name}</span>
                            {s.isLive && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wide">
                                Live
                              </span>
                            )}
                          </Link>
                        </td>

                        {/* Statistiques */}
                        <td className="py-3 px-2 text-center text-gray-600">{s.played}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.won}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.drawn}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.lost}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.goalsFor}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.goalsAgainst}</td>
                        <td className="py-3 px-2 text-center font-medium">
                          <span
                            className={
                              s.goalDifference > 0
                                ? "font-bold text-emerald-600"
                                : s.goalDifference < 0
                                ? "text-red-500"
                                : "text-gray-400"
                            }
                          >
                            {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                          </span>
                        </td>
                        <td className="py-3 pl-2 pr-4 text-center font-black text-sm text-gray-900">
                          {s.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-5 pt-2 text-[11px] font-medium text-gray-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Qualifié pour la phase suivante
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> En match actuellement (score en direct)
        </span>
      </div>
    </div>
  );
}