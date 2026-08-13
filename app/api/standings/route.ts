import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const standings = await prisma.standing.findMany({
    include: {
      team: {
        include: {
          university: true, // <-- Récupère les informations de l'université (dont le logo)
        },
      },
    },
    orderBy: [{ group: "asc" }, { points: "desc" }, { goalDifference: "desc" }],
  });

  return NextResponse.json(standings);
}