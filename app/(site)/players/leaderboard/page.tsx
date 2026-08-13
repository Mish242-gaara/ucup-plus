import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

// Force le rendu dynamique sur le serveur pour éviter les erreurs de pré-rendu statique lors du build
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [topScorers, topAssists, mostCarded] = await Promise.all([
    prisma.player.findMany({
      where: { goals: { gt: 0 }, status: "approved" },
      orderBy: { goals: "desc" },
      take: 15,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.player.findMany({
      where: { assists: { gt: 0 }, status: "approved" },
      orderBy: { assists: "desc" },
      take: 15,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.player.findMany({
      where: { status: "approved", OR: [{ yellowCards: { gt: 0 } }, { redCards: { gt: 0 } }] },
      orderBy: [{ redCards: "desc" }, { yellowCards: "desc" }],
      take: 15,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        team: { select: { id: true, name: true } },
      },
    }),
  ]);

  const Table = ({
    title,
    rows,
    valueLabel,
    value,
  }: {
    title: string;
    rows: typeof topScorers;
    valueLabel: string;
    value: (p: (typeof topScorers)[number]) => React.ReactNode;
  }) => (
    <section className="site-card bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
              <th className="pb-3 px-2 w-10">#</th>
              <th className="pb-3 px-2">Joueur</th>
              <th className="pb-3 px-2">Équipe</th>
              <th className="pb-3 px-2 text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p, i) => (
              <tr key={p.id} className="group hover:bg-gray-50/80 transition-colors">
                <td className="py-3 px-2 font-semibold text-gray-400">{i + 1}</td>
                <td className="py-3 px-2">
                  <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                    {/* Photo du joueur avec fallback */}
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
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
                    <span className="font-semibold text-gray-800 transition-colors group-hover:text-brand-600 group-hover:underline">
                      {p.firstName} {p.lastName}
                    </span>
                  </Link>
                </td>
                <td className="py-3 px-2 text-gray-600 font-medium">{p.team.name}</td>
                <td className="py-3 px-2 text-right font-extrabold text-ink">{value(p)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs font-medium text-gray-400">
                  Aucune donnée disponible pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <main className="relative z-10 mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink tracking-tight">Classements individuels</h1>
      <Table title="Meilleurs buteurs" rows={topScorers} valueLabel="Buts" value={(p) => p.goals} />
      <Table title="Meilleurs passeurs" rows={topAssists} valueLabel="Passes D." value={(p) => p.assists} />
      <Table
        title="Disciplines & Cartons"
        rows={mostCarded}
        valueLabel="🟨 / 🟥"
        value={(p) => `${p.yellowCards} / ${p.redCards}`}
      />
    </main>
  );
}