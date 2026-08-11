import { prisma } from "@/lib/prisma";
import { notifyStandingsUpdate } from "@/lib/realtime";

/**
 * Recomputes standings for every group from all finished matches.
 * Mirrors StandingService::recalculateAllStandings() in the Laravel app.
 */
export async function recalculateAllStandings() {
  const finishedMatches = await prisma.match.findMany({
    where: { status: "finished", group: { not: null } },
  });

  type Row = {
    teamId: number;
    group: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };

  const table = new Map<string, Row>();

  const ensureRow = (teamId: number, group: string) => {
    const key = `${teamId}-${group}`;
    if (!table.has(key)) {
      table.set(key, {
        teamId,
        group,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      });
    }
    return table.get(key)!;
  };

  for (const m of finishedMatches) {
    if (!m.group) continue;

    const home = ensureRow(m.homeTeamId, m.group);
    const away = ensureRow(m.awayTeamId, m.group);

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      away.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
    }
  }

  await prisma.$transaction(
    Array.from(table.values()).map((row) =>
      prisma.standing.upsert({
        where: { teamId_group: { teamId: row.teamId, group: row.group } },
        create: {
          teamId: row.teamId,
          group: row.group,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalsFor - row.goalsAgainst,
          points: row.won * 3 + row.drawn,
        },
        update: {
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalsFor - row.goalsAgainst,
          points: row.won * 3 + row.drawn,
        },
      })
    )
  );

  await notifyStandingsUpdate();
}
