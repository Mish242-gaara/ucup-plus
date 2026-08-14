"use client";

import { useEffect, useState } from "react";

type LiveEvent = {
  id: number;
  eventType: string;
  minute: number;
  additionalTime: string | null;
  team: string;
  player: string;
  assistPlayer: string | null;
  outPlayer: string | null;
};

type LiveData = {
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: { name: string; formation?: string | null };
  awayTeam: { name: string; formation?: string | null };
  formattedTime: string;
  isPaused: boolean;
  isExtraTime: boolean;
  isPenaltyShootout: boolean;
  events: LiveEvent[];
};

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  penalty_goal: "⚽ (pen.)",
  own_goal: "⚽ (csc)",
  yellow_card: "🟨",
  second_yellow: "🟨🟥",
  red_card: "🟥",
  substitution: "🔄",
  substitution_in: "🔄",
  substitution_out: "🔄",
  injury: "🩹",
  penalty_missed: "❌ (pen.)",
  big_chance_missed: "❌",
};

const POLL_INTERVAL_MS = 12_000;

export default function LiveMatchView({ matchId }: { matchId: number }) {
  const [data, setData] = useState<LiveData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/matches/${matchId}/live`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // Ignorer les erreurs réseau temporaires, le prochain intervalle réessayera
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [matchId]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm font-medium text-slate-400 animate-pulse">Chargement en direct…</p>
      </div>
    );
  }

  const isLive = data.status === "live" || data.status === "halftime";
  const events = data?.events ?? [];

  // Tri des événements du plus ancien au plus récent (ou vice versa)
  const sortedEvents = [...events].sort((a, b) => {
    const minA = a.minute + (a.additionalTime ? parseInt(a.additionalTime, 10) / 100 : 0);
    const minB = b.minute + (b.additionalTime ? parseInt(b.additionalTime, 10) / 100 : 0);
    return minA - minB;
  });

  return (
    <div className="space-y-6">
      {/* Tableau d'affichage du Score */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-white">{data.homeTeam?.name ?? "Équipe Domicile"}</p>
        </div>

        <div className="flex flex-col items-center px-6">
          <p className="text-4xl font-extrabold tabular-nums text-white">
            {data.homeScore ?? 0} - {data.awayScore ?? 0}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-400">
            {isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
            <span>
              {data.status === "finished"
                ? "Terminé"
                : data.status === "scheduled"
                  ? "À venir"
                  : `${data.formattedTime ?? "00:00"}${data.isPaused ? " (pause)" : ""}`}
            </span>
            {data.isExtraTime && <span className="text-amber-400">· Prolongation</span>}
            {data.isPenaltyShootout && <span className="text-amber-400">· Tirs au but</span>}
          </div>
        </div>

        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-white">{data.awayTeam?.name ?? "Équipe Extérieur"}</p>
        </div>
      </div>

      {/* Fil du match / Événements */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fil du match</h2>
        {sortedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun événement pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {sortedEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 text-sm rounded-lg bg-slate-900/50 p-2 border border-slate-800/40">
                <span className="w-10 shrink-0 font-mono text-xs font-bold text-slate-400">
                  {e.minute}
                  {e.additionalTime ? `+${e.additionalTime}` : ""}&apos;
                </span>
                <span className="text-base">{EVENT_ICONS[e.eventType] ?? "•"}</span>
                <span className="text-slate-200">
                  <span className="font-semibold text-white">{e.player}</span>
                  {e.assistPlayer && <span className="text-slate-400"> (passe : {e.assistPlayer})</span>}
                  {e.outPlayer && <span className="text-slate-400"> ↔ {e.outPlayer}</span>}
                  <span className="ml-2 text-xs font-medium text-slate-500">— {e.team}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}