import { Shield, Shirt, CalendarDays, Goal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TeamsExplorer from "@/components/TeamsExplorer";

export const dynamic = "force-dynamic";

export const metadata = { title: "Équipes — UCUP 2026" };

export default async function TeamsPage() {
  const [teams, standings, playerCounts, matchCounts] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: { university: true },
    }),
    prisma.standing.findMany(),
    prisma.player.groupBy({ by: ["teamId"], where: { status: "approved" }, _count: { id: true } }),
    prisma.match.findMany({ select: { homeTeamId: true, awayTeamId: true, status: true } }),
  ]);

  const groupByTeam = new Map(standings.map((s) => [s.teamId, s.group]));
  const playerCountByTeam = new Map(playerCounts.map((p) => [p.teamId, p._count.id]));
  const matchCountByTeam = new Map<number, number>();
  for (const m of matchCounts) {
    matchCountByTeam.set(m.homeTeamId, (matchCountByTeam.get(m.homeTeamId) ?? 0) + 1);
    matchCountByTeam.set(m.awayTeamId, (matchCountByTeam.get(m.awayTeamId) ?? 0) + 1);
  }

  const teamRows = teams.map((t) => ({
    id: t.id,
    name: t.name,
    university: { name: t.university.name, logo: t.university.logo },
    group: groupByTeam.get(t.id) ?? null,
    playerCount: playerCountByTeam.get(t.id) ?? 0,
    matchCount: matchCountByTeam.get(t.id) ?? 0,
  }));

  const totalPlayers = playerCounts.reduce((sum, p) => sum + p._count.id, 0);
  const matchesPlayed = matchCounts.filter((m) => m.status === "finished").length;
  const goalsFor = standings.reduce((sum, s) => sum + s.goalsFor, 0);
  const goalsAgainst = standings.reduce((sum, s) => sum + s.goalsAgainst, 0);

  const heroStats = [
    { icon: Shield, value: teams.length, label: "Équipes" },
    { icon: Shirt, value: totalPlayers, label: "Joueurs" },
    { icon: Goal, value: matchesPlayed, label: "Matchs joués" },
    { icon: CalendarDays, value: 2026, label: "Édition" },
  ];

  return (
    <main>
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-ink px-4 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">ÉQUIPES</h1>
            <div className="mt-2 h-1 w-16 bg-brand-400" />
            <p className="mt-3 max-w-md text-sm text-brand-100">
              Découvrez toutes les équipes participantes à l&apos;UCUP 2026. Cliquez sur une équipe
              pour voir ses détails, effectif et statistiques.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3">
                <s.icon size={22} className="text-brand-200" />
                <div>
                  <p className="text-xl font-extrabold leading-none">{s.value}</p>
                  <p className="text-xs text-brand-100">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <TeamsExplorer
          teams={teamRows}
          overview={{ totalPlayers, matchesPlayed, goalsFor, goalsAgainst }}
        />
      </div>
    </main>
  );
}
