import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function TeamColumn({
  teamName,
  formation,
  starters,
  substitutes,
}: {
  teamName: string;
  formation: string | null;
  starters: { playerId: number; position: string | null; player: { firstName: string; lastName: string; jerseyNumber: number } }[];
  substitutes: { playerId: number; player: { firstName: string; lastName: string; jerseyNumber: number } }[];
}) {
  return (
    <div>
      <h2 className="font-semibold">{teamName}</h2>
      <p className="text-xs text-gray-400">{formation ?? "Formation non renseignée"}</p>

      <ul className="mt-3 space-y-1 text-sm">
        {starters
          .sort((a, b) => (a as any).orderKey - (b as any).orderKey)
          .map((s) => (
            <li key={s.playerId} className="flex justify-between">
              <span>
                #{s.player.jerseyNumber} {s.player.firstName} {s.player.lastName}
              </span>
              <span className="text-gray-400">{s.position}</span>
            </li>
          ))}
      </ul>

      {substitutes.length > 0 && (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-500">Remplaçants</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-500">
            {substitutes.map((s) => (
              <li key={s.playerId}>
                #{s.player.jerseyNumber} {s.player.firstName} {s.player.lastName}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default async function MatchLineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      matchLineups: { include: { player: true } },
    },
  });

  if (!match) notFound();

  const homeLineups = match.matchLineups.filter((l) => l.teamId === match.homeTeamId);
  const awayLineups = match.matchLineups.filter((l) => l.teamId === match.awayTeamId);

  const noLineupYet = !match.homeCompositionReady && !match.awayCompositionReady;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/matches/${matchId}`} className="text-sm text-gray-400 hover:text-brand-500">
        ← Retour au match
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">
        Compositions — {match.homeTeam.name} vs {match.awayTeam.name}
      </h1>

      {noLineupYet ? (
        <p className="mt-4 text-sm text-gray-400">Les compositions n&apos;ont pas encore été publiées.</p>
      ) : (
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <TeamColumn
            teamName={match.homeTeam.name}
            formation={match.homeFormation}
            starters={homeLineups.filter((l) => l.role === "starter") as any}
            substitutes={homeLineups.filter((l) => l.role === "substitute") as any}
          />
          <TeamColumn
            teamName={match.awayTeam.name}
            formation={match.awayFormation}
            starters={awayLineups.filter((l) => l.role === "starter") as any}
            substitutes={awayLineups.filter((l) => l.role === "substitute") as any}
          />
        </div>
      )}
    </main>
  );
}
