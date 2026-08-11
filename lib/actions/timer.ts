"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getElapsedSeconds } from "@/lib/elapsed-time";
import { notifyMatchUpdate } from "@/lib/realtime";
import { notifyAdminsMatchLive } from "@/lib/notifications";
import { sendPushToTeamFollowers } from "@/lib/push";

async function refresh(id: number) {
  revalidatePath(`/admin/matches/${id}/live`);
  revalidatePath(`/matches/${id}`);
  await notifyMatchUpdate(id);
}

/** Status -> LIVE: start_time = now, timer starts running */
export async function startTimer(matchId: number) {
  await requireAdmin();
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { status: "live", startTime: new Date(), timerPausedAt: null },
    include: { homeTeam: true, awayTeam: true },
  });
  await refresh(matchId);
  await notifyAdminsMatchLive(match.homeTeam.name, match.awayTeam.name, matchId);

  const pushPayload = {
    title: `⚽ ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    body: "Le match vient de démarrer — suis le direct sur UCUP 2026 !",
    url: `/matches/${matchId}`,
  };
  await Promise.all([
    sendPushToTeamFollowers(match.homeTeamId, pushPayload),
    sendPushToTeamFollowers(match.awayTeamId, pushPayload),
  ]);
}

/** Freeze the timer: fold elapsed running time into elapsed_time, mark paused */
export async function pauseTimer(matchId: number) {
  await requireAdmin();
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const elapsed = getElapsedSeconds(match);

  await prisma.match.update({
    where: { id: matchId },
    data: { elapsedTime: elapsed, timerPausedAt: new Date() },
  });
  await refresh(matchId);
}

/** Resume: restart start_time from now, keep accumulated elapsed_time as base */
export async function resumeTimer(matchId: number) {
  await requireAdmin();
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "live", startTime: new Date(), timerPausedAt: null },
  });
  await refresh(matchId);
}

/** Stop for good (finished): freeze elapsed_time and recalc standings */
export async function stopTimer(matchId: number) {
  await requireAdmin();
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const elapsed = getElapsedSeconds(match);

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "finished", elapsedTime: elapsed, timerPausedAt: new Date() },
  });

  const { recalculateAllStandings } = await import("@/lib/standings");
  await recalculateAllStandings();

  await refresh(matchId);
  revalidatePath("/standings");
}

export async function addAdditionalTime(matchId: number, half: "first" | "second", minutes: number) {
  await requireAdmin();
  await prisma.match.update({
    where: { id: matchId },
    data:
      half === "first"
        ? { additionalTimeFirstHalf: { increment: minutes } }
        : { additionalTimeSecondHalf: { increment: minutes } },
  });
  await refresh(matchId);
}

export async function setExtraTime(matchId: number, enabled: boolean) {
  await requireAdmin();
  await prisma.match.update({ where: { id: matchId }, data: { isExtraTime: enabled } });
  await refresh(matchId);
}

export async function setPenaltyShootout(matchId: number, enabled: boolean) {
  await requireAdmin();
  await prisma.match.update({ where: { id: matchId }, data: { isPenaltyShootout: enabled } });
  await refresh(matchId);
}
