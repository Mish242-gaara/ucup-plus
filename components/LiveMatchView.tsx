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
  homeTeam: { name: string };
  awayTeam: { name: string };
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
        // ignore transient network errors, next poll will retry
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
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  const isLive = data.status === "live" || data.status === "halftime";

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="text-center">
          <p className="text-lg font-semibold">{data.homeTeam.name}</p>
        </div>
        <div className="flex flex-col items-center px-6">
          <p className="text-4xl font-bold tabular-nums">
            {data.homeScore} - {data.awayScore}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            {isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
            <span>
              {data.status === "finished"
                ? "Terminé"
                : data.status === "scheduled"
                  ? "À venir"
                  : `${data.formattedTime}${data.isPaused ? " (pause)" : ""}`}
            </span>
            {data.isExtraTime && <span className="text-gold">Prolongation</span>}
            {data.isPenaltyShootout && <span className="text-gold">Tirs au but</span>}
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{data.awayTeam.name}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fil du match</h2>
        {data.events.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun événement pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <span className="w-10 shrink-0 text-slate-500">
                  {e.minute}
                  {e.additionalTime ? `+${e.additionalTime}` : ""}&apos;
                </span>
                <span>{EVENT_ICONS[e.eventType] ?? "•"}</span>
                <span>
                  <span className="font-medium">{e.player}</span>
                  {e.assistPlayer && <span className="text-slate-500"> (passe : {e.assistPlayer})</span>}
                  {e.outPlayer && <span className="text-slate-500"> ↔ {e.outPlayer}</span>}
                  <span className="ml-2 text-slate-500">— {e.team}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
