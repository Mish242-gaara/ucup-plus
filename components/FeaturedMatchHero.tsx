"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TeamLogo from "@/components/TeamLogo";

type Props = {
  homeTeam: string;
  homeLogo: string | null;
  awayTeam: string;
  awayLogo: string | null;
  matchDate: string;
  location?: string;
};

export default function FeaturedMatchHero({
  homeTeam,
  homeLogo,
  awayTeam,
  awayLogo,
  matchDate,
  location = "Camp Militaire",
}: Props) {
  const [votes, setVotes] = useState({ home: 45, draw: 20, away: 35 });
  const [voted, setVoted] = useState<string | null>(null);

  const handleVote = (choice: "home" | "draw" | "away") => {
    if (voted) return;
    setVoted(choice);
    setVotes((prev) => ({ ...prev, [choice]: prev[choice] + 1 }));
  };

  const totalVotes = votes.home + votes.draw + votes.away;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950 p-6 text-white shadow-xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          Prochaine Affiche Majeure
        </span>
        <span className="text-xs text-gray-400 font-medium">{matchDate}</span>
      </div>

      <div className="my-6 flex items-center justify-around gap-4">
        {/* Équipe Domicile */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-2 border border-white/10">
            <TeamLogo name={homeTeam} logo={homeLogo} size={48} />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">{homeTeam}</span>
        </div>

        {/* VS / Heure */}
        <div className="flex flex-col items-center text-center">
          <span className="text-2xl font-black text-red-500 italic">VS</span>
          <span className="mt-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-200">
            Match à venir
          </span>
        </div>

        {/* Équipe Extérieur */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-2 border border-white/10">
            <TeamLogo name={awayTeam} logo={awayLogo} size={48} />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">{awayTeam}</span>
        </div>
      </div>

      {/* Module Pronostics */}
      <div className="mt-4 rounded-xl bg-white/5 p-3 border border-white/5">
        <p className="text-xs font-bold text-center text-gray-300 mb-2">
          🗳️ Sondage : Qui va l'emporter ?
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleVote("home")}
            disabled={!!voted}
            className={`py-1.5 rounded text-xs font-bold transition ${
              voted === "home" ? "bg-red-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {homeTeam} ({Math.round((votes.home / totalVotes) * 100)}%)
          </button>
          <button
            onClick={() => handleVote("draw")}
            disabled={!!voted}
            className={`py-1.5 rounded text-xs font-bold transition ${
              voted === "draw" ? "bg-gray-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Nul ({Math.round((votes.draw / totalVotes) * 100)}%)
          </button>
          <button
            onClick={() => handleVote("away")}
            disabled={!!voted}
            className={`py-1.5 rounded text-xs font-bold transition ${
              voted === "away" ? "bg-red-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {awayTeam} ({Math.round((votes.away / totalVotes) * 100)}%)
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 mt-4 pt-3 text-xs text-gray-400">
        <span>📍 {location}</span>
        <Link href="/matches" className="font-bold text-red-400 hover:text-red-300">
          Voir le calendrier →
        </Link>
      </div>
    </div>
  );
}