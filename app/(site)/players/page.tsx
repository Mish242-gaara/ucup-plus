import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamLogo from "@/components/TeamLogo";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    where: { status: "approved" },
    orderBy: [{ goals: "desc" }, { lastName: "asc" }],
    include: { team: { include: { university: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Joueurs</h1>
        <Link href="/players/leaderboard" className="text-sm font-semibold text-brand-500 hover:underline">
          Classement des buteurs →
        </Link>
      </div>

      {players.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">Aucun joueur approuvé pour le moment.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="site-card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-square w-full bg-gray-100">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt={`${p.firstName} ${p.lastName}`} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-300">
                    {p.firstName[0]}
                    {p.lastName[0]}
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                  #{p.jerseyNumber}
                </span>
                {p.goals > 0 && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                    ⚽ {p.goals}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold text-ink">
                  {p.firstName} {p.lastName}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <TeamLogo name={p.team.name} logo={p.team.university.logo} size={16} />
                  <p className="truncate text-xs text-gray-400">{p.team.name}</p>
                </div>
                <p className="mt-1 text-xs font-semibold text-brand-500">{p.position}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
