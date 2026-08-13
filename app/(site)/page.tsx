import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import LiveFeed from "@/components/LiveFeed";
import TopScorersWidget from "@/components/TopScorersWidget";
import StandingsWidget from "@/components/StandingsWidget";
import FeaturedMatchHero from "@/components/FeaturedMatchHero";
import TeamsCarousel from "@/components/TeamsCarousel";
import TournamentStats from "@/components/TournamentStats";

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
    currentMinute:
      m.status === "live" || m.status === "halftime"
        ? currentMinute(getElapsedSeconds(m))
        : null,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* 1. Grand Match Vedette (Hero Banner) */}
      <FeaturedMatchHero />

      {/* 2. Carrousel des Équipes */}
      <TeamsCarousel />

      {/* 3. Section Principale & Barre Latérale */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide text-ink">
              Live Score Feed
            </h1>

            <div className="mt-4">
              <LiveFeed
                key="homepage-feed"
                initialMatches={initialMatches}
                emptyMessage="Aucun match en direct ou à venir pour le moment."
              />
            </div>
          </div>

          {/* 4. Statistiques Globales du Tournoi */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink mb-3">
              Chiffres du Tournoi
            </h2>
            <TournamentStats />
          </div>
        </section>

        <aside className="space-y-4">
          <TopScorersWidget />
          <StandingsWidget />
        </aside>
      </div>
    </main>
  );
}