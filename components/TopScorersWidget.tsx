import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamLogo from "@/components/TeamLogo";

export default async function TopScorersWidget() {
  const scorers = await prisma.player.findMany({
    where: { goals: { gt: 0 }, status: "approved" },
    orderBy: { goals: "desc" },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      goals: true,
      team: { select: { name: true, university: { select: { logo: true } } } },
    },
  });

  return (
    <div className="site-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Top buteurs</h2>
        <Link href="/players/leaderboard" className="text-xs font-semibold text-brand-500 hover:underline">
          Voir tout
        </Link>
      </div>

      {scorers.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">Aucun but marqué pour le moment.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {scorers.map((p, i) => (
            <li key={p.id}>
              <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                <span className="w-4 text-sm font-bold text-gray-400">{i + 1}</span>
                <TeamLogo name={p.team.name} logo={p.team.university.logo} size={28} />
                <span className="flex-1 text-sm font-semibold text-ink">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-sm font-bold text-brand-500">{p.goals}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
