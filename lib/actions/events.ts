"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyMatchUpdate } from "@/lib/realtime";
import { sendPushToTeamFollowers } from "@/lib/push";

const eventSchema = z.object({
  matchId: z.coerce.number().int(),
  teamId: z.coerce.number().int(),
  playerId: z.coerce.number().int(),
  assistPlayerId: z.coerce.number().int().optional(),
  outPlayerId: z.coerce.number().int().optional(),
  eventType: z.enum([
    "goal",
    "penalty_goal",
    "own_goal",
    "yellow_card",
    "second_yellow",
    "red_card",
    "substitution",
    "substitution_in",
    "substitution_out",
    "injury",
    "penalty_missed",
    "big_chance_missed",
  ]),
  minute: z.coerce.number().int().min(0),
  additionalTime: z.string().optional(),
  description: z.string().optional(),
});

const GOAL_TYPES = new Set(["goal", "penalty_goal"]);

function refresh(matchId: number) {
  revalidatePath(`/admin/matches/${matchId}/live`);
  revalidatePath(`/matches/${matchId}`);
  void notifyMatchUpdate(matchId);
}

export async function addEvent(formData: FormData) {
  await requireAdmin();

  const parsed = eventSchema.parse({
    matchId: formData.get("matchId"),
    teamId: formData.get("teamId"),
    playerId: formData.get("playerId"),
    assistPlayerId: formData.get("assistPlayerId") || undefined,
    outPlayerId: formData.get("outPlayerId") || undefined,
    eventType: formData.get("eventType"),
    minute: formData.get("minute"),
    additionalTime: formData.get("additionalTime") || undefined,
    description: formData.get("description") || undefined,
  });

  const match = await prisma.match.findUniqueOrThrow({ where: { id: parsed.matchId } });

  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.create({ data: parsed });

    if (GOAL_TYPES.has(parsed.eventType)) {
      const isHome = parsed.teamId === match.homeTeamId;
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { homeScore: { increment: 1 } } : { awayScore: { increment: 1 } },
      });
      await tx.player.update({ where: { id: parsed.playerId }, data: { goals: { increment: 1 } } });
      if (parsed.assistPlayerId) {
        await tx.player.update({
          where: { id: parsed.assistPlayerId },
          data: { assists: { increment: 1 } },
        });
      }
    }

    if (parsed.eventType === "own_goal") {
      // Credited to the opposing team's score, but logged under the scoring player's team
      const isHome = parsed.teamId === match.homeTeamId;
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { awayScore: { increment: 1 } } : { homeScore: { increment: 1 } },
      });
    }

    if (parsed.eventType === "yellow_card" || parsed.eventType === "second_yellow") {
      const isHome = parsed.teamId === match.homeTeamId;
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { homeYellowCards: { increment: 1 } } : { awayYellowCards: { increment: 1 } },
      });
      await tx.player.update({ where: { id: parsed.playerId }, data: { yellowCards: { increment: 1 } } });
    }

    if (parsed.eventType === "second_yellow" || parsed.eventType === "red_card") {
      const isHome = parsed.teamId === match.homeTeamId;
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { homeRedCards: { increment: 1 } } : { awayRedCards: { increment: 1 } },
      });
      await tx.player.update({ where: { id: parsed.playerId }, data: { redCards: { increment: 1 } } });
    }
  });

  refresh(parsed.matchId);

  if (GOAL_TYPES.has(parsed.eventType) || parsed.eventType === "own_goal") {
    const scorer = await prisma.player.findUnique({ where: { id: parsed.playerId } });
    const updated = await prisma.match.findUniqueOrThrow({
      where: { id: parsed.matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    const payload = {
      title: `⚽ But ! ${updated.homeTeam.name} ${updated.homeScore} - ${updated.awayScore} ${updated.awayTeam.name}`,
      body: scorer ? `${scorer.firstName} ${scorer.lastName} (${parsed.minute}')` : `${parsed.minute}'`,
      url: `/matches/${parsed.matchId}`,
    };
    await Promise.all([
      sendPushToTeamFollowers(match.homeTeamId, payload),
      sendPushToTeamFollowers(match.awayTeamId, payload),
    ]);
  }
}

export async function deleteEvent(eventId: number) {
  await requireAdmin();

  const event = await prisma.matchEvent.findUniqueOrThrow({ where: { id: eventId } });
  const match = await prisma.match.findUniqueOrThrow({ where: { id: event.matchId } });
  const isHome = event.teamId === match.homeTeamId;

  await prisma.$transaction(async (tx) => {
    if (GOAL_TYPES.has(event.eventType)) {
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { homeScore: { decrement: 1 } } : { awayScore: { decrement: 1 } },
      });
      await tx.player.update({ where: { id: event.playerId }, data: { goals: { decrement: 1 } } });
      if (event.assistPlayerId) {
        await tx.player.update({
          where: { id: event.assistPlayerId },
          data: { assists: { decrement: 1 } },
        });
      }
    }

    if (event.eventType === "own_goal") {
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { awayScore: { decrement: 1 } } : { homeScore: { decrement: 1 } },
      });
    }

    if (event.eventType === "yellow_card" || event.eventType === "second_yellow") {
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { homeYellowCards: { decrement: 1 } } : { awayYellowCards: { decrement: 1 } },
      });
      await tx.player.update({ where: { id: event.playerId }, data: { yellowCards: { decrement: 1 } } });
    }

    if (event.eventType === "second_yellow" || event.eventType === "red_card") {
      await tx.match.update({
        where: { id: match.id },
        data: isHome ? { homeRedCards: { decrement: 1 } } : { awayRedCards: { decrement: 1 } },
      });
      await tx.player.update({ where: { id: event.playerId }, data: { redCards: { decrement: 1 } } });
    }

    await tx.matchEvent.delete({ where: { id: eventId } });
  });

  refresh(match.id);
}

export async function addCommentary(matchId: number, minute: number, text: string) {
  await requireAdmin();
  if (!text.trim()) return;
  await prisma.matchCommentary.create({ data: { matchId, minute, text: text.trim() } });
  refresh(matchId);
}

export async function deleteCommentary(id: number, matchId: number) {
  await requireAdmin();
  await prisma.matchCommentary.delete({ where: { id } });
  refresh(matchId);
}
