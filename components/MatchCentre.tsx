"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Trophy,
  LayoutGrid,
  List,
  MapPin,
  UserCheck,
  Flame,
  Scale,
  Clock,
  Flag,
  Shirt,
  Target,
  BarChart3,
  History,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useRealtime } from "@/lib/hooks/useRealtime";
import TeamLogo from "@/components/TeamLogo";

// --- Types (inchangés) ---
export type MatchResult = "V" | "N" | "D";
export type LineupEntry = {
  playerId: number;
  playerName: string;
  jerseyNumber: number;
  position: string | null;
  orderKey: number | null;
  role: string;
  photoUrl?: string | null;
};
export type LiveData = {
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
export type H2HMatch = {
  id: number;
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
};
export interface H2HAdvancedData {
  homeForm: { recent: MatchResult[]; points: number };
  awayForm: { recent: MatchResult[]; points: number };
  probabilities: { homeWin: number; draw: number; awayWin: number };
  h2hSummary: { homeWins: number; draws: number; awayWins: number; totalMatches: number };
}
export interface MatchCentreProps {
  matchId: number;
  initialData: LiveData;
  h2h?: H2HMatch[];
  h2hSummary?: { homeWins: number; awayWins: number; draws: number };
  h2hAdvanced?: H2HAdvancedData;
}

// --- Constants ---
const TABS = ["Live", "Stats", "Résumé", "H2H", "Compositions"] as const;
const TAB_PARAM: Record<string, (typeof TABS)[number]> = {
  live: "Live",
  stats: "Stats",
  resume: "Résumé",
  h2h: "H2H",
  compositions: "Compositions",
};
const REVERSE_TAB_PARAM: Record<(typeof TABS)[number], string> = {
  Live: "live",
  Stats: "stats",
  Résumé: "resume",
  H2H: "h2h",
  Compositions: "compositions",
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

const STAT_LABELS = [
  { key: "possession", label: "Possession", suffix: "%", icon: Target },
  { key: "shotsOnTarget", label: "Tirs cadrés", icon: Target },
  { key: "shots", label: "Tirs totaux", icon: Flame },
  { key: "corners", label: "Corners", icon: Flag },
  { key: "fouls", label: "Fautes", icon: Users },
  { key: "offsides", label: "Hors-jeu", icon: Minus },
  { key: "saves", label: "Arrêts", icon: Shirt },
];

// --- Sub-Components ---
function LiveMatchTimer({ status, formattedTime, isPaused }: {
  status: string;
  formattedTime: string;
  isPaused: boolean;
}) {
  const [time, setTime] = useState(formattedTime);

  useEffect(() => {
    setTime(formattedTime);
  }, [formattedTime]);

  useEffect(() => {
    if (status !== "live" || isPaused) return;
    const interval = setInterval(() => {
      setTime((prevTime) => {
        if (!prevTime?.includes(":")) return prevTime;
        const [mins, secs] = prevTime.split(":").map(Number);
        if (isNaN(mins) || isNaN(secs)) return prevTime;
        let newSecs = secs + 1;
        let newMins = mins;
        if (newSecs >= 60) {
          newSecs = 0;
          newMins += 1;
        }
        return `${String(newMins).padStart(2, "0")}:${String(newSecs).padStart(2, "0")}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, isPaused]);

  if (status === "finished") return <span className="text-gray-400">Terminé</span>;
  if (status === "scheduled") return <span className="text-gray-400">À venir</span>;
  return (
    <span className={status === "live" ? "text-red-400 font-mono" : ""}>
      {time}
      {isPaused && " (Pause)"}
    </span>
  );
}

function StatBar({ label, home, away, suffix = "", icon: Icon }: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
  icon: React.ElementType;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  const IconComponent = Icon;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 font-medium text-white">
          <IconComponent size={14} className="text-red-400" />
          {home}{suffix}
        </span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="flex items-center gap-1 font-medium text-white">
          {away}{suffix}
        </span>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="bg-red-500 transition-all duration-500 ease-out"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="bg-zinc-600 transition-all duration-500 ease-out"
          style={{ width: `${100 - homePct}%` }}
        />
      </div>
    </div>
  );
}

function FormBadge({ result }: { result: MatchResult }) {
  const config = {
    V: { color: "bg-emerald-500", label: "V" },
    N: { color: "bg-zinc-500", label: "N" },
    D: { color: "bg-rose-500", label: "D" },
  };
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
        config[result].color
      }`}
    >
      {config[result].label}
    </span>
  );
}

function EventItem({ event }: { event: LiveData["events"][0] }) {
  const icon = EVENT_ICON[event.eventType] || "•";
  const isHome = event.team === "home"; // À adapter selon ta logique
  return (
    <li
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
        isHome ? "bg-zinc-800/50" : "bg-zinc-900/50"
      }`}
    >
      <span className="w-8 text-center text-gray-400 text-sm">
        {event.minute}'
        {event.additionalTime && `+${event.additionalTime}`}
      </span>
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-white">{event.player}</span>
          {event.assistPlayer && (
            <span className="text-xs text-gray-400">(assist: {event.assistPlayer})</span>
          )}
          {event.outPlayer && <span className="text-xs text-gray-400">↔ {event.outPlayer}</span>}
        </div>
        <span className="text-xs text-gray-500">{event.team}</span>
      </div>
    </li>
  );
}

function CommentaryItem({ commentary }: { commentary: LiveData["commentary"][0] }) {
  return (
    <li className="flex items-start gap-3 p-2 text-sm">
      <span className="w-8 shrink-0 text-center text-gray-400 text-sm">{commentary.minute}'</span>
      <span className="text-gray-400 mt-1">💬</span>
      <span className="italic text-gray-300">{commentary.text}</span>
    </li>
  );
}

function PossessionChart({ home, away }: { home: number; away: number }) {
  const data = [
    { name: "Home", value: home },
    { name: "Away", value: away },
  ];
  const COLORS = ["#ef4444", "#374151"];
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={50}
            fill="#8884d8"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2 text-sm">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          {home}%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-zinc-600" />
          {away}%
        </span>
      </div>
    </div>
  );
}

function TeamForm({ form }: { form: { recent: MatchResult[]; points: number } }) {
  return (
    <div className="flex items-center gap-2">
      {form.recent.map((result, index) => (
        <FormBadge key={index} result={result} />
      ))}
      <span className="text-xs text-gray-400 ml-2">({form.points} pts)</span>
    </div>
  );
}

function LineupColumn({ teamName, data }: { teamName: string; data?: { starters: LineupEntry[]; substitutes: LineupEntry[] } }) {
  const starters = [...(data?.starters ?? [])].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));
  const substitutes = data?.substitutes ?? [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">{teamName}</h3>
      {starters.length === 0 ? (
        <p className="text-sm text-gray-500">Composition non publiée.</p>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Titulaires</p>
          <ul className="space-y-2">
            {starters.map((player) => (
              <li key={player.playerId} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.playerName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs font-bold">{player.jerseyNumber}</span>
                    </div>
                  )}
                  <span className="font-medium text-white">{player.playerName}</span>
                </div>
                <span className="text-xs text-gray-400">{player.position}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {substitutes.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-4 mb-2">Remplaçants</p>
          <ul className="space-y-2">
            {substitutes.map((player) => (
              <li key={player.playerId} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/30">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.playerName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-xs font-bold">{player.jerseyNumber}</span>
                  </div>
                )}
                <span className="text-gray-300">{player.playerName}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Minimal DualFacingPitch component to avoid missing symbol errors.
function DualFacingPitch({
  homeTeam,
  awayTeam,
  homeStarters,
  awayStarters,
}: {
  homeTeam: { name: string; logo: string | null; formation: string | null };
  awayTeam: { name: string; logo: string | null; formation: string | null };
  homeStarters: LineupEntry[];
  awayStarters: LineupEntry[];
}) {
  // Simple visual placeholder: lists players under team names.
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl bg-zinc-900/40 p-3">
        <h4 className="text-sm font-semibold text-white mb-2">{homeTeam.name} ({homeTeam.formation ?? "4-3-3"})</h4>
        <ul className="text-sm space-y-1">
          {homeStarters.map((p) => (
            <li key={p.playerId} className="text-gray-200">{p.jerseyNumber} - {p.playerName} {p.position ? `(${p.position})` : ''}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-zinc-900/40 p-3">
        <h4 className="text-sm font-semibold text-white mb-2">{awayTeam.name} ({awayTeam.formation ?? "4-3-3"})</h4>
        <ul className="text-sm space-y-1">
          {awayStarters.map((p) => (
            <li key={p.playerId} className="text-gray-200">{p.jerseyNumber} - {p.playerName} {p.position ? `(${p.position})` : ''}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function MatchCentre({
  matchId,
  initialData,
  h2h = [],
  h2hSummary = { homeWins: 0, awayWins: 0, draws: 0 },
  h2hAdvanced,
}: MatchCentreProps) {
  const data = useRealtime<LiveData>(`/api/matches/${matchId}/live`, initialData, `match-${matchId}`);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Live");
  const [lineupViewMode, setLineupViewMode] = useState<"pitch" | "list">("pitch");
  const [lastGoal, setLastGoal] = useState<{ player: string; minute: number; team: string } | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && TAB_PARAM[tabParam]) {
      setTab(TAB_PARAM[tabParam]);
    }
  }, [searchParams]);

  const handleTabChange = (selectedTab: (typeof TABS)[number]) => {
    setTab(selectedTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", REVERSE_TAB_PARAM[selectedTab]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Detect new goals for animation
  useEffect(() => {
    const events = data?.events ?? [];
    const goalEvents = events.filter((e) => ["goal", "penalty_goal", "own_goal"].includes(e.eventType));
    if (goalEvents.length > 0) {
      const latestGoal = goalEvents[goalEvents.length - 1];
      setLastGoal({
        player: latestGoal.player,
        minute: latestGoal.minute,
        team: latestGoal.team,
      });
      const timer = setTimeout(() => setLastGoal(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [data?.events]);

  // Memoized data
  const isLive = useMemo(() => data.status === "live" || data.status === "halftime", [data.status]);
  const events = useMemo(() => data?.events ?? [], [data?.events]);
  const scorers = useMemo(
    () => events.filter((e) => ["goal", "penalty_goal", "own_goal"].includes(e.eventType)),
    [events]
  );
  const homeScorers = useMemo(() => scorers.filter((e) => e.team === data.homeTeam.name), [scorers, data.homeTeam.name]);
  const awayScorers = useMemo(() => scorers.filter((e) => e.team === data.awayTeam.name), [scorers, data.awayTeam.name]);
  const homeStarters = useMemo(() => data.lineups?.home?.starters ?? [], [data.lineups]);
  const awayStarters = useMemo(() => data.lineups?.away?.starters ?? [], [data.lineups]);
  const homeSubstitutes = useMemo(() => data.lineups?.home?.substitutes ?? [], [data.lineups]);
  const awaySubstitutes = useMemo(() => data.lineups?.away?.substitutes ?? [], [data.lineups]);
  const totalH2H = useMemo(
    () => h2hSummary.homeWins + h2hSummary.draws + h2hSummary.awayWins,
    [h2hSummary]
  );

  // Combined events and commentary
  const timelineItems = useMemo(() => {
    const eventItems = events.map((e) => ({
      kind: "event" as const,
      minute: e.minute,
      sortKey: e.minute * 100 + (e.additionalTime ? parseInt(e.additionalTime, 10) : 0),
      data: e,
    }));
    const commentaryItems = (data.commentary ?? []).map((c) => ({
      kind: "commentary" as const,
      minute: c.minute,
      sortKey: c.minute * 100 + 1,
      data: c,
    }));
    return [...eventItems, ...commentaryItems].sort((a, b) => a.sortKey - b.sortKey);
  }, [events, data.commentary]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 px-6 py-4 relative">
        {lastGoal && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-600/20 animate-pulse">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              ⚽ BUT ! {lastGoal.player} ({lastGoal.team}) {lastGoal.minute}'
            </div>
          </div>
        )}
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <TeamLogo name={data.homeTeam.name} logo={data.homeTeam.logo} size={64} />
            <span className="mt-2 text-lg font-bold text-white truncate max-w-[120px]">
              {data.homeTeam.name}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-extrabold text-white">{data.homeScore}</span>
              <span className="text-3xl text-white">-</span>
              <span className="text-5xl font-extrabold text-white">{data.awayScore}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
              {isLive && <Clock size={14} className="text-white animate-pulse" />}
              <LiveMatchTimer status={data.status} formattedTime={data.formattedTime} isPaused={data.isPaused} />
              {data.isExtraTime && <span className="text-white/80">· Prolongation</span>}
              {data.isPenaltyShootout && <span className="text-white/80">· Tirs au but</span>}
            </div>
            <div className="mt-1">
              {data.status === "live" && (
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
                  EN DIRECT
                </span>
              )}
              {data.status === "finished" && (
                <span className="bg-zinc-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  TERMINÉ
                </span>
              )}
              {data.status === "scheduled" && (
                <span className="bg-zinc-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {new Date().toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <TeamLogo name={data.awayTeam.name} logo={data.awayTeam.logo} size={64} />
            <span className="mt-2 text-lg font-bold text-white truncate max-w-[120px]">
              {data.awayTeam.name}
            </span>
          </div>
        </div>
        {(data.venue || data.referee) && (
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/80">
            {data.venue && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {data.venue}
              </span>
            )}
            {data.referee && (
              <span className="flex items-center gap-1">
                <UserCheck size={12} /> {data.referee}
              </span>
            )}
          </div>
        )}
        {data.round && (
          <div className="mt-2 text-center text-xs text-white/60">
            {data.round} {data.group && `· Groupe ${data.group}`}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-1 border-b border-white/10 bg-zinc-900 px-4">
        {TABS.map((t) => {
          const Icon = {
            Live: Clock,
            Stats: BarChart3,
            Résumé: History,
            H2H: Scale,
            Compositions: Users,
          }[t];
          return (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                tab === t
                  ? "text-red-400 border-b-2 border-red-400"
                  : "text-gray-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Icon size={16} />
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Live Tab */}
        {tab === "Live" && (
          <div className="space-y-4">
            {/* Score and Scorers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/80">Buteurs</h3>
                {homeScorers.length > 0 ? (
                  <ul className="space-y-1">
                    {homeScorers.map((e) => (
                      <li key={e.id} className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">⚽</span>
                        <span className="text-white">{e.player}</span>
                        <span className="text-gray-400 ml-auto">{e.minute}'</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Aucun but</p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/80">Buteurs</h3>
                {awayScorers.length > 0 ? (
                  <ul className="space-y-1">
                    {awayScorers.map((e) => (
                      <li key={e.id} className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-gray-400">{e.minute}'</span>
                        <span className="text-white">{e.player}</span>
                        <span className="text-red-400">⚽</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Aucun but</p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-white/80 mb-2">Événements</h3>
              {timelineItems.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun événement</p>
              ) : (
                <ul className="space-y-2">
                  {timelineItems.map((item) =>
                    item.kind === "event" ? (
                      <EventItem key={`e-${item.data.id}`} event={item.data} />
                    ) : (
                      <CommentaryItem key={`c-${item.data.id}`} commentary={item.data} />
                    )
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === "Stats" && (
          <div className="space-y-4">
            {/* Possession Chart */}
            <div className="rounded-xl bg-zinc-900/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <Target size={16} className="text-red-400" />
                Possession
              </h3>
              <PossessionChart
                home={data.stats?.possession?.[0] ?? 50}
                away={data.stats?.possession?.[1] ?? 50}
              />
            </div>

            {/* Other Stats */}
            <div className="space-y-2">
              {STAT_LABELS.map(({ key, label, icon }) => {
                const Icon = icon;
                return (
                  <StatBar
                    key={key}
                    label={label}
                    home={data.stats?.[key]?.[0] ?? 0}
                    away={data.stats?.[key]?.[1] ?? 0}
                    icon={Icon}
                  />
                );
              })}
              {/* Cards Stat */}
              <StatBar
                label="Cartons"
                home={(data.stats?.yellowCards?.[0] ?? 0) + (data.stats?.redCards?.[0] ?? 0) * 2}
                away={(data.stats?.yellowCards?.[1] ?? 0) + (data.stats?.redCards?.[1] ?? 0) * 2}
                icon={Users}
              />
            </div>
          </div>
        )}

        {/* Résumé Tab */}
        {tab === "Résumé" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-white/80 mb-3">Statistiques {data.homeTeam.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tirs</span>
                    <span className="text-white">{data.stats?.shots?.[0] ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tirs cadrés</span>
                    <span className="text-white">{data.stats?.shotsOnTarget?.[0] ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Possession</span>
                    <span className="text-white">{data.stats?.possession?.[0] ?? 50}%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-white/80 mb-3">Statistiques {data.awayTeam.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tirs</span>
                    <span className="text-white">{data.stats?.shots?.[1] ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tirs cadrés</span>
                    <span className="text-white">{data.stats?.shotsOnTarget?.[1] ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Possession</span>
                    <span className="text-white">{data.stats?.possession?.[1] ?? 50}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* H2H Tab */}
        {tab === "H2H" && (
          <div className="space-y-6">
            {/* Recent Form */}
            {h2hAdvanced && (
              <div className="rounded-xl bg-zinc-900/50 p-4 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Flame size={16} className="text-amber-400" />
                  Forme récente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{data.homeTeam.name}</span>
                    <TeamForm form={h2hAdvanced.homeForm} />
                  </div>
                  <div className="flex items-center justify-between">
                    <TeamForm form={h2hAdvanced.awayForm} />
                    <span className="text-sm font-medium text-white">{data.awayTeam.name}</span>
                  </div>
                </div>

                {/* Win Probability */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                    <Scale size={16} className="text-blue-400" />
                    Probabilité de victoire
                  </h3>
                  <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800 mb-2">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${h2hAdvanced.probabilities.homeWin}%` }}
                    />
                    <div
                      className="bg-zinc-500 transition-all duration-500"
                      style={{ width: `${h2hAdvanced.probabilities.draw}%` }}
                    />
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{ width: `${h2hAdvanced.probabilities.awayWin}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-400">
                    <span>{h2hAdvanced.probabilities.homeWin}%</span>
                    <span>Nul {h2hAdvanced.probabilities.draw}%</span>
                    <span>{h2hAdvanced.probabilities.awayWin}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* H2H Summary */}
            {totalH2H === 0 && h2h.length === 0 ? (
              <div className="rounded-xl bg-zinc-900/30 p-6 text-center">
                <p className="text-lg font-semibold text-white">Premier affrontement</p>
                <p className="mt-1 text-sm text-gray-400">
                  {data.homeTeam.name} et {data.awayTeam.name} ne se sont jamais affrontées.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-zinc-900/50 p-4">
                  <h3 className="text-sm font-semibold text-white/80 mb-3">Bilan des confrontations</h3>
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-3xl font-extrabold text-emerald-400">{h2hSummary.homeWins}</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">{data.homeTeam.name}</p>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-gray-400">{h2hSummary.draws}</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">Nuls</p>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-blue-400">{h2hSummary.awayWins}</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">{data.awayTeam.name}</p>
                    </div>
                  </div>
                  {totalH2H > 0 && (
                    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(h2hSummary.homeWins / totalH2H) * 100}%` }}
                      />
                      <div
                        className="bg-zinc-500"
                        style={{ width: `${(h2hSummary.draws / totalH2H) * 100}%` }}
                      />
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(h2hSummary.awayWins / totalH2H) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* H2H History */}
                {h2h.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white/80">Historique</h3>
                    <div className="space-y-2">
                      {h2h.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
                        >
                          <span className="text-xs text-gray-400">
                            {new Date(m.matchDate).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-white font-medium">
                            {m.homeTeamName} <span className="text-amber-400 mx-1">{m.homeScore} - {m.awayScore}</span>{" "}
                            {m.awayTeamName}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              m.homeScore > m.awayScore
                                ? "bg-emerald-500/20 text-emerald-400"
                                : m.homeScore < m.awayScore
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-zinc-500/20 text-zinc-400"
                            }`}
                          >
                            {m.homeScore > m.awayScore ? "V" : m.homeScore < m.awayScore ? "D" : "N"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Compositions Tab */}
        {tab === "Compositions" && (
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex justify-end">
              <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                <button
                  onClick={() => setLineupViewMode("pitch")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    lineupViewMode === "pitch"
                      ? "bg-red-500 text-white"
                      : "text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Terrain
                </button>
                <button
                  onClick={() => setLineupViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    lineupViewMode === "list"
                      ? "bg-red-500 text-white"
                      : "text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  <List size={14} />
                  Liste
                </button>
              </div>
            </div>

            {/* Pitch View */}
            {lineupViewMode === "pitch" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2 text-xs font-semibold text-gray-400">
                  <span>
                    {data.homeTeam.name} ({data.homeTeam.formation ?? "4-3-3"})
                  </span>
                  <span>
                    {data.awayTeam.name} ({data.awayTeam.formation ?? "4-3-3"})
                  </span>
                </div>
                <DualFacingPitch
                  homeTeam={data.homeTeam}
                  awayTeam={data.awayTeam}
                  homeStarters={homeStarters}
                  awayStarters={awayStarters}
                />
                {/* Substitutes */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-zinc-900/50 p-4">
                    <h3 className="text-sm font-semibold text-white/80 mb-3">Remplaçants {data.homeTeam.name}</h3>
                    {homeSubstitutes.length > 0 ? (
                      <ul className="space-y-2">
                        {homeSubstitutes.map((p) => (
                          <li key={p.playerId} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.playerName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                <span className="text-xs font-bold">{p.jerseyNumber}</span>
                              </div>
                            )}
                            <span className="text-white">{p.playerName}</span>
                            <span className="text-xs text-gray-400 ml-auto">#{p.jerseyNumber}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun remplaçant</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-zinc-900/50 p-4">
                    <h3 className="text-sm font-semibold text-white/80 mb-3">Remplaçants {data.awayTeam.name}</h3>
                    {awaySubstitutes.length > 0 ? (
                      <ul className="space-y-2">
                        {awaySubstitutes.map((p) => (
                          <li key={p.playerId} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.playerName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                <span className="text-xs font-bold">{p.jerseyNumber}</span>
                              </div>
                            )}
                            <span className="text-white">{p.playerName}</span>
                            <span className="text-xs text-gray-400 ml-auto">#{p.jerseyNumber}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun remplaçant</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* List View */
              <div className="grid gap-6 sm:grid-cols-2">
                <LineupColumn teamName={data.homeTeam.name} data={data.lineups?.home} />
                <LineupColumn teamName={data.awayTeam.name} data={data.lineups?.away} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}