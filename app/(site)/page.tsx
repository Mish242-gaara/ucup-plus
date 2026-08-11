import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import LiveFeed from "@/components/LiveFeed";
import FeaturedMatchCard from "@/components/FeaturedMatchCard";
import TopScorersWidget from "@/components/TopScorersWidget";
import StandingsWidget from "@/components/StandingsWidget";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matches = await prisma.match.findMany({
    where: { status: { in: ["live", "halftime", "scheduled"] } },
    include: {
      homeTeam: { include: { university: true } },
      awayTeam: { include: { university: true } },
    },
    orderBy: { matchDate: "asc" },
    take: 20,
  });

  const initialMatches = matches.map((m) => ({
    ...m,
    matchDate: m.matchDate.toISOString(),
    currentMinute: m.status === "live" || m.status === "halftime" ? currentMinute(getElapsedSeconds(m)) : null,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-ink">Live Score Feed</h1>

          <div className="mt-4">
            <LiveFeed
              initialMatches={initialMatches}
              emptyMessage="Aucun match en direct ou à venir pour le moment."
            />
          </div>
        </section>

        <aside className="space-y-4">
          <FeaturedMatchCard />
          <TopScorersWidget />
          <StandingsWidget />
        </aside>
      </div>
    </main>
  );
}
