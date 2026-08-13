import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function TopScorersWidget() {
  const scorers = await prisma.player.findMany({
    where: { goals: { gt: 0 }, status: "approved" },
    orderBy: { goals: "desc" },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true, // <-- Ajout de la photo du joueur
      goals: true,
      team: { select: { name: true } },
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
                
                {/* Photo du joueur à la place de TeamLogo */}
                <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                  {p.photo ? (
                    <Image
                      src={p.photo}
                      alt={`${p.firstName} ${p.lastName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span>
                      {p.firstName?.[0]}
                      {p.lastName?.[0]}
                    </span>
                  )}
                </div>

                <span className="flex-1 text-sm font-semibold text-ink line-clamp-1">
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