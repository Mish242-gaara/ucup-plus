"use client";

import { useState, useEffect } from "react";

interface Player {
  id: string;
  name: string;
  number?: number;
  teamName: string;
}

interface MotmVotingProps {
  matchId: string;
  players: Player[];
}

export default function MotmVoting({ matchId, players }: MotmVotingProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Générer ou récupérer l'empreinte du voteur dans le localStorage
  const getVoterHash = () => {
    let hash = localStorage.getItem("ucup_voter_id");
    if (!hash) {
      hash = "voter_" + Math.random().toString(36).substring(2) + Date.now();
      localStorage.setItem("ucup_voter_id", hash);
    }
    return hash;
  };

  useEffect(() => {
    const voterHash = getVoterHash();
    const votedMatches = JSON.parse(localStorage.getItem("ucup_motm_votes") || "[]");
    if (votedMatches.includes(matchId)) {
      setHasVoted(true);
    }
  }, [matchId]);

  const handleVote = async () => {
    if (!selectedPlayer || hasVoted || submitting) return;

    setSubmitting(true);
    setMessage(null);

    const voterHash = getVoterHash();

    try {
      const res = await fetch(`/api/matches/${matchId}/motm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayer, voterHash }),
      });

      const data = await res.json();

      if (res.ok) {
        setHasVoted(true);
        // Mémoriser localement que le match a été voté
        const votedMatches = JSON.parse(localStorage.getItem("ucup_motm_votes") || "[]");
        votedMatches.push(matchId);
        localStorage.setItem("ucup_motm_votes", JSON.stringify(votedMatches));

        setMessage("⭐ Vote pris en compte ! Merci pour votre participation.");
      } else {
        setMessage(data.error || "Une erreur est survenue.");
      }
    } catch {
      setMessage("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center backdrop-blur-md">
        <p className="text-xl">🌟</p>
        <h3 className="font-extrabold text-amber-400">Merci pour votre vote !</h3>
        <p className="text-xs text-zinc-300 mt-1">
          Le Joueur du Match sera annoncé officiellement à la fin des votes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-2">
          <span>⭐</span> Élection du Joueur du Match
        </h3>
        <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
          En direct
        </span>
      </div>

      <p className="text-xs text-zinc-400">
        Sélectionnez le joueur qui a le plus marqué cette rencontre :
      </p>

      {/* Liste des joueurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelectedPlayer(player.id)}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
              selectedPlayer === player.id
                ? "border-red-500 bg-red-500/20 text-white font-bold"
                : "border-white/5 bg-zinc-800/50 text-zinc-300 hover:border-white/20"
            }`}
          >
            <div>
              <p className="text-xs font-bold">{player.name}</p>
              <p className="text-[10px] text-zinc-400">{player.teamName}</p>
            </div>
            {player.number && (
              <span className="text-xs font-black text-zinc-500">#{player.number}</span>
            )}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-xs font-semibold text-amber-400 text-center">{message}</p>
      )}

      <button
        onClick={handleVote}
        disabled={!selectedPlayer || submitting}
        className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-extrabold text-white transition disabled:opacity-40"
      >
        {submitting ? "Validation..." : "Confirmer mon vote"}
      </button>
    </div>
  );
}