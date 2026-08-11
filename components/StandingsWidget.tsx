import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StandingsWidget() {
  const standings = await prisma.standing.findMany({
    include: { team: true },
    orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
  });

  const firstGroup = standings.length > 0 ? standings[0].group ?? "—" : null;
  const rows = firstGroup ? standings.filter((s) => (s.group ?? "—") === firstGroup).slice(0, 5) : [];

  return (
    <div className="site-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
          Classement {firstGroup ? `— Groupe ${firstGroup}` : ""}
        </h2>
        <Link href="/standings" className="text-xs font-semibold text-brand-500 hover:underline">
          Voir tout
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">Classement pas encore disponible.</p>
      ) : (
        <table className="mt-3 w-full text-left text-xs">
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="py-1.5 pr-1">
                  <span className={`block h-3 w-1 rounded-full ${i < 2 ? "bg-green-500" : "bg-transparent"}`} />
                </td>
                <td className="py-1.5 pr-2 font-bold text-gray-400">{i + 1}</td>
                <td className="py-1.5 font-semibold text-ink">{s.team.name}</td>
                <td className="py-1.5 pl-2 text-right font-bold text-brand-500">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
