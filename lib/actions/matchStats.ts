"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyMatchUpdate } from "@/lib/realtime";
import { STAT_FIELDS, type StatField } from "@/lib/statFields";

function columnFor(side: "home" | "away", field: StatField) {
  const capitalized = field.charAt(0).toUpperCase() + field.slice(1);
  return `${side}${capitalized}`;
}


function refresh(matchId: number) {
  revalidatePath(`/admin/matches/${matchId}/live`);
  revalidatePath(`/matches/${matchId}`);
  void notifyMatchUpdate(matchId);
}

/** Quick +1 / -1 button handler for a single stat, one team. */
export async function bumpMatchStat(matchId: number, side: "home" | "away", field: StatField, delta: 1 | -1) {
  await requireAdmin();
  const column = columnFor(side, field);

  await prisma.match.update({
    where: { id: matchId },
    data: { [column]: { increment: delta } } as never,
  });

  refresh(matchId);
}

/** Sets possession as a home percentage; away is derived as the complement. */
export async function setPossession(matchId: number, homePercent: number) {
  await requireAdmin();
  const clamped = Math.max(0, Math.min(100, Math.round(homePercent)));

  await prisma.match.update({
    where: { id: matchId },
    data: { homePossession: clamped, awayPossession: 100 - clamped },
  });

  refresh(matchId);
}
