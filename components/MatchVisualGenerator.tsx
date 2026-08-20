"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

interface VisualGeneratorProps {
  match: {
    homeTeamName: string;
    homeTeamLogo: string;
    homeScore: number;
    awayTeamName: string;
    awayTeamLogo: string;
    awayScore: number;
    stage: string; // ex: "Demi-Finale"
    date: string;
    manOfMatchName?: string;
  };
}

export default function MatchVisualGenerator({ match }: VisualGeneratorProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!visualRef.current) return;
    setDownloading(true);

    try {
      const dataUrl = await toPng(visualRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Pour une résolution ultra nette
      });

      const link = document.createElement("a");
      link.download = `MATCHDAY_${match.homeTeamName}_vs_${match.awayTeamName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur génération image:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
      >
        {downloading ? "Génération en cours..." : "📸 Télécharger la Story Instagram (1080x1920)"}
      </button>

      {/* Zone masquée/aperçu du visuel Story */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2 max-w-xs">
        <p className="text-xs text-zinc-400 mb-2 font-medium">Aperçu du visuel :</p>
        
        {/* Conteneur 1080x1920 appliqué au format story */}
        <div
          ref={visualRef}
          style={{ width: "360px", height: "640px" }} // Ratio exact 9:16
          className="relative flex flex-col justify-between bg-zinc-950 p-6 text-white select-none"
        >
          {/* Arrière-plan décoratif */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/30 via-zinc-950 to-zinc-950 pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* En-tête : Logo UCUP & Phase */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-red-500 uppercase">
                U-CUP 2026
              </span>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              {match.stage}
            </span>
          </div>

          {/* Centre : Score & Équipes */}
          <div className="relative z-10 my-auto space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Résultat Final
            </p>

            <div className="flex items-center justify-around">
              {/* Équipe Domicile */}
              <div className="flex flex-col items-center gap-2 w-1/3">
                <img
                  src={match.homeTeamLogo || "/icons/icon-192x192.png"}
                  alt={match.homeTeamName}
                  className="h-16 w-16 object-contain drop-shadow-xl"
                />
                <span className="text-xs font-black uppercase tracking-wide text-zinc-200 line-clamp-2">
                  {match.homeTeamName}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 text-3xl font-black text-white bg-zinc-900/80 px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                <span>{match.homeScore}</span>
                <span className="text-red-500 text-lg">-</span>
                <span>{match.awayScore}</span>
              </div>

              {/* Équipe Extérieur */}
              <div className="flex flex-col items-center gap-2 w-1/3">
                <img
                  src={match.awayTeamLogo || "/icons/icon-192x192.png"}
                  alt={match.awayTeamName}
                  className="h-16 w-16 object-contain drop-shadow-xl"
                />
                <span className="text-xs font-black uppercase tracking-wide text-zinc-200 line-clamp-2">
                  {match.awayTeamName}
                </span>
              </div>
            </div>

            {/* Man of the Match (si disponible) */}
            {match.manOfMatchName && (
              <div className="mt-8 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/20 to-yellow-500/10 p-4 border border-amber-500/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  ⭐ Player of the Match
                </p>
                <p className="text-sm font-extrabold text-white mt-1">
                  {match.manOfMatchName}
                </p>
              </div>
            )}
          </div>

          {/* Pied de page : Branding */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-[10px] text-zinc-500 font-medium">
              {match.date}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">
              ucup2026.app
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}