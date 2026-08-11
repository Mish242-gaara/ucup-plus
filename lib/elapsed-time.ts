import type { Match } from "@prisma/client";

/**
 * Computes the live elapsed time in seconds for a match.
 * Mirrors MatchModel::getElapsedTime() in the Laravel app:
 * - if the timer isn't running (no start_time, paused, or not live) -> just the stored base
 * - if running -> base + seconds since start_time
 */
export function getElapsedSeconds(match: Pick<Match, "elapsedTime" | "startTime" | "timerPausedAt" | "status">) {
  const base = match.elapsedTime ?? 0;

  if (!match.startTime || match.timerPausedAt || match.status !== "live") {
    return Math.max(0, base);
  }

  const runningSeconds = Math.floor((Date.now() - new Date(match.startTime).getTime()) / 1000);
  return Math.max(0, base + runningSeconds);
}

export function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function currentMinute(seconds: number) {
  return Math.floor(seconds / 60);
}
