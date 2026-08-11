import { prisma } from "@/lib/prisma";
import LiveStandings from "@/components/LiveStandings";

// Force le rendu dynamique pour éviter les erreurs de pré-rendu statique lors du build
export const dynamic = "force-dynamic";


export default async function StandingsPage() {
  const standings = await prisma.standing.findMany({
    include: { team: true },
    orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Classement</h1>
      <LiveStandings initialStandings={standings} />
    </main>
  );
}
