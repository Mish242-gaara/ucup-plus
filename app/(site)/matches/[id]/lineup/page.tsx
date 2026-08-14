import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type LineupPlayer = {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
};

type StarterEntry = {
  playerId: number;
  position: string | null;
  orderKey: number | null;
  player: LineupPlayer;
};

type SubstituteEntry = {
  playerId: number;
  player: LineupPlayer;
};

function TeamColumn({
  teamName,
  formation,
  starters,
  substitutes,
}: {
  teamName: string;
  formation: string | null;
  starters: StarterEntry[];
  substitutes: SubstituteEntry[];
}) {
  const sortedStarters = [...starters].sort((a, b) => (a.orderKey ?? 0) - (b.orderKey ?? 0));

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-lg">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-white">{teamName}</h2>
        <p className="text-xs font-semibold text-brand-400">
          {formation ? `Formation : ${formation}` : "Formation non renseignée"}
        </p>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Titulaires</h3>
        {sortedStarters.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">Aucun titulaire renseigné.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {sortedStarters.map((s) => (
              <li
                key={s.playerId}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-gray-200"
              >
                <span className="font-medium">
                  <span className="mr-2 inline-block w-6 text-xs font-bold text-gray-500">
                    #{s.player.jerseyNumber}
                  </span>
                  {s.player.firstName} {s.player.lastName}
                </span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase text-gray-400">
                  {s.position || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {substitutes.length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Remplaçants</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
            {substitutes.map((s) => (
              <li key={s.playerId} className="flex items-center px-3 py-1">
                <span className="mr-2 inline-block w-6 text-xs font-bold text-gray-500">
                  #{s.player.jerseyNumber}
                </span>
                <span>
                  {s.player.firstName} {s.player.lastName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default async function MatchLineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  if (isNaN(matchId)) {
    notFound();
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      matchLineups: {
        include: { player: true },
      },
    },
  });

  if (!match) {
    notFound();
  }

  const homeLineups = match.matchLineups.filter((l) => l.teamId === match.homeTeamId);
  const awayLineups = match.matchLineups.filter((l) => l.teamId === match.awayTeamId);

  const noLineupYet =
    !match.homeCompositionReady &&
    !match.awayCompositionReady &&
    homeLineups.length === 0 &&
    awayLineups.length === 0;

  const homeStarters: StarterEntry[] = homeLineups
    .filter((l) => l.role === "starter")
    .map((l) => ({
      playerId: l.playerId,
      position: l.position,
      orderKey: l.orderKey,
      player: l.player,
    }));

  const homeSubstitutes: SubstituteEntry[] = homeLineups
    .filter((l) => l.role === "substitute")
    .map((l) => ({
      playerId: l.playerId,
      player: l.player,
    }));

  const awayStarters: StarterEntry[] = awayLineups
    .filter((l) => l.role === "starter")
    .map((l) => ({
      playerId: l.playerId,
      position: l.position,
      orderKey: l.orderKey,
      player: l.player,
    }));

  const awaySubstitutes: SubstituteEntry[] = awayLineups
    .filter((l) => l.role === "substitute")
    .map((l) => ({
      playerId: l.playerId,
      player: l.player,
    }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href={`/matches/${matchId}`}
        className="inline-flex items-center text-sm font-semibold text-gray-400 transition-colors hover:text-white"
      >
        ← Retour au match
      </Link>
      <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">
        Compositions — {match.homeTeam.name} <span className="text-gray-500">vs</span> {match.awayTeam.name}
      </h1>

      {noLineupYet ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-zinc-900 p-8 text-center">
          <p className="text-sm font-medium text-gray-400">
            Les compositions n&apos;ont pas encore été publiées pour ce match.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <TeamColumn
            teamName={match.homeTeam.name}
            formation={match.homeFormation}
            starters={homeStarters}
            substitutes={homeSubstitutes}
          />
          <TeamColumn
            teamName={match.awayTeam.name}
            formation={match.awayFormation}
            starters={awayStarters}
            substitutes={awaySubstitutes}
          />
        </div>
      )}
    </main>
  );
}