import { prisma } from "@/lib/prisma";
import Bracket from "@/components/Bracket";

// Force le rendu dynamique pour éviter les erreurs de pré-rendu statique lors du build
export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const matches = await prisma.match.findMany({
    where: { bracketRound: { not: null } },
    include: {
      homeTeam: { include: { university: true } },
      awayTeam: { include: { university: true } },
    },
    orderBy: [{ bracketRound: "asc" }, { bracketPosition: "asc" }],
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Tableau à élimination directe</h1>

      {matches.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">
          Le bracket sera affiché une fois les phases finales programmées.
        </p>
      ) : (
        <div className="mt-8">
          <Bracket matches={matches as never} />
        </div>
      )}
    </main>
  );
}