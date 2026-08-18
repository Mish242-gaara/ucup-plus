import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import FlashInfo from "@/components/FlashInfo";
import FeaturedMatchHero from "@/components/FeaturedMatchHero";
import TeamsCarousel from "@/components/TeamsCarousel";
import LiveFeed from "@/components/LiveFeed";
import MVPWidget from "@/components/MVPWidget";
import NewsFeed from "@/components/NewsFeed";
import TournamentStats from "@/components/TournamentStats";
import TopScorersWidget from "@/components/TopScorersWidget";
import StandingsWidget from "@/components/StandingsWidget";
import SponsorsBanner from "@/components/SponsorsBanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [matches, nextMatch] = await Promise.all([
    prisma.match.findMany({
      where: { status: { in: ["live", "halftime", "scheduled"] } },
      include: {
        homeTeam: { include: { university: true } },
        awayTeam: { include: { university: true } },
      },
      orderBy: { matchDate: "asc" },
      take: 20,
    }),
    prisma.match.findFirst({
      where: { status: "scheduled" },
      orderBy: { matchDate: "asc" },
      include: {
        homeTeam: { include: { university: true } },
        awayTeam: { include: { university: true } },
      },
    }),
  ]);

  const initialMatches = matches.map((m) => ({
    ...m,
    matchDate: m.matchDate.toISOString(),
    currentMinute:
      m.status === "live" || m.status === "halftime"
        ? currentMinute(getElapsedSeconds(m))
        : null,
  }));

  return (
    <div className="space-y-6">
      <FlashInfo />

      <main className="mx-auto max-w-6xl px-4 space-y-8 pb-12">
        {nextMatch && (
          <FeaturedMatchHero
            matchId={nextMatch.id}
            homeTeam={nextMatch.homeTeam.name}
            homeLogo={nextMatch.homeTeam.university.logo}
            awayTeam={nextMatch.awayTeam.name}
            awayLogo={nextMatch.awayTeam.university.logo}
            location={nextMatch.venue}
            initialHomeVotes={nextMatch.homeVotes ?? 0}
            initialDrawVotes={nextMatch.drawVotes ?? 0}
            initialAwayVotes={nextMatch.awayVotes ?? 0}
            matchDate={new Date(nextMatch.matchDate).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}

        <TeamsCarousel />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-wide text-ink mb-3">
                Live Score Feed
              </h1>
              <LiveFeed
                key="homepage-feed"
                initialMatches={initialMatches}
                emptyMessage="Aucun match en direct ou à venir pour le moment."
              />
            </div>

            <MVPWidget />
            <NewsFeed />

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink mb-3">
                Chiffres du Tournoi
              </h2>
              <TournamentStats />
            </div>
          </section>

          <aside className="space-y-6">
            <TopScorersWidget />
            <StandingsWidget />
          </aside>
        </div>

        <SponsorsBanner />
      </main>
    </div>
  );
}