import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, formatElapsed } from "@/lib/elapsed-time";
import MatchCentre from "@/components/MatchCentre";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id: Number(id) },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!match) return { title: "Match introuvable — UCUP 2026" };

  const scoreLabel =
    match.status === "scheduled"
      ? "vs"
      : `${match.homeScore} - ${match.awayScore}`;
  const title = `${match.homeTeam.name} ${scoreLabel} ${match.awayTeam.name} — UCUP 2026`;
  const description =
    [match.round, match.venue].filter(Boolean).join(" · ") || "UCUP 2026";

  return { title, description, openGraph: { title, description } };
}

type MatchResult = "V" | "N" | "D";

function getMatchResultForTeam(
  match: { homeTeamId: number; awayTeamId: number; homeScore: number | null; awayScore: number | null },
  teamId: number
): MatchResult | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  const isHome = match.homeTeamId === teamId;
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  if (teamScore > opponentScore) return "V";
  if (teamScore === opponentScore) return "N";
  return "D";
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);

  if (isNaN(matchId)) notFound();

  // 1. Récupération du match principal
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

  // 2. Requêtes de données pour le H2H et la forme récente des deux équipes
  const [h2hMatches, homeRecentMatches, awayRecentMatches] = await Promise.all([
    prisma.match.findMany({
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
      take: 10,
    }),
    prisma.match.findMany({
      where: {
        status: "finished",
        id: { not: matchId },
        OR: [{ homeTeamId: match.homeTeamId }, { awayTeamId: match.homeTeamId }],
      },
      orderBy: { matchDate: "desc" },
      take: 5,
    }),
    prisma.match.findMany({
      where: {
        status: "finished",
        id: { not: matchId },
        OR: [{ homeTeamId: match.awayTeamId }, { awayTeamId: match.awayTeamId }],
      },
      orderBy: { matchDate: "desc" },
      take: 5,
    }),
  ]);

  // 3. Calcul de la forme récente (Series)
  const homeFormRecent: MatchResult[] = homeRecentMatches
    .map((m) => getMatchResultForTeam(m, match.homeTeamId))
    .filter((res): res is MatchResult => res !== null)
    .reverse();

  const awayFormRecent: MatchResult[] = awayRecentMatches
    .map((m) => getMatchResultForTeam(m, match.awayTeamId))
    .filter((res): res is MatchResult => res !== null)
    .reverse();

  const calculateFormPoints = (form: MatchResult[]) =>
    form.reduce((acc, r) => acc + (r === "V" ? 3 : r === "N" ? 1 : 0), 0);

  const homeFormPoints = calculateFormPoints(homeFormRecent);
  const awayFormPoints = calculateFormPoints(awayFormRecent);

  // 4. Calcul de l'historique direct (H2H Summary)
  const h2hSummary = h2hMatches.reduce(
    (acc, m) => {
      const homeIsCurrentHome = m.homeTeamId === match.homeTeamId;
      const currentHomeScore = homeIsCurrentHome ? m.homeScore : m.awayScore;
      const currentAwayScore = homeIsCurrentHome ? m.awayScore : m.homeScore;

      if (currentHomeScore !== null && currentAwayScore !== null) {
        if (currentHomeScore > currentAwayScore) acc.homeWins++;
        else if (currentAwayScore > currentHomeScore) acc.awayWins++;
        else acc.draws++;
      }
      return acc;
    },
    { homeWins: 0, awayWins: 0, draws: 0 }
  );

  // 5. Algorithme simple de probabilités (Forme 60% + H2H 40% + Avantage domicile)
  const maxFormPoints = 15;
  const homeFormRating = homeFormPoints / maxFormPoints;
  const awayFormRating = awayFormPoints / maxFormPoints;

  const totalH2H = h2hMatches.length;
  const homeH2HRating = totalH2H > 0 ? h2hSummary.homeWins / totalH2H : 0.33;
  const awayH2HRating = totalH2H > 0 ? h2hSummary.awayWins / totalH2H : 0.33;
  const drawH2HRating = totalH2H > 0 ? h2hSummary.draws / totalH2H : 0.34;

  const rawHome = homeFormRating * 0.6 + homeH2HRating * 0.4 + 0.05; // +5% domicile
  const rawAway = awayFormRating * 0.6 + awayH2HRating * 0.4;
  const rawDraw = 0.25 + drawH2HRating * 0.15;

  const totalRaw = rawHome + rawAway + rawDraw;

  const homeWinProb = Math.round((rawHome / totalRaw) * 100);
  const awayWinProb = Math.round((rawAway / totalRaw) * 100);
  const drawProb = 100 - homeWinProb - awayWinProb;

  // 6. Formatage des données H2H basiques
  const h2h = h2hMatches.slice(0, 5).map((m) => ({
    id: m.id,
    matchDate: m.matchDate.toISOString(),
    homeTeamName: m.homeTeam.name,
    awayTeamName: m.awayTeam.name,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));

  const h2hAdvanced = {
    homeForm: { recent: homeFormRecent, points: homeFormPoints },
    awayForm: { recent: awayFormRecent, points: awayFormPoints },
    probabilities: {
      homeWin: homeWinProb,
      draw: drawProb,
      awayWin: awayWinProb,
    },
    h2hSummary: {
      ...h2hSummary,
      totalMatches: totalH2H,
    },
  };

  const elapsedSeconds = getElapsedSeconds(match);
  const homeLineups = match.matchLineups.filter(
    (l) => l.teamId === match.homeTeamId
  );
  const awayLineups = match.matchLineups.filter(
    (l) => l.teamId === match.awayTeamId
  );

  const mapLineup = (l: (typeof match.matchLineups)[number]) => ({
    playerId: l.playerId,
    playerName: `${l.player.firstName} ${l.player.lastName}`,
    jerseyNumber: l.player.jerseyNumber,
    position: l.position || l.startingPosition,
    orderKey: l.orderKey,
    role: l.role,
    photo: l.player.photo || l.player.photoPath || null,
  });

  const commentaryEntries = (match.commentary ?? []) as {
    id: number;
    minute: number;
    text: string;
  }[];

  const initialData = {
    status: match.status,
    round: match.round,
    group: match.group,
    venue: match.venue,
    referee: match.referee,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      logo: match.homeTeam.university.logo,
      formation: match.homeFormation,
      compositionReady: match.homeCompositionReady,
    },
    awayTeam: {
      id: match.awayTeam.id,
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
    isExtraTime: Boolean(match.isExtraTime),
    isPenaltyShootout: Boolean(match.isPenaltyShootout),
    stats: {
      possession: [
        match.homePossession ?? 50,
        match.awayPossession ?? 50,
      ] as [number, number],
      shots: [match.homeShots, match.awayShots] as [number, number],
      shotsOnTarget: [
        match.homeShotsOnTarget ?? 0,
        match.awayShotsOnTarget ?? 0,
      ] as [number, number],
      corners: [match.homeCorners, match.awayCorners] as [number, number],
      fouls: [match.homeFouls, match.awayFouls] as [number, number],
      offsides: [match.homeOffsides, match.awayOffsides] as [number, number],
      saves: [match.homeSaves, match.awaySaves] as [number, number],
      freeKicks: [match.homeFreeKicks, match.awayFreeKicks] as [number, number],
      throwIns: [match.homeThrowIns, match.awayThrowIns] as [number, number],
      goalkicks: [match.homeGoalkicks, match.awayGoalkicks] as [number, number],
      penalties: [match.homePenalties, match.awayPenalties] as [number, number],
      yellowCards: [
        match.homeYellowCards,
        match.awayYellowCards,
      ] as [number, number],
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
      assistPlayer: e.assistPlayer
        ? `${e.assistPlayer.firstName} ${e.assistPlayer.lastName}`
        : null,
      outPlayer: e.outPlayer
        ? `${e.outPlayer.firstName} ${e.outPlayer.lastName}`
        : null,
    })),
    commentary: commentaryEntries.map((c) => ({
      id: c.id,
      minute: c.minute,
      text: c.text,
    })),
    lineups: {
      home: {
        starters: homeLineups
          .filter((l) => l.role === "starter")
          .map(mapLineup),
        substitutes: homeLineups
          .filter((l) => l.role === "substitute")
          .map(mapLineup),
      },
      away: {
        starters: awayLineups
          .filter((l) => l.role === "starter")
          .map(mapLineup),
        substitutes: awayLineups
          .filter((l) => l.role === "substitute")
          .map(mapLineup),
      },
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <MatchCentre
        matchId={match.id}
        initialData={initialData}
        h2h={h2h}
        h2hSummary={h2hSummary}
        h2hAdvanced={h2hAdvanced}
      />
    </main>
  );
}