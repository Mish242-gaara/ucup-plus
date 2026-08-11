import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true if the action is allowed, false if the caller is over the
 * limit. Backed by a plain Postgres table (no Redis/external service) —
 * fine at this traffic scale; rows older than the window are pruned on
 * every check so the table doesn't grow unbounded.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  await prisma.rateLimitAttempt.deleteMany({ where: { key, createdAt: { lt: windowStart } } });

  const count = await prisma.rateLimitAttempt.count({ where: { key, createdAt: { gte: windowStart } } });
  if (count >= limit) return false;

  await prisma.rateLimitAttempt.create({ data: { key } });
  return true;
}
