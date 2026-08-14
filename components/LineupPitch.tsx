"use client";

import Image from "next/image";

export interface PitchPlayer {
  id: number;
  jerseyNumber: number;
  name: string;
  photo?: string | null;
  /** Position X de 0 (gauche) à 100 (droite) */
  x: number; 
  /** Position Y de 0 (haut) à 100 (bas) par rapport à sa demi-surface */
  y: number; 
}

interface LineupPitchProps {
  homeTeam: {
    name: string;
    players: PitchPlayer[];
  };
  awayTeam: {
    name: string;
    players: PitchPlayer[];
  };
}

export function LineupPitch({ homeTeam, awayTeam }: LineupPitchProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-[#0a192f] p-3 sm:p-4 rounded-xl shadow-2xl text-white font-sans">
      {/* Conteneur Terrain de Football */}
      <div className="relative w-full aspect-[2/3] bg-[#0c2333] border-2 border-slate-700/60 rounded-lg overflow-hidden select-none">
        
        {/* --- TRACÉS DU TERRAIN (SVG) --- */}
        <svg
          className="absolute inset-0 w-full h-full stroke-slate-600/40 fill-none pointer-events-none"
          strokeWidth="1.5"
        >
          {/* Ligne médiane */}
          <line x1="0" y1="50%" x2="100%" y2="50%" />
          {/* Cercle central */}
          <circle cx="50%" cy="50%" r="15%" />
          <circle cx="50%" cy="50%" r="2" className="fill-slate-600/60" />

          {/* Surface Équipe Haut */}
          <rect x="22%" y="0" width="56%" height="16%" />
          <rect x="36%" y="0" width="28%" height="6%" />
          <path d="M 38% 16% A 12% 12% 0 0 0 62% 16%" />

          {/* Surface Équipe Bas */}
          <rect x="22%" y="84%" width="56%" height="16%" />
          <rect x="36%" y="94%" width="28%" height="6%" />
          <path d="M 38% 84% A 12% 12% 0 0 1 62% 84%" />
        </svg>

        {/* --- ÉQUIPE DU HAUT --- */}
        <div className="absolute top-0 left-0 right-0 h-1/2">
          {homeTeam.players.map((player) => (
            <PlayerNode key={player.id} player={player} />
          ))}
        </div>

        {/* --- ÉQUIPE DU BAS --- */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2">
          {awayTeam.players.map((player) => (
            <PlayerNode
              key={player.id}
              player={{
                ...player,
                y: 100 - player.y, // Inverse l'axe Y pour mettre le GK en bas
              }}
            />
          ))}
        </div>

        {/* Branding discret */}
        <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-20 text-[10px] font-bold tracking-widest pointer-events-none uppercase">
          ESTAM MATCH
        </div>
      </div>
    </div>
  );
}

{/* Node Individuel d'un Joueur */}
function PlayerNode({ player }: { player: PitchPlayer }) {
  return (
    <div
      className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 cursor-pointer group"
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
      }}
    >
      {/* Avatar Joueur */}
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-400/30 bg-slate-800 shadow-md flex items-center justify-center">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
            {player.jerseyNumber}
          </div>
        )}
      </div>

      {/* Badge Numéro + Nom (Flashscore Style) */}
      <div className="mt-1 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold shadow-lg border border-white/10 max-w-[85px]">
        <span className="text-slate-300 font-mono">{player.jerseyNumber}</span>
        <span className="truncate text-white">{player.name}</span>
      </div>
    </div>
  );
}