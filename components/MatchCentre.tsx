"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Trophy,
  LayoutGrid,
  List,
  MapPin,
  UserCheck,
  Flame,
  Scale,
  Award,
  Volume2,
  TrendingUp,
  ThumbsUp,
} from "lucide-react";
import { useRealtime } from "@/lib/hooks/useRealtime";
import TeamLogo from "@/components/TeamLogo";

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
  homeVotes?: number;
  drawVotes?: number;
  awayVotes?: number;
  audioSummaryUrl?: string | null;
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

const REVERSE_TAB_PARAM: Record<(typeof TABS)[number], string> = {
  Scores: "scores",
  Stats: "stats",
  Résumé: "resume",
  "Face-à-face": "h2h",
  Compositions: "compositions",
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

function LiveMatchTimer({
  status,
  formattedTime,
  isPaused,
}: {
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
        if (!prevTime || !prevTime.includes(":")) return prevTime;

        const [minsStr, secsStr] = prevTime.split(":");
        let mins = parseInt(minsStr, 10);
        let secs = parseInt(secsStr, 10);

        if (isNaN(mins) || isNaN(secs)) return prevTime;

        secs += 1;
        if (secs >= 60) {
          secs = 0;
          mins += 1;
        }

        const formattedMins = String(mins).padStart(2, "0");
        const formattedSecs = String(secs).padStart(2, "0");

        return `${formattedMins}:${formattedSecs}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, isPaused]);

  if (status === "finished") return <span>Terminé</span>;
  if (status === "scheduled") return <span>À venir</span>;

  return (
    <span>
      {time}
      {isPaused ? " (pause)" : ""}
    </span>
  );
}

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
        <span className="text-zinc-400">{label}</span>
        <span>
          {away}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="bg-red-600 transition-all duration-300" style={{ width: `${homePct}%` }} />
        <div className="bg-zinc-600 transition-all duration-300" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

function LineupColumn({
  teamName,
  data,
}: {
  teamName: string;
  data?: { starters: LineupEntry[]; substitutes: LineupEntry[] };
}) {
  const starters = [...(data?.starters ?? [])].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));
  const substitutes = data?.substitutes ?? [];

  return (
    <div>
      <h3 className="font-semibold text-white">{teamName}</h3>
      {starters.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">Composition non publiée.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {starters.map((p) => (
            <li key={p.playerId} className="flex justify-between border-b border-zinc-800/50 py-1 text-zinc-200">
              <span>
                #{p.jerseyNumber} {p.playerName}
              </span>
              <span className="text-zinc-500">{p.position}</span>
            </li>
          ))}
        </ul>
      )}
      {substitutes.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Remplaçants</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
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

function PlayerNode({ player, events = [] }: { player: LineupEntry; events?: LiveData["events"] }) {
  const nameParts = player.playerName.trim().split(" ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

  const playerEvents = events.filter((e) => e.player === player.playerName);
  const goals = playerEvents.filter((e) => e.eventType.includes("goal")).length;
  const yellowCard = playerEvents.some((e) => e.eventType === "yellow_card");
  const redCard = playerEvents.some((e) => e.eventType === "red_card" || e.eventType === "second_yellow");

  return (
    <div className="group flex flex-col items-center">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-zinc-800 shadow-md transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.playerName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-zinc-300">
            {player.playerName.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {goals > 0 && <span className="text-[10px]">⚽{goals > 1 ? goals : ""}</span>}
          {yellowCard && <span className="h-2.5 w-1.5 rounded-sm bg-amber-400" />}
          {redCard && <span className="h-2.5 w-1.5 rounded-sm bg-rose-600" />}
        </div>
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

function DualFacingPitch({
  homeTeam,
  awayTeam,
  homeStarters = [],
  awayStarters = [],
  events = [],
}: {
  homeTeam: { name: string; formation: string | null };
  awayTeam: { name: string; formation: string | null };
  homeStarters: LineupEntry[];
  awayStarters: LineupEntry[];
  events?: LiveData["events"];
}) {
  const parseFormation = (f: string | null) =>
    f && f.includes("-") ? f.split("-").map(Number) : [4, 3, 3];

  const homeForm = parseFormation(homeTeam.formation);
  const awayForm = parseFormation(awayTeam.formation);

  const sortedHome = [...homeStarters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));
  const sortedAway = [...awayStarters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));

  const homeKeeper = sortedHome[0];
  const homeOutfield = sortedHome.slice(1);
  const homeRows: LineupEntry[][] = [];
  let hIdx = 0;
  homeForm.forEach((count) => {
    homeRows.push(homeOutfield.slice(hIdx, hIdx + count));
    hIdx += count;
  });

  const awayKeeper = sortedAway[0];
  const awayOutfield = sortedAway.slice(1);
  const awayRows: LineupEntry[][] = [];
  let aIdx = 0;
  awayForm.forEach((count) => {
    awayRows.push(awayOutfield.slice(aIdx, aIdx + count));
    aIdx += count;
  });

  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c1411] p-4 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

      <div className="pointer-events-none absolute top-0 left-1/2 h-20 w-44 -translate-x-1/2 rounded-b-xl border border-t-0 border-emerald-500/20 bg-emerald-500/5" />
      <div className="pointer-events-none absolute top-1/2 left-0 w-full border-t border-emerald-500/20" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-44 -translate-x-1/2 rounded-t-xl border border-b-0 border-emerald-500/20 bg-emerald-500/5" />

      <div className="relative z-10 flex min-h-[700px] flex-col justify-between py-2 sm:min-h-[780px]">
        <div className="flex flex-col justify-between space-y-4">
          <div className="flex justify-center">
            {homeKeeper && <PlayerNode player={homeKeeper} events={events} />}
          </div>
          {homeRows.map((row, rIdx) => {
            const isLastRow = rIdx === homeRows.length - 1;
            return (
              <div
                key={`home-row-${rIdx}`}
                className={`flex items-center justify-around px-2 ${isLastRow ? "mb-8 sm:mb-10" : ""}`}
              >
                {row.map((p) => (
                  <PlayerNode key={p.playerId} player={p} events={events} />
                ))}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col-reverse justify-between space-y-4 space-y-reverse">
          <div className="flex justify-center">
            {awayKeeper && <PlayerNode player={awayKeeper} events={events} />}
          </div>
          {awayRows.map((row, rIdx) => {
            const isLastRow = rIdx === awayRows.length - 1;
            return (
              <div
                key={`away-row-${rIdx}`}
                className={`flex items-center justify-around px-2 ${isLastRow ? "mt-8 sm:mt-10" : ""}`}
              >
                {row.map((p) => (
                  <PlayerNode key={p.playerId} player={p} events={events} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FormBadge({ result }: { result: MatchResult }) {
  const colors: Record<MatchResult, string> = {
    V: "bg-emerald-500 text-white",
    N: "bg-zinc-500 text-white",
    D: "bg-rose-500 text-white",
  };

  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${colors[result]}`}>
      {result}
    </span>
  );
}

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

  const [tab, setTab] = useState<(typeof TABS)[number]>("Scores");
  const [lineupViewMode, setLineupViewMode] = useState<"pitch" | "list">("pitch");

  const [userVote, setUserVote] = useState<"home" | "draw" | "away" | null>(null);
  const [votes, setVotes] = useState({
    home: data.homeVotes ?? 10,
    draw: data.drawVotes ?? 4,
    away: data.awayVotes ?? 6,
  });

  const [mvpVotes, setMvpVotes] = useState<Record<number, number>>({});
  const [votedMvp, setVotedMvp] = useState<number | null>(null);

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

  const handleVote = (choice: "home" | "draw" | "away") => {
    if (userVote) return;
    setUserVote(choice);
    setVotes((prev) => ({ ...prev, [choice]: prev[choice] + 1 }));
  };

  const handleMvpVote = (playerId: number) => {
    if (votedMvp) return;
    setVotedMvp(playerId);
    setMvpVotes((prev) => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
  };

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

  const totalH2H = h2hSummary.homeWins + h2hSummary.draws + h2hSummary.awayWins;
  const totalVotes = votes.home + votes.draw + votes.away || 1;
  const allPlayers = [...homeStarters, ...awayStarters];

  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl border border-zinc-800">
      <div className="bg-gradient-to-r from-red-700 via-zinc-900 to-zinc-900 px-6 py-4 text-center text-white">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Trophy size={18} />
          </span>
          <div>
            <p className="text-lg font-extrabold uppercase tracking-wide">
              {isLive ? "Direct Live" : data.status === "finished" ? "Match terminé" : "À venir"}
            </p>
            <p className="text-xs uppercase tracking-widest text-zinc-300">
              {data.round ?? (data.group ? `Groupe ${data.group}` : "UCUP 2026")}
            </p>
          </div>
        </div>

        {(data.venue || data.referee) && (
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-zinc-400">
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
      </div>

      <div className="flex justify-center gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-900 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={
              tab === t
                ? "border-b-2 border-red-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white whitespace-nowrap"
                : "px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-200 whitespace-nowrap"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "Scores" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-300">
              {isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
              <LiveMatchTimer
                status={data.status}
                formattedTime={data.formattedTime}
                isPaused={data.isPaused}
              />
              {data.isExtraTime && <span className="text-red-500">· Prolongation</span>}
              {data.isPenaltyShootout && <span className="text-red-500">· Tirs au but</span>}
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
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

            <div className="grid grid-cols-2 gap-4 text-xs text-zinc-400">
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

            {data.audioSummaryUrl && (
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Résumé audio & commentaire</p>
                    <p className="text-[10px] text-zinc-400">Écoutez le bilan vocal du match</p>
                  </div>
                </div>
                <audio controls src={data.audioSummaryUrl} className="h-8 w-48 sm:w-64" />
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-red-500" /> Pression du match (Momentum)
                </span>
              </div>
              <div className="flex h-12 items-center justify-between gap-1 rounded-lg bg-zinc-950 p-2">
                {[40, -20, 60, 80, -40, -70, 30, 90, 10].map((v, i) => (
                  <div key={i} className="flex h-full w-full flex-col justify-center items-center">
                    <div
                      style={{ height: `${Math.abs(v)}%` }}
                      className={`w-full rounded-sm ${v > 0 ? "bg-red-500" : "bg-zinc-600"}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <ThumbsUp size={14} className="text-amber-400" /> Vote des supporters (Qui va gagner ?)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleVote("home")}
                  className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                    userVote === "home" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {data.homeTeam.name} ({Math.round((votes.home / totalVotes) * 100)}%)
                </button>
                <button
                  onClick={() => handleVote("draw")}
                  className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                    userVote === "draw" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Nul ({Math.round((votes.draw / totalVotes) * 100)}%)
                </button>
                <button
                  onClick={() => handleVote("away")}
                  className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                    userVote === "away" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {data.awayTeam.name} ({Math.round((votes.away / totalVotes) * 100)}%)
                </button>
              </div>
            </div>

            {data.status === "finished" && allPlayers.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Award size={16} /> Élire l&apos;homme du match (MVP)
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allPlayers.map((p) => (
                    <button
                      key={p.playerId}
                      onClick={() => handleMvpVote(p.playerId)}
                      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        votedMvp === p.playerId
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <span>#{p.jerseyNumber}</span>
                      <span>{p.playerName}</span>
                      {mvpVotes[p.playerId] && (
                        <span className="rounded bg-amber-400/20 px-1 text-[10px] text-amber-300">
                          +{mvpVotes[p.playerId]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Stats" && (
          <div className="divide-y divide-zinc-800">
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
              <p className="text-sm text-zinc-500">Aucun événement pour le moment.</p>
            )}
            {[
              ...events.map((e) => ({
                kind: "event" as const,
                minute: e.minute,
                sortKey: e.minute * 100 + (e.additionalTime ? parseInt(e.additionalTime, 10) : 0),
                data: e,
              })),
              ...(data.commentary ?? []).map((c) => ({
                kind: "comment" as const,
                minute: c.minute,
                sortKey: c.minute * 100 + 1,
                data: c,
              })),
            ]
              .sort((a, b) => a.sortKey - b.sortKey)
              .map((item) =>
                item.kind === "event" ? (
                  <li key={`e-${item.data.id}`} className="flex items-center gap-3 text-sm">
                    <span className="w-10 shrink-0 text-zinc-500">
                      {item.data.minute}
                      {item.data.additionalTime ? `+${item.data.additionalTime}` : ""}&apos;
                    </span>
                    <span>{EVENT_ICON[item.data.eventType] ?? "•"}</span>
                    <span className="text-zinc-200">
                      <span className="font-medium text-white">{item.data.player}</span>
                      {item.data.assistPlayer && (
                        <span className="text-zinc-500"> (passe : {item.data.assistPlayer})</span>
                      )}
                      {item.data.outPlayer && <span className="text-zinc-500"> ↔ {item.data.outPlayer}</span>}
                      <span className="ml-2 text-zinc-500">— {item.data.team}</span>
                    </span>
                  </li>
                ) : (
                  <li key={`c-${item.data.id}`} className="flex items-start gap-3 text-sm">
                    <span className="w-10 shrink-0 text-zinc-500">{item.data.minute}&apos;</span>
                    <span className="text-zinc-400">💬</span>
                    <span className="italic text-zinc-300">{item.data.text}</span>
                  </li>
                )
              )}
          </ul>
        )}

        {tab === "Face-à-face" && (
          <div className="space-y-6">
            {h2hAdvanced && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <Flame size={14} className="text-amber-500" /> Forme récente
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">{data.homeTeam.name}</span>
                    <div className="flex gap-1">
                      {h2hAdvanced.homeForm.recent.map((r, i) => (
                        <FormBadge key={i} result={r} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex gap-1">
                      {h2hAdvanced.awayForm.recent.map((r, i) => (
                        <FormBadge key={i} result={r} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-zinc-300">{data.awayTeam.name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <Scale size={14} className="text-blue-400" /> Probabilité de victoire
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800 text-[10px]">
                    <div style={{ width: `${h2hAdvanced.probabilities.homeWin}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${h2hAdvanced.probabilities.draw}%` }} className="bg-zinc-500" />
                    <div style={{ width: `${h2hAdvanced.probabilities.awayWin}%` }} className="bg-blue-500" />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-zinc-400">
                    <span>{h2hAdvanced.probabilities.homeWin}%</span>
                    <span>Nul {h2hAdvanced.probabilities.draw}%</span>
                    <span>{h2hAdvanced.probabilities.awayWin}%</span>
                  </div>
                </div>
              </div>
            )}

            {totalH2H === 0 && h2h.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-center">
                <p className="text-base font-semibold text-white">Premier affrontement direct</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {data.homeTeam.name} et {data.awayTeam.name} ne se sont encore jamais affrontées en compétition.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-around text-center text-sm">
                  <div>
                    <p className="text-3xl font-extrabold text-white">{h2hSummary.homeWins}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">{data.homeTeam.name}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-zinc-400">{h2hSummary.draws}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">Nuls</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white">{h2hSummary.awayWins}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">{data.awayTeam.name}</p>
                  </div>
                </div>

                {totalH2H > 0 && (
                  <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      style={{ width: `${(h2hSummary.homeWins / totalH2H) * 100}%` }}
                      className="bg-emerald-500"
                    />
                    <div
                      style={{ width: `${(h2hSummary.draws / totalH2H) * 100}%` }}
                      className="bg-zinc-500"
                    />
                    <div
                      style={{ width: `${(h2hSummary.awayWins / totalH2H) * 100}%` }}
                      className="bg-blue-500"
                    />
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Historique des confrontations
                  </p>
                  {h2h.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-900/80 px-4 py-3 text-sm transition-colors hover:bg-zinc-900"
                    >
                      <span className="text-xs text-zinc-400">
                        {new Date(m.matchDate).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-white">
                        {m.homeTeamName} <span className="mx-1 font-bold text-amber-400">{m.homeScore} - {m.awayScore}</span> {m.awayTeamName}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "Compositions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
                <button
                  onClick={() => setLineupViewMode("pitch")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    lineupViewMode === "pitch" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Terrain
                </button>
                <button
                  onClick={() => setLineupViewMode("list")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    lineupViewMode === "list" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <List size={14} />
                  Liste
                </button>
              </div>
            </div>

            {lineupViewMode === "pitch" ? (
              homeStarters.length === 0 && awayStarters.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">Les compositions n'ont pas encore été publiées.</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-400">
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
                    events={events}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Remplaçants — {data.homeTeam.name}
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm text-zinc-300">
                        {homeSubstitutes.length === 0 ? (
                          <p className="text-xs text-zinc-500">Aucun remplaçant renseigné.</p>
                        ) : (
                          homeSubstitutes.map((p) => (
                            <div key={p.playerId} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
                                #{p.jerseyNumber}
                              </span>
                              <span className="truncate">{p.playerName}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Remplaçants — {data.awayTeam.name}
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm text-zinc-300">
                        {awaySubstitutes.length === 0 ? (
                          <p className="text-xs text-zinc-500">Aucun remplaçant renseigné.</p>
                        ) : (
                          awaySubstitutes.map((p) => (
                            <div key={p.playerId} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
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
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  {data.homeTeam.formation && (
                    <p className="mb-2 text-xs text-zinc-500">Formation : {data.homeTeam.formation}</p>
                  )}
                  <LineupColumn teamName={data.homeTeam.name} data={data.lineups?.home} />
                </div>
                <div>
                  {data.awayTeam.formation && (
                    <p className="mb-2 text-xs text-zinc-500">Formation : {data.awayTeam.formation}</p>
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