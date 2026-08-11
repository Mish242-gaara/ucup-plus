"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateTotpSecret, verifyTotp, generateRecoveryCodes, buildOtpAuthUrl, qrCodeImageUrl } from "@/lib/totp";

async function currentUser() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
}

/** Step 1: generate a new (unconfirmed) secret and return the QR code to scan. */
export async function startTwoFactorSetup() {
  const user = await currentUser();
  const secret = generateTotpSecret();

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, twoFactorConfirmedAt: null, twoFactorRecoveryCodes: null },
  });

  const otpAuthUrl = buildOtpAuthUrl(secret, user.email);
  return { secret, qrCodeUrl: qrCodeImageUrl(otpAuthUrl) };
}

/** Step 2: confirm setup with a code from the authenticator app. */
export async function confirmTwoFactorSetup(code: string) {
  const user = await currentUser();
  if (!user.twoFactorSecret) throw new Error("Aucune configuration 2FA en cours.");

  if (!verifyTotp(user.twoFactorSecret, code)) {
    throw new Error("Code invalide.");
  }

  const recoveryCodes = generateRecoveryCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorConfirmedAt: new Date(),
      twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
    },
  });

  revalidatePath("/admin/account/2fa");
  return { recoveryCodes };
}

export async function disableTwoFactor() {
  const user = await currentUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: null, twoFactorConfirmedAt: null, twoFactorRecoveryCodes: null },
  });
  revalidatePath("/admin/account/2fa");
}
