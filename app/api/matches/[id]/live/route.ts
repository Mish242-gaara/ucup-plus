import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, formatElapsed } from "@/lib/elapsed-time";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = Number(id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "ID de match invalide" }, { status: 400 });
    }

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

    if (!match) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const elapsedSeconds = getElapsedSeconds(match);

    const homeLineups = match.matchLineups.filter((l) => l.teamId === match.homeTeamId);
    const awayLineups = match.matchLineups.filter((l) => l.teamId === match.awayTeamId);

    const mapLineup = (l: (typeof match.matchLineups)[number]) => ({
      playerId: l.playerId,
      playerName: l.player ? `${l.player.firstName} ${l.player.lastName}` : "Joueur inconnu",
      jerseyNumber: l.player?.jerseyNumber ?? null,
      position: l.position,
      orderKey: l.orderKey,
      role: l.role,
    });

    return NextResponse.json({
      id: match.id,
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
        logo: match.homeTeam.university?.logo ?? null,
        formation: match.homeFormation,
        compositionReady: match.homeCompositionReady,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        logo: match.awayTeam.university?.logo ?? null,
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
        possession: [match.homePossession ?? 50, match.awayPossession ?? 50],
        shots: [match.homeShots ?? 0, match.awayShots ?? 0],
        shotsOnTarget: [match.homeShotsOnTarget ?? 0, match.awayShotsOnTarget ?? 0],
        corners: [match.homeCorners ?? 0, match.awayCorners ?? 0],
        fouls: [match.homeFouls ?? 0, match.awayFouls ?? 0],
        offsides: [match.homeOffsides ?? 0, match.awayOffsides ?? 0],
        saves: [match.homeSaves ?? 0, match.awaySaves ?? 0],
        freeKicks: [match.homeFreeKicks ?? 0, match.awayFreeKicks ?? 0],
        throwIns: [match.homeThrowIns ?? 0, match.awayThrowIns ?? 0],
        goalkicks: [match.homeGoalkicks ?? 0, match.awayGoalkicks ?? 0],
        penalties: [match.homePenalties ?? 0, match.awayPenalties ?? 0],
        yellowCards: [match.homeYellowCards ?? 0, match.awayYellowCards ?? 0],
        redCards: [match.homeRedCards ?? 0, match.awayRedCards ?? 0],
      },
      events: match.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        minute: e.minute,
        additionalTime: e.additionalTime,
        teamId: e.teamId,
        team: e.team.name,
        player: e.player ? `${e.player.firstName} ${e.player.lastName}` : "Joueur inconnu",
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
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur API live match :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération du match." },
      { status: 500 }
    );
  }
}