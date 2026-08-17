import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import { MatchStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/matches?status=live&group=A
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const group = searchParams.get("group");

    // Construction dynamique du filtre Prisma
    const whereCondition: {
      status?: MatchStatus | { in: MatchStatus[] };
      group?: string;
    } = {};

    if (status === "live") {
      whereCondition.status = { in: ["live", "halftime"] as MatchStatus[] };
    } else if (status) {
      whereCondition.status = status as MatchStatus;
    }

    if (group) {
      whereCondition.group = group;
    }

    const matches = await prisma.match.findMany({
      where: whereCondition,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            university: {
              select: { logo: true },
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            university: {
              select: { logo: true },
            },
          },
        },
      },
      orderBy: { matchDate: status === "finished" ? "desc" : "asc" },
    });

    const withMinute = matches.map((m) => {
      const elapsed = getElapsedSeconds(m);
      return {
        id: m.id,
        status: m.status,
        round: m.round,
        group: m.group,
        matchDate: m.matchDate,
        venue: m.venue,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homeTeam: {
          id: m.homeTeam.id,
          name: m.homeTeam.name,
          logo: m.homeTeam.university?.logo ?? null,
        },
        awayTeam: {
          id: m.awayTeam.id,
          name: m.awayTeam.name,
          logo: m.awayTeam.university?.logo ?? null,
        },
        currentMinute:
          m.status === "live" || m.status === "halftime"
            ? currentMinute(elapsed)
            : null,
        isPaused: Boolean(m.timerPausedAt),
      };
    });

    return NextResponse.json(withMinute, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs :", error);
    return NextResponse.json(
      { error: "Impossible de récupérer la liste des matchs." },
      { status: 500 }
    );
  }
}