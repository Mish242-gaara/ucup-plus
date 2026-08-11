"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recalculateAllStandings } from "@/lib/standings";
import { logAudit } from "@/lib/audit";
import { notifyMatchUpdate } from "@/lib/realtime";

const matchSchema = z.object({
  homeTeamId: z.coerce.number().int(),
  awayTeamId: z.coerce.number().int(),
  matchDate: z.string().min(1),
  venue: z.string().optional(),
  round: z.string().optional(),
  group: z.string().optional(),
  matchType: z.enum(["tournament", "friendly"]).default("tournament"),
  bracketRound: z.coerce.number().int().optional(),
  bracketPosition: z.coerce.number().int().optional(),
});

export async function createMatch(formData: FormData) {
  await requireAdmin();

  const parsed = matchSchema.parse({
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    matchDate: formData.get("matchDate"),
    venue: formData.get("venue") || undefined,
    round: formData.get("round") || undefined,
    group: formData.get("group") || undefined,
    matchType: formData.get("matchType") || "tournament",
    bracketRound: formData.get("bracketRound") || undefined,
    bracketPosition: formData.get("bracketPosition") || undefined,
  });

  const created = await prisma.match.create({
    data: { ...parsed, matchDate: new Date(parsed.matchDate) },
  });
  revalidatePath("/admin/matches");
  await notifyMatchUpdate(created.id);
}

export async function updateMatch(id: number, formData: FormData) {
  await requireAdmin();

  const parsed = matchSchema.parse({
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    matchDate: formData.get("matchDate"),
    venue: formData.get("venue") || undefined,
    round: formData.get("round") || undefined,
    group: formData.get("group") || undefined,
    matchType: formData.get("matchType") || "tournament",
    bracketRound: formData.get("bracketRound") || undefined,
    bracketPosition: formData.get("bracketPosition") || undefined,
  });

  await prisma.match.update({
    where: { id },
    data: { ...parsed, matchDate: new Date(parsed.matchDate) },
  });
  revalidatePath("/admin/matches");
  await notifyMatchUpdate(id);
}

export async function deleteMatch(id: number) {
  await requireAdmin();
  await prisma.match.delete({ where: { id } });
  await logAudit("match.delete", "match", id);
  revalidatePath("/admin/matches");
  await notifyMatchUpdate(id);
}

export async function duplicateMatch(id: number) {
  await requireAdmin();

  const original = await prisma.match.findUniqueOrThrow({ where: { id } });

  const duplicate = await prisma.match.create({
    data: {
      homeTeamId: original.homeTeamId,
      awayTeamId: original.awayTeamId,
      matchDate: original.matchDate,
      venue: original.venue,
      round: original.round,
      group: original.group,
      matchType: original.matchType,
      status: "scheduled",
    },
  });

  revalidatePath("/admin/matches");
  await notifyMatchUpdate(duplicate.id);
}

export async function updateMatchScore(id: number, homeScore: number, awayScore: number) {
  await requireAdmin();

  const match = await prisma.match.update({
    where: { id },
    data: { homeScore, awayScore },
  });

  await logAudit("match.score_update", "match", id, { homeScore, awayScore });

  if (match.status === "finished") {
    await recalculateAllStandings();
  }

  revalidatePath("/admin/matches");
  revalidatePath("/standings");
  await notifyMatchUpdate(id);
}

export async function updateMatchStatus(
  id: number,
  status: "scheduled" | "live" | "halftime" | "finished" | "postponed"
) {
  await requireAdmin();

  const data: { status: typeof status; startTime?: Date } = { status };
  if (status === "live") {
    const current = await prisma.match.findUniqueOrThrow({ where: { id } });
    if (!current.startTime) data.startTime = new Date();
  }

  await prisma.match.update({ where: { id }, data });
  await logAudit("match.status_update", "match", id, { status });

  if (status === "finished") {
    await recalculateAllStandings();
  }

  revalidatePath("/admin/matches");
  revalidatePath("/standings");
  await notifyMatchUpdate(id);
}
