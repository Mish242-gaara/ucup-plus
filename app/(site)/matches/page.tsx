import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import LiveFeed from "@/components/LiveFeed";

const matchInclude = {
  homeTeam: { include: { university: true } },
  awayTeam: { include: { university: true } },
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const validFilter = filter === "live" || filter === "finished" || filter === "upcoming" ? filter : undefined;

  const statusFilter =
    validFilter === "live"
      ? { in: ["live", "halftime"] as const }
      : validFilter === "finished"
        ? { in: ["finished"] as const }
        : validFilter === "upcoming"
          ? { in: ["scheduled"] as const }
          : undefined;

  const matches = await prisma.match.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: matchInclude,
    orderBy: { matchDate: validFilter === "finished" ? "desc" : "asc" },
    take: 30,
  });

  const initialMatches = matches.map((m) => ({
    ...m,
    matchDate: m.matchDate.toISOString(),
    currentMinute: m.status === "live" || m.status === "halftime" ? currentMinute(getElapsedSeconds(m)) : null,
  }));

  const title =
    validFilter === "live"
      ? "Matchs en direct"
      : validFilter === "finished"
        ? "Résultats"
        : validFilter === "upcoming"
          ? "Calendrier"
          : "Tous les matchs";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-extrabold uppercase tracking-wide text-ink">{title}</h1>

      <div className="mt-4">
        <LiveFeed
          initialMatches={initialMatches}
          filter={validFilter}
          emptyMessage="Aucun match à afficher pour ce filtre."
        />
      </div>
    </main>
  );
}
