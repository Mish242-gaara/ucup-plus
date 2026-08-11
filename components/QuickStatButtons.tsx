"use client";

import { useState, useTransition } from "react";
import { bumpMatchStat, setPossession } from "@/lib/actions/matchStats";
import { STAT_FIELDS, type StatField } from "@/lib/statFields";

const BUTTONS: { field: StatField; label: string }[] = [
  { field: "shots", label: "Tir" },
  { field: "shotsOnTarget", label: "Tir cadré" },
  { field: "corners", label: "Corner" },
  { field: "fouls", label: "Faute" },
  { field: "offsides", label: "Hors-jeu" },
  { field: "saves", label: "Arrêt" },
  { field: "freeKicks", label: "Coup franc" },
  { field: "throwIns", label: "Touche" },
  { field: "goalkicks", label: "6 mètres" },
  { field: "penalties", label: "Pénalty" },
];

type Stats = Record<StatField, [number, number]>;

export default function QuickStatButtons({
  matchId,
  homeTeamName,
  awayTeamName,
  initialStats,
  initialPossession,
}: {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  initialStats: Stats;
  initialPossession: number;
}) {
  const [stats, setStats] = useState(initialStats);
  const [possession, setPossessionState] = useState(initialPossession);
  const [, startTransition] = useTransition();

  function bump(side: "home" | "away", field: StatField, delta: 1 | -1) {
    setStats((prev) => {
      const next = { ...prev };
      const pair = [...next[field]] as [number, number];
      const idx = side === "home" ? 0 : 1;
      pair[idx] = Math.max(0, pair[idx] + delta);
      next[field] = pair;
      return next;
    });
    startTransition(() => {
      bumpMatchStat(matchId, side, field, delta);
    });
  }

  function handlePossession(value: number) {
    setPossessionState(value);
    startTransition(() => {
      setPossession(matchId, value);
    });
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>{homeTeamName}</span>
          <span>Possession</span>
          <span>{awayTeamName}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="w-8 text-sm font-bold text-white">{possession}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={possession}
            onChange={(e) => handlePossession(Number(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <span className="w-8 text-right text-sm font-bold text-white">{100 - possession}%</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="text-xs text-gray-400">
          <tr>
            <th className="pb-2 text-left">{homeTeamName}</th>
            <th className="pb-2 text-center">Statistique</th>
            <th className="pb-2 text-right">{awayTeamName}</th>
          </tr>
        </thead>
        <tbody>
          {BUTTONS.map(({ field, label }) => (
            <tr key={field} className="border-t border-white/10">
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bump("home", field, -1)}
                    className="h-6 w-6 rounded-full bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-semibold text-white">{stats[field][0]}</span>
                  <button
                    onClick={() => bump("home", field, 1)}
                    className="h-6 w-6 rounded-full bg-brand-500 text-white hover:bg-brand-600"
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="py-2 text-center text-xs text-gray-500">{label}</td>
              <td className="py-2">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => bump("away", field, 1)}
                    className="h-6 w-6 rounded-full bg-brand-500 text-white hover:bg-brand-600"
                  >
                    +
                  </button>
                  <span className="w-5 text-center font-semibold text-white">{stats[field][1]}</span>
                  <button
                    onClick={() => bump("away", field, -1)}
                    className="h-6 w-6 rounded-full bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  >
                    −
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
