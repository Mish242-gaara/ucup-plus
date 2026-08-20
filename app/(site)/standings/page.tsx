import { prisma } from "@/lib/prisma";
import LiveStandings from "@/components/LiveStandings";

// Force le rendu dynamique pour avoir les données en temps réel à chaque requête
export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  // 1. Récupération des classements de base
  const standings = await prisma.standing.findMany({
    include: {
      team: {
        include: {
          university: true, // Pour inclure le logo
        },
      },
    },
    orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
  });

  // 2. CORRECTION : Récupération des matchs actuellement en direct (insensible à la casse)
  const liveMatches = await prisma.match.findMany({
    where: {
      status: {
        in: ["live", "halftime"],
      },
    },
  });

  // 3. Sérialisation propre des données JSON (pour éviter les erreurs de Date Prisma vers Client Component)
  const serializedStandings = JSON.parse(JSON.stringify(standings));
  const serializedLiveMatches = JSON.parse(JSON.stringify(liveMatches));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Classement</h1>
      <LiveStandings 
        initialStandings={serializedStandings} 
        initialLiveMatches={serializedLiveMatches} 
      />
    </main>
  );
}