import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Forcer le rendu dynamique pour éviter la mise en cache statique par Next.js
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const standings = await prisma.standing.findMany({
      include: {
        team: {
          select: {
            id: true,
            name: true,
            university: {
              select: {
                logo: true,
              },
            },
          },
        },
      },
      orderBy: [
        { group: "asc" },
        { points: "desc" },
        { goalDifference: "desc" },
        { goalsFor: "desc" },
      ],
    });

    return NextResponse.json(standings, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des classements :", error);
    return NextResponse.json(
      { error: "Impossible de charger les classements." },
      { status: 500 }
    );
  }
}