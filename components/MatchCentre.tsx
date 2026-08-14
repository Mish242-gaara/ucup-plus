"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Trophy, LayoutGrid, List } from "lucide-react";
import { useRealtime } from "@/lib/hooks/useRealtime";
import TeamLogo from "@/components/TeamLogo";

type LineupEntry = {
  playerId: number;
  playerName: string;
  jerseyNumber: number;
  position: string | null;
  orderKey: number | null;
  role: string;
};

type LiveData = {
  status: string;
  round: string | null;
  group: string | null;
  venue: string | null;
  referee: string | null;
  homeScore: number;
  awayScore: number;
  homeTeam: { name: string; logo: string | null; formation: string | null; compositionReady: boolean };
  awayTeam: { name: string; logo: string | null; formation: string | null; compositionReady: boolean };
  formattedTime: string;
  isPaused: boolean;
  isExtraTime: boolean;
  isPenaltyShootout: boolean;
  stats: Record<string, [number, number]>;
  events: {
    id: number;
    eventType: string;
    minute: number;
    additionalTime: string | null;
    teamId: number;
    team: string;
    player: string;
    assistPlayer: string | null;
    outPlayer: string | null;
  }[];
  commentary: { id: number; minute: number; text: string }[];
  lineups: {
    home: { starters: LineupEntry[]; substitutes: LineupEntry[] };
    away: { starters: LineupEntry[]; substitutes: LineupEntry[] };
  };
};

const EVENT_ICON: Record<string, string> = {
  goal: "⚽",
  penalty_goal: "⚽",
  own_goal: "⚽",
  yellow_card: "🟨",
  second_yellow: "🟨🟥",
  red_card: "🟥",
  substitution_in: "🔄",
  substitution_out: "🔄",
  injury: "🩹",
  penalty_missed: "❌",
  big_chance_missed: "❌",
};

const TABS = ["Scores", "Stats", "Résumé", "Face-à-face", "Compositions"] as const;

const TAB_PARAM: Record<string, (typeof TABS)[number]> = {
  scores: "Scores",
  stats: "Stats",
  resume: "Résumé",
  h2h: "Face-à-face",
  compositions: "Compositions",
};

const STAT_LABELS: { key: string; label: string; suffix?: string }[] = [
  { key: "possession", label: "Possession", suffix: "%" },
  { key: "shotsOnTarget", label: "Tirs cadrés" },
  { key: "shots", label: "Tirs totaux" },
  { key: "fouls", label: "Fautes" },
  { key: "corners", label: "Corners" },
  { key: "offsides", label: "Hors-jeu" },
  { key: "saves", label: "Arrêts" },
];

function StatBar({ label, home, away, suffix = "" }: { label: string; home: number; away: number; suffix?: string }) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm font-semibold text-white">
        <span>
          {home}
          {suffix}
        </span>
        <span className="text-gray-400">{label}</span>
        <span>
          {away}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="bg-brand-500" style={{ width: `${homePct}%` }} />
        <div className="bg-white/40" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

function LineupColumn({
  teamName,
  data,
}: {
  teamName: string;
  data: { starters: LineupEntry[]; substitutes: LineupEntry[] };
}) {
  const starters = [...data.starters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));

  return (
    <div>
      <h3 className="font-semibold text-white">{teamName}</h3>
      {starters.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Composition non publiée.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {starters.map((p) => (
            <li key={p.playerId} className="flex justify-between text-gray-200">
              <span>
                #{p.jerseyNumber} {p.playerName}
              </span>
              <span className="text-gray-500">{p.position}</span>
            </li>
          ))}
        </ul>
      )}
      {data.substitutes.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Remplaçants</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-400">
            {data.substitutes.map((p) => (
              <li key={p.playerId}>
                #{p.jerseyNumber} {p.playerName}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ==========================================================================
   Pitch Board Component (Terrain Tactique Visuel)
   ========================================================================== */
function PitchBoard({
  formation = "4-3-3",
  starters,
  isHomeTeam = true,
}: {
  formation: string | null;
  starters: LineupEntry[];
  isHomeTeam?: boolean;
}) {
  const parsedFormation = formation && formation.includes("-") ? formation.split("-").map(Number) : [4, 3, 3];
  const sortedStarters = [...starters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));

  // Découpage des joueurs par lignes tactiques
  const keeper = sortedStarters[0];
  const outfieldPlayers = sortedStarters.slice(1);

  const rows: LineupEntry[][] = [];
  let index = 0;
  parsedFormation.forEach((count) => {
    rows.push(outfieldPlayers.slice(index, index + count));
    index += count;
  });

  // Couleur du maillot selon l'équipe
  const badgeBg = isHomeTeam
    ? "bg-gradient-to-tr from-brand-600 to-brand-400 border-white text-white shadow-brand-500/50"
    : "bg-gradient-to-tr from-zinc-100 to-zinc-300 border-zinc-900 text-zinc-950 shadow-zinc-400/50";

  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-md overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/80 p-4 shadow-2xl backdrop-blur">
      {/* Texture du Terrain / Lignes de jeu */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
      
      {/* Surface de réparation Haut */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-16 w-36 -translate-x-1/2 rounded-b-lg border-2 border-t-0 border-emerald-400/30 bg-emerald-500/5" />
      {/* Arc de cercle Haut */}
      <div className="pointer-events-none absolute left-1/2 top-16 h-10 w-20 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-emerald-400/20" />
      
      {/* Ligne médiane */}
      <div className="pointer-events-none absolute left-0 top-1/2 w-full border-t-2 border-emerald-400/30" />
      {/* Rond central */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-400/30" />
      
      {/* Surface de réparation Bas */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-16 w-36 -translate-x-1/2 rounded-t-lg border-2 border-b-0 border-emerald-400/30 bg-emerald-500/5" />
      {/* Arc de cercle Bas */}
      <div className="pointer-events-none absolute bottom-16 left-1/2 h-10 w-20 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-emerald-400/20" />

      {/* Dispositions des Joueurs sur le Pitch */}
      <div className="relative z-10 flex h-full flex-col justify-between py-2">
        {/* Gardien */}
        <div className="flex justify-center">
          {keeper && (
            <div className="flex flex-col items-center group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-yellow-300 bg-amber-500 text-xs font-black text-black shadow-lg transition-transform group-hover:scale-110">
                {keeper.jerseyNumber}
              </div>
              <span className="mt-1 max-w-[80px] truncate rounded bg-black/75 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white backdrop-blur">
                {keeper.playerName}
              </span>
            </div>
          )}
        </div>

        {/* Lignes de champ (Défenseurs, Milieux, Attaquants) */}
        {rows.map((row, rIndex) => (
          <div key={rIndex} className="flex justify-around items-center px-2">
            {row.map((player) => (
              <div key={player.playerId} className="flex flex-col items-center group">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black shadow-md transition-transform group-hover:scale-110 ${badgeBg}`}
                >
                  {player.jerseyNumber}
                </div>
                <span className="mt-1 max-w-[80px] truncate rounded bg-black/75 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white backdrop-blur">
                  {player.playerName}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type H2HMatch = {
  id: number;
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
};

export default function MatchCentre({
  matchId,
  initialData,
  h2h,
  h2hSummary,
}: {
  matchId: number;
  initialData: LiveData;
  h2h: H2HMatch[];
  h2hSummary: { homeWins: number; awayWins: number; draws: number };
}) {
  const data = useRealtime<LiveData>(`/api/matches/${matchId}/live`, initialData, `match-${matchId}`);
  const searchParams = useSearchParams();
  const initialTab = TAB_PARAM[searchParams.get("tab") ?? ""] ?? "Scores";
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab);

  // État local pour gérer la vue du terrain tactile
  const [lineupViewMode, setLineupViewMode] = useState<"pitch" | "list">("pitch");
  const [selectedPitchTeam, setSelectedPitchTeam] = useState<"home" | "away">("home");

  const isLive = data.status === "live" || data.status === "halftime";
  const scorers = data.events.filter(
    (e) => e.eventType === "goal" || e.eventType === "penalty_goal" || e.eventType === "own_goal"
  );
  const homeScorers = scorers.filter((e) => e.team === data.homeTeam.name);
  const awayScorers = scorers.filter((e) => e.team === data.awayTeam.name);

  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-600 to-brand-700 px-6 py-4 text-center text-white">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Trophy size={18} />
          </span>
          <div>
            <p className="text-lg font-extrabold uppercase tracking-wide">
              {isLive ? "Direct Live" : data.status === "finished" ? "Match terminé" : "À venir"}
            </p>
            <p className="text-xs uppercase tracking-widest text-brand-100">
              {data.round ?? (data.group ? `Groupe ${data.group}` : "UCUP 2026")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-1 border-b border-white/10 bg-zinc-900 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "border-b-2 border-brand-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white"
                : "px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-300"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "Scores" && (
          <div>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-300">
              {isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-live" />}
              <span>
                {data.status === "finished"
                  ? "Terminé"
                  : data.status === "scheduled"
                    ? "À venir"
                    : `${data.formattedTime}${data.isPaused ? " (pause)" : ""}`}
              </span>
              {data.isExtraTime && <span className="text-brand-400">· Prolongation</span>}
              {data.isPenaltyShootout && <span className="text-brand-400">· Tirs au but</span>}
            </div>

            <div className="mt-4 grid grid-cols-3 items-center gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamLogo name={data.homeTeam.name} logo={data.homeTeam.logo} size={56} />
                <p className="text-sm font-semibold text-white">{data.homeTeam.name}</p>
              </div>
              <p className="text-center text-5xl font-extrabold text-white">
                {data.homeScore} - {data.awayScore}
              </p>
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamLogo name={data.awayTeam.name} logo={data.awayTeam.logo} size={56} />
                <p className="text-sm font-semibold text-white">{data.awayTeam.name}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-gray-400">
              <ul className="space-y-1">
                {homeScorers.map((e) => (
                  <li key={e.id}>
                    ⚽ {e.player} {e.minute}&apos;
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 text-right">
                {awayScorers.map((e) => (
                  <li key={e.id}>
                    ⚽ {e.player} {e.minute}&apos;
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "Stats" && (
          <div className="divide-y divide-white/5">
            {STAT_LABELS.map(({ key, label, suffix }) => (
              <StatBar
                key={key}
                label={label}
                home={data.stats[key]?.[0] ?? 0}
                away={data.stats[key]?.[1] ?? 0}
                suffix={suffix}
              />
            ))}
            <StatBar
              label="Cartons"
              home={(data.stats.yellowCards?.[0] ?? 0) + (data.stats.redCards?.[0] ?? 0) * 2}
              away={(data.stats.yellowCards?.[1] ?? 0) + (data.stats.redCards?.[1] ?? 0) * 2}
            />
          </div>
        )}

        {tab === "Résumé" && (
          <ul className="space-y-3">
            {data.events.length === 0 && data.commentary.length === 0 && (
              <p className="text-sm text-gray-500">Aucun événement pour le moment.</p>
            )}
            {[
              ...data.events.map((e) => ({ kind: "event" as const, minute: e.minute, sortKey: e.minute * 10, data: e })),
              ...data.commentary.map((c) => ({ kind: "comment" as const, minute: c.minute, sortKey: c.minute * 10 + 1, data: c })),
            ]
              .sort((a, b) => a.sortKey - b.sortKey)
              .map((item) =>
                item.kind === "event" ? (
                  <li key={`e-${item.data.id}`} className="flex items-center gap-3 text-sm">
                    <span className="w-10 shrink-0 text-gray-500">
                      {item.data.minute}
                      {item.data.additionalTime ? `+${item.data.additionalTime}` : ""}&apos;
                    </span>
                    <span>{EVENT_ICON[item.data.eventType] ?? "•"}</span>
                    <span className="text-gray-200">
                      <span className="font-medium text-white">{item.data.player}</span>
                      {item.data.assistPlayer && (
                        <span className="text-gray-500"> (passe : {item.data.assistPlayer})</span>
                      )}
                      {item.data.outPlayer && <span className="text-gray-500"> ↔ {item.data.outPlayer}</span>}
                      <span className="ml-2 text-gray-500">— {item.data.team}</span>
                    </span>
                  </li>
                ) : (
                  <li key={`c-${item.data.id}`} className="flex items-start gap-3 text-sm">
                    <span className="w-10 shrink-0 text-gray-500">{item.data.minute}&apos;</span>
                    <span className="text-gray-400">💬</span>
                    <span className="italic text-gray-300">{item.data.text}</span>
                  </li>
                )
              )}
          </ul>
        )}

        {tab === "Face-à-face" && (
          <div>
            <div className="flex items-center justify-around text-center text-sm">
              <div>
                <p className="text-2xl font-extrabold text-white">{h2hSummary.homeWins}</p>
                <p className="text-xs text-gray-500">{data.homeTeam.name}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-400">{h2hSummary.draws}</p>
                <p className="text-xs text-gray-500">Nuls</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">{h2hSummary.awayWins}</p>
                <p className="text-xs text-gray-500">{data.awayTeam.name}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {h2h.length === 0 ? (
                <p className="text-sm text-gray-500">Ces deux équipes ne se sont jamais affrontées.</p>
              ) : (
                h2h.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-400">
                      {new Date(m.matchDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-white">
                      {m.homeTeamName} <span className="font-bold">{m.homeScore} - {m.awayScore}</span> {m.awayTeamName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "Compositions" && (
          <div className="space-y-6">
            {/* Contrôles d'affichage (Pitch vs Liste & Choix de l'Équipe) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-900/80 p-3 border border-white/5">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPitchTeam("home")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    selectedPitchTeam === "home" ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {data.homeTeam.name}
                </button>
                <button
                  onClick={() => setSelectedPitchTeam("away")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    selectedPitchTeam === "away" ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {data.awayTeam.name}
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-black/40 p-1">
                <button
                  onClick={() => setLineupViewMode("pitch")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    lineupViewMode === "pitch" ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Terrain
                </button>
                <button
                  onClick={() => setLineupViewMode("list")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    lineupViewMode === "list" ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List size={14} />
                  Liste
                </button>
              </div>
            </div>

            {/* Mode Affichage Terrain Visuel */}
            {lineupViewMode === "pitch" ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-white">
                    {selectedPitchTeam === "home" ? data.homeTeam.name : data.awayTeam.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Formation : {selectedPitchTeam === "home" ? data.homeTeam.formation ?? "4-3-3" : data.awayTeam.formation ?? "4-3-3"}
                  </p>
                </div>

                <PitchBoard
                  formation={selectedPitchTeam === "home" ? data.homeTeam.formation : data.awayTeam.formation}
                  starters={selectedPitchTeam === "home" ? data.lineups.home.starters : data.lineups.away.starters}
                  isHomeTeam={selectedPitchTeam === "home"}
                />

                {/* Section Remplaçants sous le Terrain */}
                <div className="rounded-xl bg-zinc-900/60 p-4 border border-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Remplaçants</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    {(selectedPitchTeam === "home" ? data.lineups.home.substitutes : data.lineups.away.substitutes).map((p) => (
                      <div key={p.playerId} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-gray-300">
                          #{p.jerseyNumber}
                        </span>
                        <span className="truncate">{p.playerName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Mode Affichage Liste Téléphone Classique */
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  {data.homeTeam.formation && (
                    <p className="mb-2 text-xs text-gray-500">Formation : {data.homeTeam.formation}</p>
                  )}
                  <LineupColumn teamName={data.homeTeam.name} data={data.lineups.home} />
                </div>
                <div>
                  {data.awayTeam.formation && (
                    <p className="mb-2 text-xs text-gray-500">Formation : {data.awayTeam.formation}</p>
                  )}
                  <LineupColumn teamName={data.awayTeam.name} data={data.lineups.away} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}