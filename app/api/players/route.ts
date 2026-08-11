import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/players?teamId=3
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");

  const players = await prisma.player.findMany({
    where: {
      status: "approved",
      ...(teamId ? { teamId: Number(teamId) } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jerseyNumber: true,
      position: true,
      goals: true,
      assists: true,
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ team: { name: "asc" } }, { lastName: "asc" }],
  });

  return NextResponse.json(players);
}
