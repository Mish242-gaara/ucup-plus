import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`search:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ teams: [], players: [] });
  }

  const [teams, players] = await Promise.all([
    prisma.team.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      include: { university: true },
      take: 5,
    }),
    prisma.player.findMany({
      where: {
        status: "approved",
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        team: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    teams: teams.map((t) => ({ id: t.id, name: t.name, subtitle: t.university.shortName })),
    players: players.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      subtitle: p.team.name,
    })),
  });
}
