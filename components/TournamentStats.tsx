import { prisma } from "@/lib/prisma";

export default async function TournamentStats() {
  const [totalMatches, finishedMatches, playersCount, goalsAggregate] = await Promise.all([
    prisma.match.count(),
    prisma.match.count({ where: { status: "finished" } }),
    prisma.player.count({ where: { status: "approved" } }),
    prisma.player.aggregate({
      _sum: { goals: true },
    }),
  ]);

  const totalGoals = goalsAggregate._sum.goals ?? 0;
  const avgGoals = finishedMatches > 0 ? (totalGoals / finishedMatches).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="site-card p-4 text-center">
        <p className="text-2xl font-black text-red-600">{totalGoals}</p>
        <p className="text-xs font-medium text-gray-500 uppercase mt-0.5">Buts marqués</p>
      </div>

      <div className="site-card p-4 text-center">
        <p className="text-2xl font-black text-ink">{avgGoals}</p>
        <p className="text-xs font-medium text-gray-500 uppercase mt-0.5">Moyenne / Match</p>
      </div>

      <div className="site-card p-4 text-center">
        <p className="text-2xl font-black text-ink">{finishedMatches}/{totalMatches}</p>
        <p className="text-xs font-medium text-gray-500 uppercase mt-0.5">Matchs joués</p>
      </div>

      <div className="site-card p-4 text-center">
        <p className="text-2xl font-black text-red-600">{playersCount}</p>
        <p className="text-xs font-medium text-gray-500 uppercase mt-0.5">Joueurs Inscrits</p>
      </div>
    </div>
  );
}