"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyMatchUpdate } from "@/lib/realtime";
import { LineupRole } from "@prisma/client";

export type LineupEntryInput = {
  playerId: number;
  role: "starter" | "substitute" | "none";
  position: string;
  orderKey: number;
};

/**
  Efface les caches Next.js et émet un événement temps réel
 */
function refresh(matchId: number) {
  revalidatePath(`/admin/matches/${matchId}/lineup`);
  revalidatePath(`/matches/${matchId}`);
  void notifyMatchUpdate(matchId);
}

/**
  Remplace les compositions d'une équipe pour un match donné et marque la composition comme prête.
 */
export async function saveLineup(
  matchId: number,
  teamId: number,
  entries: LineupEntryInput[]
) {
  await requireAdmin();

  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
  });

  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("L'équipe spécifiée ne fait pas partie de ce match.");
  }

  const isHome = teamId === match.homeTeamId;

  const kept = entries.filter((e) => e.role !== "none");
  const starters = kept.filter((e) => e.role === "starter");

  if (starters.length > 11) {
    throw new Error("Une composition ne peut pas avoir plus de 11 titulaires.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Nettoyage des compositions existantes dans les deux tables
    await tx.matchLineup.deleteMany({ where: { matchId, teamId } });
    await tx.lineup.deleteMany({ where: { matchId, teamId } });

    // 2. Insertion des nouvelles données si disponibles
    if (kept.length > 0) {
      // Table principale : MatchLineup
      await tx.matchLineup.createMany({
        data: kept.map((e) => {
          const roleEnum =
            e.role === "starter" ? LineupRole.starter : LineupRole.substitute;
          const pos = e.position?.trim() || null;

          return {
            matchId,
            teamId,
            playerId: e.playerId,
            role: roleEnum,
            isStarter: e.role === "starter",
            startingPosition: e.role === "starter" ? pos : null,
            position: pos,
            orderKey: e.role === "starter" ? e.orderKey : null,
          };
        }),
      });

      // Table secondaire de compatibilité : Lineup
      await tx.lineup.createMany({
        data: kept.map((e) => ({
          matchId,
          teamId,
          playerId: e.playerId,
          role: e.role,
          matchPosition: e.position?.trim() || null,
        })),
      });
    }

    // 3. Mise à jour du statut de la composition dans le match
    await tx.match.update({
      where: { id: matchId },
      data: isHome
        ? { homeCompositionReady: true }
        : { awayCompositionReady: true },
    });
  });

  refresh(matchId);
}

/**
  Définit ou met à jour la formation tactique (ex: "4-3-3", "4-2-3-1")
 */
export async function setFormation(
  matchId: number,
  teamId: number,
  formation: string
) {
  await requireAdmin();

  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
  });

  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("L'équipe spécifiée ne fait pas partie de ce match.");
  }

  const isHome = teamId === match.homeTeamId;
  const cleanedFormation = formation.trim();

  await prisma.match.update({
    where: { id: matchId },
    data: isHome
      ? { homeFormation: cleanedFormation }
      : { awayFormation: cleanedFormation },
  });

  refresh(matchId);
}

/**
  Réinitialise la composition d'une équipe pour un match donné
 */
export async function resetLineup(matchId: number, teamId: number) {
  await requireAdmin();

  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
  });

  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("L'équipe spécifiée ne fait pas partie de ce match.");
  }

  const isHome = teamId === match.homeTeamId;

  await prisma.$transaction([
    prisma.matchLineup.deleteMany({ where: { matchId, teamId } }),
    prisma.lineup.deleteMany({ where: { matchId, teamId } }),
    prisma.match.update({
      where: { id: matchId },
      data: isHome
        ? { homeCompositionReady: false }
        : { awayCompositionReady: false },
    }),
  ]);

  refresh(matchId);
}