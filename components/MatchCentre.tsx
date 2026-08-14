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
  photoUrl?: string | null;
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
  const starters = [...(data?.starters ?? [])].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));
  const substitutes = data?.substitutes ?? [];

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
      {substitutes.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Remplaçants</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-400">
            {substitutes.map((p) => (
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
   Composant Carte Joueur (Avatar + Capsule Nom/Numéro Style Flashscore)
   ========================================================================== */
function PlayerNode({ player }: { player: LineupEntry }) {
  const nameParts = player.playerName.trim().split(" ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

  return (
    <div className="group flex flex-col items-center">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-slate-800 shadow-md transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.playerName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-300">
            {player.playerName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="-mt-1.5 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/85 px-2 py-0.5 shadow-lg backdrop-blur">
        <span className="text-[10px] font-extrabold text-amber-400">{player.jerseyNumber}</span>
        <span className="max-w-[65px] truncate text-[10px] font-semibold text-white sm:max-w-[85px]">
          {lastName}
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Terrain Tactique Visuel Complet (Les 2 Équipes en Vis-à-Vis)
   ========================================================================== */
function DualFacingPitch({
  homeTeam,
  awayTeam,
  homeStarters = [],
  awayStarters = [],
}: {
  homeTeam: { name: string; formation: string | null };
  awayTeam: { name: string; formation: string | null };
  homeStarters: LineupEntry[];
  awayStarters: LineupEntry[];
}) {
  const parseFormation = (f: string | null) =>
    f && f.includes("-") ? f.split("-").map(Number) : [4, 3, 3];

  const homeForm = parseFormation(homeTeam.formation);
  const awayForm = parseFormation(awayTeam.formation);

  const sortedHome = [...homeStarters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));
  const sortedAway = [...awayStarters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));

  // Équipe Domicile (Haut)
  const homeKeeper = sortedHome[0];
  const homeOutfield = sortedHome.slice(1);
  const homeRows: LineupEntry[][] = [];
  let hIdx = 0;
  homeForm.forEach((count) => {
    homeRows.push(homeOutfield.slice(hIdx, hIdx + count));
    hIdx += count;
  });

  // Équipe Extérieur (Bas)
  const awayKeeper = sortedAway[0];
  const awayOutfield = sortedAway.slice(1);
  const awayRows: LineupEntry[][] = [];
  let aIdx = 0;
  awayForm.forEach((count) => {
    awayRows.push(awayOutfield.slice(aIdx, aIdx + count));
    aIdx += count;
  });

  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0b181f] p-4 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />

      {/* Surface Haut */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-20 w-44 -translate-x-1/2 rounded-b-xl border border-t-0 border-slate-500/30 bg-slate-500/5" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-8 w-20 -translate-x-1/2 rounded-b-md border border-t-0 border-slate-500/30" />
      <div className="pointer-events-none absolute top-20 left-1/2 h-10 w-24 -translate-x-1/2 rounded-b-full border border-t-0 border-slate-500/20" />

      {/* Ligne Médiane & Rond Central */}
      <div className="pointer-events-none absolute top-1/2 left-0 w-full border-t border-slate-500/30" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-500/30" />

      {/* Surface Bas */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-44 -translate-x-1/2 rounded-t-xl border border-b-0 border-slate-500/30 bg-slate-500/5" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-8 w-20 -translate-x-1/2 rounded-t-md border border-b-0 border-slate-500/30" />
      <div className="pointer-events-none absolute bottom-20 left-1/2 h-10 w-24 -translate-x-1/2 rounded-t-full border border-b-0 border-slate-500/20" />

      {/* Joueurs sur le terrain */}
      <div className="relative z-10 flex min-h-[620px] flex-col justify-between py-2 sm:min-h-[700px]">
        {/* HAUT : Domicile */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex justify-center">
            {homeKeeper && <PlayerNode player={homeKeeper} />}
          </div>
          {homeRows.map((row, rIdx) => (
            <div key={`home-row-${rIdx}`} className="flex items-center justify-around px-2">
              {row.map((p) => (
                <PlayerNode key={p.playerId} player={p} />
              ))}
            </div>
          ))}
        </div>

        {/* BAS : Extérieur */}
        <div className="flex flex-col-reverse gap-5 sm:gap-6">
          <div className="flex justify-center">
            {awayKeeper && <PlayerNode player={awayKeeper} />}
          </div>
          {awayRows.map((row, rIdx) => (
            <div key={`away-row-${rIdx}`} className="flex items-center justify-around px-2">
              {row.map((p) => (
                <PlayerNode key={p.playerId} player={p} />
              ))}
            </div>
          ))}
        </div>
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
  h2h = [],
  h2hSummary = { homeWins: 0, awayWins: 0, draws: 0 },
}: {
  matchId: number;
  initialData: LiveData;
  h2h?: H2HMatch[];
  h2hSummary?: { homeWins: number; awayWins: number; draws: number };
}) {
  const data = useRealtime<LiveData>(`/api/matches/${matchId}/live`, initialData, `match-${matchId}`);
  const searchParams = useSearchParams();
  const initialTab = TAB_PARAM[searchParams.get("tab") ?? ""] ?? "Scores";
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab);

  // Vue : terrain (pitch) ou liste classique (list)
  const [lineupViewMode, setLineupViewMode] = useState<"pitch" | "list">("pitch");

  const isLive = data.status === "live" || data.status === "halftime";
  const events = data?.events ?? [];
  const scorers = events.filter(
    (e) => e.eventType === "goal" || e.eventType === "penalty_goal" || e.eventType === "own_goal"
  );
  const homeScorers = scorers.filter((e) => e.team === data.homeTeam.name);
  const awayScorers = scorers.filter((e) => e.team === data.awayTeam.name);

  const homeStarters = data.lineups?.home?.starters ?? [];
  const awayStarters = data.lineups?.away?.starters ?? [];
  const homeSubstitutes = data.lineups?.home?.substitutes ?? [];
  const awaySubstitutes = data.lineups?.away?.substitutes ?? [];

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
      <div className="flex justify-center gap-1 overflow-x-auto border-b border-white/10 bg-zinc-900 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "border-b-2 border-brand-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white whitespace-nowrap"
                : "px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-300 whitespace-nowrap"
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
                home={data.stats?.[key]?.[0] ?? 0}
                away={data.stats?.[key]?.[1] ?? 0}
                suffix={suffix}
              />
            ))}
            <StatBar
              label="Cartons"
              home={(data.stats?.yellowCards?.[0] ?? 0) + (data.stats?.redCards?.[0] ?? 0) * 2}
              away={(data.stats?.yellowCards?.[1] ?? 0) + (data.stats?.redCards?.[1] ?? 0) * 2}
            />
          </div>
        )}

        {tab === "Résumé" && (
          <ul className="space-y-3">
            {events.length === 0 && (data.commentary ?? []).length === 0 && (
              <p className="text-sm text-gray-500">Aucun événement pour le moment.</p>
            )}
            {[
              ...events.map((e) => ({ kind: "event" as const, minute: e.minute, sortKey: e.minute * 10, data: e })),
              ...(data.commentary ?? []).map((c) => ({
                kind: "comment" as const,
                minute: c.minute,
                sortKey: c.minute * 10 + 1,
                data: c,
              })),
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
                      {new Date(m.matchDate).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
            {/* Basculeur de mode : Terrain vs Liste */}
            <div className="flex items-center justify-end">
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

            {/* Mode Affichage Terrain Visuel Flashscore */}
            {lineupViewMode === "pitch" ? (
              homeStarters.length === 0 && awayStarters.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">Les compositions n'ont pas encore été publiées.</p>
              ) : (
                <div className="space-y-6">
                  {/* Indication des formations */}
                  <div className="flex items-center justify-between px-2 text-xs font-semibold text-gray-400">
                    <span>
                      {data.homeTeam.name} ({data.homeTeam.formation ?? "4-3-3"})
                    </span>
                    <span>
                      {data.awayTeam.name} ({data.awayTeam.formation ?? "4-3-3"})
                    </span>
                  </div>

                  {/* Terrain complet des 22 joueurs */}
                  <DualFacingPitch
                    homeTeam={data.homeTeam}
                    awayTeam={data.awayTeam}
                    homeStarters={homeStarters}
                    awayStarters={awayStarters}
                  />

                  {/* Remplaçants sous le terrain */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Remplaçants — {data.homeTeam.name}
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                        {homeSubstitutes.length === 0 ? (
                          <p className="text-xs text-gray-500">Aucun remplaçant renseigné.</p>
                        ) : (
                          homeSubstitutes.map((p) => (
                            <div key={p.playerId} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-gray-300">
                                #{p.jerseyNumber}
                              </span>
                              <span className="truncate">{p.playerName}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Remplaçants — {data.awayTeam.name}
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                        {awaySubstitutes.length === 0 ? (
                          <p className="text-xs text-gray-500">Aucun remplaçant renseigné.</p>
                        ) : (
                          awaySubstitutes.map((p) => (
                            <div key={p.playerId} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-gray-300">
                                #{p.jerseyNumber}
                              </span>
                              <span className="truncate">{p.playerName}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Mode Affichage Liste Classique */
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  {data.homeTeam.formation && (
                    <p className="mb-2 text-xs text-gray-500">Formation : {data.homeTeam.formation}</p>
                  )}
                  <LineupColumn teamName={data.homeTeam.name} data={data.lineups?.home} />
                </div>
                <div>
                  {data.awayTeam.formation && (
                    <p className="mb-2 text-xs text-gray-500">Formation : {data.awayTeam.formation}</p>
                  )}
                  <LineupColumn teamName={data.awayTeam.name} data={data.lineups?.away} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}