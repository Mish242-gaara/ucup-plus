import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);
    const body = await req.json();
    const { playerId, voterHash } = body ?? {};

    if (!playerId || !voterHash) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const playerIdInt = Number(playerId);
    if (Number.isNaN(matchId) || Number.isNaN(playerIdInt)) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 400 });
    }

    // Check 1: Le match est-il en cours ou fini depuis moins de 30 minutes ?
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    // Autoriser les votes uniquement si le match est en cours ('live')
    // ou s'il s'est terminé il y a moins de 30 minutes
    const now = new Date();
    if (match.status !== "live") {
      if (match.status === "finished") {
        const updated = match.updatedAt;
        if (!updated || now.getTime() - new Date(updated).getTime() > 30 * 60 * 1000) {
          return NextResponse.json({ error: "Les votes sont clos pour ce match" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Les votes ne sont pas ouverts pour ce match" }, { status: 400 });
      }
    }

    // Check 2: Vérifier le double vote
    const existingVote = await prisma.motmVote.findUnique({
      where: {
        matchId_voterHash: {
          matchId,
          voterHash,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "Vous avez déjà voté pour ce match !" },
        { status: 400 }
      );
    }

    // Créer le vote
    await prisma.motmVote.create({
      data: {
        matchId,
        playerId: playerIdInt,
        voterHash,
      },
    });

    return NextResponse.json({ success: true, message: "Vote enregistré !" });
  } catch (error) {
    console.error("Erreur vote MOTM:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du vote" },
      { status: 500 }
    );
  }
}