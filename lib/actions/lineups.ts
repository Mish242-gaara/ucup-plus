"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyMatchUpdate } from "@/lib/realtime";

export type LineupEntryInput = {
  playerId: number;
  role: "starter" | "substitute" | "none";
  position: string;
  orderKey: number;
};

function refresh(matchId: number) {
  revalidatePath(`/admin/matches/${matchId}/lineup`);
  revalidatePath(`/matches/${matchId}`);
  void notifyMatchUpdate(matchId);
}

/**
 * Replaces all match_lineups rows for one team in one match with the given
 * entries, and marks that side's composition as ready.
 * Mirrors LiveMatchController::updateLineup() in the Laravel app.
 */
export async function saveLineup(matchId: number, teamId: number, entries: LineupEntryInput[]) {
  await requireAdmin();

  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const isHome = teamId === match.homeTeamId;

  const kept = entries.filter((e) => e.role !== "none");
  const starters = kept.filter((e) => e.role === "starter");

  if (starters.length > 11) {
    throw new Error("Une composition ne peut pas avoir plus de 11 titulaires.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchLineup.deleteMany({ where: { matchId, teamId } });

    if (kept.length > 0) {
      await tx.matchLineup.createMany({
        data: kept.map((e) => ({
          matchId,
          teamId,
          playerId: e.playerId,
          role: e.role as "starter" | "substitute",
          isStarter: e.role === "starter",
          startingPosition: e.role === "starter" ? e.position || null : null,
          position: e.position || null,
          orderKey: e.role === "starter" ? e.orderKey : null,
        })),
      });
    }

    await tx.match.update({
      where: { id: matchId },
      data: isHome ? { homeCompositionReady: true } : { awayCompositionReady: true },
    });
  });

  refresh(matchId);
}

export async function setFormation(matchId: number, teamId: number, formation: string) {
  await requireAdmin();

  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const isHome = teamId === match.homeTeamId;

  await prisma.match.update({
    where: { id: matchId },
    data: isHome ? { homeFormation: formation } : { awayFormation: formation },
  });

  refresh(matchId);
}

export async function resetLineup(matchId: number, teamId: number) {
  await requireAdmin();

  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const isHome = teamId === match.homeTeamId;

  await prisma.$transaction([
    prisma.matchLineup.deleteMany({ where: { matchId, teamId } }),
    prisma.match.update({
      where: { id: matchId },
      data: isHome ? { homeCompositionReady: false } : { awayCompositionReady: false },
    }),
  ]);

  refresh(matchId);
}
