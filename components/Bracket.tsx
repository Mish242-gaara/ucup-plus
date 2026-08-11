import Link from "next/link";
import TeamLogo from "@/components/TeamLogo";

type BracketMatch = {
  id: number;
  round: string | null;
  bracketRound: number;
  bracketPosition: number | null;
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: { name: string; university: { logo: string | null } } | null;
  awayTeam: { name: string; university: { logo: string | null } } | null;
};

const MATCH_HEIGHT = 76;
const BASE_GAP = 20;

function spacingFor(roundIndex: number) {
  const multiplier = 2 ** roundIndex;
  const half = ((multiplier - 1) * (MATCH_HEIGHT + BASE_GAP)) / 2;
  return {
    marginTop: roundIndex === 0 ? 0 : half,
    marginBottom: roundIndex === 0 ? BASE_GAP : half + BASE_GAP,
  };
}

function BracketCard({ m, isLast }: { m: BracketMatch; isLast: boolean }) {
  const isFinished = m.status === "finished";
  const isLive = m.status === "live" || m.status === "halftime";
  const homeWon = isFinished && m.homeScore > m.awayScore;
  const awayWon = isFinished && m.awayScore > m.homeScore;

  return (
    <div className="relative" style={{ height: MATCH_HEIGHT }}>
      <Link
        href={`/matches/${m.id}`}
        className="site-card block w-56 overflow-hidden text-xs hover:shadow-md"
      >
        <div className={`flex items-center justify-between px-3 py-1.5 ${homeWon ? "bg-brand-50" : ""}`}>
          <span className="flex items-center gap-1.5 truncate">
            <TeamLogo name={m.homeTeam?.name ?? "?"} logo={m.homeTeam?.university.logo ?? null} size={18} />
            <span className={`truncate ${homeWon ? "font-bold text-ink" : "text-gray-600"}`}>
              {m.homeTeam?.name ?? "À déterminer"}
            </span>
          </span>
          <span className="font-mono font-bold text-ink">{isFinished || isLive ? m.homeScore : ""}</span>
        </div>
        <div className={`flex items-center justify-between border-t border-gray-100 px-3 py-1.5 ${awayWon ? "bg-brand-50" : ""}`}>
          <span className="flex items-center gap-1.5 truncate">
            <TeamLogo name={m.awayTeam?.name ?? "?"} logo={m.awayTeam?.university.logo ?? null} size={18} />
            <span className={`truncate ${awayWon ? "font-bold text-ink" : "text-gray-600"}`}>
              {m.awayTeam?.name ?? "À déterminer"}
            </span>
          </span>
          <span className="font-mono font-bold text-ink">{isFinished || isLive ? m.awayScore : ""}</span>
        </div>
      </Link>
      {isLive && (
        <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 animate-pulse rounded-full bg-live" />
      )}
      {!isLast && (
        <div className="absolute left-full top-1/2 h-px w-4 -translate-y-1/2 bg-gray-300" aria-hidden />
      )}
    </div>
  );
}

export default function Bracket({ matches }: { matches: BracketMatch[] }) {
  const rounds = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const idx = m.bracketRound;
    if (!rounds.has(idx)) rounds.set(idx, []);
    rounds.get(idx)!.push(m);
  }

  const sortedRounds = Array.from(rounds.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="flex gap-10 overflow-x-auto pb-6">
      {sortedRounds.map(([roundNumber, roundMatches], roundIndex) => {
        const sorted = [...roundMatches].sort(
          (a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0)
        );
        return (
          <div key={roundNumber} className="flex flex-col">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-brand-500">
              {sorted[0]?.round || `Tour ${roundNumber}`}
            </p>
            <div className="flex flex-col">
              {sorted.map((m) => {
                const spacing = spacingFor(roundIndex);
                return (
                  <div key={m.id} style={{ marginTop: spacing.marginTop, marginBottom: spacing.marginBottom }}>
                    <BracketCard m={m} isLast={roundIndex === sortedRounds.length - 1} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
