"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import TeamLogo from "@/components/TeamLogo";
import { voteMatch } from "@/app/actions/vote";

type Props = {
  matchId: number;
  homeTeam: string;
  homeLogo: string | null;
  awayTeam: string;
  awayLogo: string | null;
  matchDate: string;
  location?: string | null;
  initialHomeVotes?: number;
  initialDrawVotes?: number;
  initialAwayVotes?: number;
};

export default function FeaturedMatchHero({
  matchId,
  homeTeam,
  homeLogo,
  awayTeam,
  awayLogo,
  matchDate,
  location,
  initialHomeVotes = 0,
  initialDrawVotes = 0,
  initialAwayVotes = 0,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState<string | null>(null);
  const [votes, setVotes] = useState({
    home: initialHomeVotes,
    draw: initialDrawVotes,
    away: initialAwayVotes,
  });

  const totalVotes = votes.home + votes.draw + votes.away;

  const getPercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  const handleVote = (choice: "home" | "draw" | "away") => {
    if (voted || isPending) return;

    // Mise à jour optimiste côté client
    setVoted(choice);
    setVotes((prev) => ({ ...prev, [choice]: prev[choice] + 1 }));

    // Persistance en base de données
    startTransition(async () => {
      await voteMatch(matchId, choice);
    });
  };

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

      {/* Module Pronostics Dynamic */}
      <div className="mt-4 rounded-xl bg-white/5 p-3 border border-white/5">
        <p className="text-xs font-bold text-center text-gray-300 mb-2">
          🗳️ Sondage : Qui va l'emporter ? {totalVotes > 0 && `(${totalVotes} vote${totalVotes > 1 ? "s" : ""})`}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleVote("home")}
            disabled={!!voted || isPending}
            className={`py-1.5 rounded text-xs font-bold transition ${
              voted === "home" ? "bg-red-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {homeTeam} ({getPercentage(votes.home)}%)
          </button>
          <button
            onClick={() => handleVote("draw")}
            disabled={!!voted || isPending}
            className={`py-1.5 rounded text-xs font-bold transition ${
              voted === "draw" ? "bg-gray-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Nul ({getPercentage(votes.draw)}%)
          </button>
          <button
            onClick={() => handleVote("away")}
            disabled={!!voted || isPending}
            className={`py-1.5 rounded text-xs font-bold transition ${
              voted === "away" ? "bg-red-600 text-white" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {awayTeam} ({getPercentage(votes.away)}%)
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 mt-4 pt-3 text-xs text-gray-400">
        <span>📍 {location || "Terrain non défini"}</span>
        <Link href="/matches" className="font-bold text-red-400 hover:text-red-300">
          Voir le calendrier →
        </Link>
      </div>
    </div>
  );
}