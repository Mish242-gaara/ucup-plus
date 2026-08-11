import Link from "next/link";
import { BarChart3, ListChecks, Radio } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";

type MatchCardData = {
  id: number;
  status: string;
  homeScore: number;
  awayScore: number;
  matchDate: Date;
  currentMinute: number | null;
  homeTeam: { name: string; university: { logo: string | null } };
  awayTeam: { name: string; university: { logo: string | null } };
};

export default function MatchCard({ m }: { m: MatchCardData }) {
  const isLive = m.status === "live" || m.status === "halftime";
  const isFinished = m.status === "finished";
  const isUpcoming = m.status === "scheduled";

  const dateLabel = new Date(m.matchDate)
    .toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();
  const timeLabel = new Date(m.matchDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="site-card overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-live">
            {m.currentMinute}&apos;
            <span className="h-2 w-2 animate-pulse rounded-full bg-live" />
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-400">{dateLabel}</span>
        )}

        {isLive && (
          <span className="rounded-full bg-live px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            Live
          </span>
        )}
        {isFinished && (
          <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-gray-500">
            Terminé
          </span>
        )}
      </div>

      <Link href={`/matches/${m.id}`} className="grid grid-cols-3 items-center gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <TeamLogo name={m.homeTeam.name} logo={m.homeTeam.university.logo} />
          <span className="text-sm font-semibold text-ink">{m.homeTeam.name}</span>
        </div>

        <div className="text-center">
          {isUpcoming ? (
            <>
              <p className="text-xs font-medium text-gray-400">Kickoff</p>
              <p className="text-lg font-bold text-ink">{timeLabel}</p>
            </>
          ) : (
            <p className="text-2xl font-extrabold text-ink">
              {m.homeScore} - {m.awayScore}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 text-right">
          <span className="text-sm font-semibold text-ink">{m.awayTeam.name}</span>
          <TeamLogo name={m.awayTeam.name} logo={m.awayTeam.university.logo} />
        </div>
      </Link>

      {isUpcoming ? (
        <div className="flex justify-between border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          <span>{dateLabel}</span>
          <span>{dateLabel}</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 text-xs font-medium">
          <Link
            href={`/matches/${m.id}?tab=stats`}
            className="flex items-center justify-center gap-1.5 py-2 text-gray-500 hover:text-brand-500"
          >
            <BarChart3 size={14} /> Statistiques
          </Link>
          <Link
            href={`/matches/${m.id}?tab=compositions`}
            className="flex items-center justify-center gap-1.5 py-2 text-gray-500 hover:text-brand-500"
          >
            <ListChecks size={14} /> Compositions
          </Link>
          <Link
            href={`/matches/${m.id}`}
            className="flex items-center justify-center gap-1.5 py-2 font-semibold text-brand-500"
          >
            <Radio size={14} /> Direct Live
          </Link>
        </div>
      )}
    </div>
  );
}
