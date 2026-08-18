import React from "react";

export type MatchResult = "V" | "N" | "D";

export interface H2HAdvancedStats {
  homeForm: { recent: MatchResult[]; points: number };
  awayForm: { recent: MatchResult[]; points: number };
  probabilities: { homeWin: number; draw: number; awayWin: number };
  h2hSummary: { homeWins: number; draws: number; awayWins: number; totalMatches: number };
}

interface H2HAdvancedProps {
  stats: H2HAdvancedStats;
  homeTeamName: string;
  awayTeamName: string;
}

// Typage strict de la constante de styles
const BADGE_STYLES: Record<MatchResult, string> = {
  V: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  N: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  D: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

function FormBadge({ result }: { result: MatchResult }) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-md border font-mono text-xs font-black shadow-sm ${BADGE_STYLES[result]}`}
    >
      {result}
    </span>
  );
}

export default function H2HAdvanced({ stats, homeTeamName, awayTeamName }: H2HAdvancedProps) {
  const { homeForm, awayForm, probabilities, h2hSummary } = stats;

  return (
    <div className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-6 shadow-xl space-y-6">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
        Historique & Probabilités (H2H Avancé)
      </h2>

      {/* Probabilités */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300">
          <span>{homeTeamName} ({probabilities.homeWin}%)</span>
          <span className="text-gray-500">Nul ({probabilities.draw}%)</span>
          <span>{awayTeamName} ({probabilities.awayWin}%)</span>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800 p-0.5 border border-white/5">
          <div
            style={{ width: `${probabilities.homeWin}%` }}
            className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
          />
          <div
            style={{ width: `${probabilities.draw}%` }}
            className="h-full bg-zinc-500 transition-all duration-500"
          />
          <div
            style={{ width: `${probabilities.awayWin}%` }}
            className="h-full rounded-r-full bg-brand-500 transition-all duration-500"
          />
        </div>
      </div>

      <hr className="border-white/5" />

      {/* Badges de forme */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-zinc-950/50 p-3 flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400 truncate">{homeTeamName}</span>
          <div className="flex items-center gap-1.5">
            {homeForm.recent.length > 0 ? (
              homeForm.recent.map((res: MatchResult, idx: number) => (
                <FormBadge key={idx} result={res} />
              ))
            ) : (
              <span className="text-xs text-gray-600">Aucun match récent</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-zinc-950/50 p-3 flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400 truncate">{awayTeamName}</span>
          <div className="flex items-center gap-1.5">
            {awayForm.recent.length > 0 ? (
              awayForm.recent.map((res: MatchResult, idx: number) => (
                <FormBadge key={idx} result={res} />
              ))
            ) : (
              <span className="text-xs text-gray-600">Aucun match récent</span>
            )}
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="rounded-lg bg-zinc-800/40 p-3 text-center border border-white/5">
        <p className="text-[11px] font-medium text-gray-400">
          Sur les <span className="font-bold text-white">{h2hSummary.totalMatches}</span> dernières confrontations directes :
        </p>
        <div className="mt-1 flex justify-center items-center gap-4 text-xs font-bold text-gray-200">
          <span className="text-emerald-400">{h2hSummary.homeWins} V ({homeTeamName})</span>
          <span className="text-gray-400">{h2hSummary.draws} N</span>
          <span className="text-brand-400">{h2hSummary.awayWins} V ({awayTeamName})</span>
        </div>
      </div>
    </div>
  );
}