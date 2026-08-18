
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function voteMatch(matchId: number, choice: "home" | "draw" | "away") {
  if (matchId == null) return { error: "ID du match manquant" };

  const updateData = {
    home: { homeVotes: { increment: 1 } },
    draw: { drawVotes: { increment: 1 } },
    away: { awayVotes: { increment: 1 } },
  }[choice];

  await prisma.match.update({
    where: { id: matchId },
    data: updateData,
  });

  revalidatePath("/");
  return { success: true };
}