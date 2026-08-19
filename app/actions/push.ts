"use server";

import { prisma } from "@/lib/prisma";

export async function saveSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  preferences: {
    teamId?: string | null;
    notifyGoals: boolean;
    notifyCards: boolean;
    notifyFinal: boolean;
    notifyNews: boolean;
  }
) {
  const { endpoint, keys } = subscription;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      ...preferences,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ...preferences,
    },
  });

  return { success: true };
}