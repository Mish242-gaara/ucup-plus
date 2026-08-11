import Link from "next/link";
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
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">{title}</h2>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="pb-2">#</th>
            <th className="pb-2">Joueur</th>
            <th className="pb-2">Équipe</th>
            <th className="pb-2">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="py-2 text-gray-400">{i + 1}</td>
              <td className="py-2">
                <Link href={`/players/${p.id}`} className="hover:text-brand-500">
                  {p.firstName} {p.lastName}
                </Link>
              </td>
              <td className="py-2">{p.team.name}</td>
              <td className="py-2 font-semibold">{value(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink">Classements individuels</h1>
      <Table title="Meilleurs buteurs" rows={topScorers} valueLabel="Buts" value={(p) => p.goals} />
      <Table title="Meilleurs passeurs" rows={topAssists} valueLabel="Passes D." value={(p) => p.assists} />
      <Table
        title="Cartons"
        rows={mostCarded}
        valueLabel="🟨 / 🟥"
        value={(p) => `${p.yellowCards} / ${p.redCards}`}
      />
    </main>
  );
}