import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import { MatchStatus } from "@prisma/client";

// GET /api/matches?status=live&group=A
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const group = searchParams.get("group");

  const matches = await prisma.match.findMany({
    where: {
      ...(status === "live"
        ? { status: { in: ["live", "halftime"] as MatchStatus[] } }
        : status
        ? { status: status as MatchStatus }
        : {}),
      ...(group ? { group } : {}),
    },
    include: {
      homeTeam: { include: { university: true } },
      awayTeam: { include: { university: true } },
    },
    orderBy: { matchDate: status === "finished" ? "desc" : "asc" },
  });

  const withMinute = matches.map((m) => ({
    ...m,
    currentMinute: m.status === "live" || m.status === "halftime" ? currentMinute(getElapsedSeconds(m)) : null,
  }));

  return NextResponse.json(withMinute);
}