import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, formatElapsed } from "@/lib/elapsed-time";
import MatchCentre from "@/components/MatchCentre";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id: Number(id) },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!match) return { title: "Match introuvable — UCUP 2026" };

  const scoreLabel = match.status === "scheduled" ? "vs" : `${match.homeScore} - ${match.awayScore}`;
  const title = `${match.homeTeam.name} ${scoreLabel} ${match.awayTeam.name} — UCUP 2026`;
  const description = [match.round, match.venue].filter(Boolean).join(" · ") || "UCUP 2026";

  return { title, description, openGraph: { title, description } };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { university: true } },
      awayTeam: { include: { university: true } },
      events: {
        orderBy: [{ minute: "asc" }, { id: "asc" }],
        include: { player: true, assistPlayer: true, outPlayer: true, team: true },
      },
      matchLineups: { include: { player: true } },
      commentary: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
    },
  });

  if (!match) notFound();

  const h2hMatches = await prisma.match.findMany({
    where: {
      status: "finished",
      id: { not: matchId },
      OR: [
        { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
        { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
      ],
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "desc" },
    take: 5,
  });

  const h2h = h2hMatches.map((m) => ({
    id: m.id,
    matchDate: m.matchDate.toISOString(),
    homeTeamName: m.homeTeam.name,
    awayTeamName: m.awayTeam.name,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));

  const h2hSummary = h2hMatches.reduce(
    (acc, m) => {
      const homeIsCurrentHome = m.homeTeamId === match.homeTeamId;
      const currentHomeScore = homeIsCurrentHome ? m.homeScore : m.awayScore;
      const currentAwayScore = homeIsCurrentHome ? m.awayScore : m.homeScore;
      if (currentHomeScore > currentAwayScore) acc.homeWins++;
      else if (currentAwayScore > currentHomeScore) acc.awayWins++;
      else acc.draws++;
      return acc;
    },
    { homeWins: 0, awayWins: 0, draws: 0 }
  );

  const elapsedSeconds = getElapsedSeconds(match);
  const homeLineups = match.matchLineups.filter((l) => l.teamId === match.homeTeamId);
  const awayLineups = match.matchLineups.filter((l) => l.teamId === match.awayTeamId);

  const mapLineup = (l: (typeof match.matchLineups)[number]) => ({
    playerId: l.playerId,
    playerName: `${l.player.firstName} ${l.player.lastName}`,
    jerseyNumber: l.player.jerseyNumber,
    position: l.position,
    orderKey: l.orderKey,
    role: l.role,
  });

  const initialData = {
    status: match.status,
    round: match.round,
    group: match.group,
    venue: match.venue,
    referee: match.referee,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeTeam: {
      name: match.homeTeam.name,
      logo: match.homeTeam.university.logo,
      formation: match.homeFormation,
      compositionReady: match.homeCompositionReady,
    },
    awayTeam: {
      name: match.awayTeam.name,
      logo: match.awayTeam.university.logo,
      formation: match.awayFormation,
      compositionReady: match.awayCompositionReady,
    },
    elapsedSeconds,
    formattedTime: formatElapsed(elapsedSeconds),
    isPaused: Boolean(match.timerPausedAt),
    additionalTimeFirstHalf: match.additionalTimeFirstHalf,
    additionalTimeSecondHalf: match.additionalTimeSecondHalf,
    isExtraTime: match.isExtraTime,
    isPenaltyShootout: match.isPenaltyShootout,
    stats: {
      possession: [match.homePossession ?? 50, match.awayPossession ?? 50] as [number, number],
      shots: [match.homeShots, match.awayShots] as [number, number],
      shotsOnTarget: [match.homeShotsOnTarget ?? 0, match.awayShotsOnTarget ?? 0] as [number, number],
      corners: [match.homeCorners, match.awayCorners] as [number, number],
      fouls: [match.homeFouls, match.awayFouls] as [number, number],
      offsides: [match.homeOffsides, match.awayOffsides] as [number, number],
      saves: [match.homeSaves, match.awaySaves] as [number, number],
      freeKicks: [match.homeFreeKicks, match.awayFreeKicks] as [number, number],
      throwIns: [match.homeThrowIns, match.awayThrowIns] as [number, number],
      goalkicks: [match.homeGoalkicks, match.awayGoalkicks] as [number, number],
      penalties: [match.homePenalties, match.awayPenalties] as [number, number],
      yellowCards: [match.homeYellowCards, match.awayYellowCards] as [number, number],
      redCards: [match.homeRedCards, match.awayRedCards] as [number, number],
    },
    events: match.events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      minute: e.minute,
      additionalTime: e.additionalTime,
      teamId: e.teamId,
      team: e.team.name,
      player: `${e.player.firstName} ${e.player.lastName}`,
      assistPlayer: e.assistPlayer ? `${e.assistPlayer.firstName} ${e.assistPlayer.lastName}` : null,
      outPlayer: e.outPlayer ? `${e.outPlayer.firstName} ${e.outPlayer.lastName}` : null,
    })),
    commentary: match.commentary.map((c) => ({ id: c.id, minute: c.minute, text: c.text })),
    lineups: {
      home: {
        starters: homeLineups.filter((l) => l.role === "starter").map(mapLineup),
        substitutes: homeLineups.filter((l) => l.role === "substitute").map(mapLineup),
      },
      away: {
        starters: awayLineups.filter((l) => l.role === "starter").map(mapLineup),
        substitutes: awayLineups.filter((l) => l.role === "substitute").map(mapLineup),
      },
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <MatchCentre matchId={match.id} initialData={initialData} h2h={h2h} h2hSummary={h2hSummary} />
    </main>
  );
}
