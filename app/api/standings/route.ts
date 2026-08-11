import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const standings = await prisma.standing.findMany({
    include: { team: true },
    orderBy: [{ group: "asc" }, { points: "desc" }, { goalDifference: "desc" }],
  });
  return NextResponse.json(standings);
}
