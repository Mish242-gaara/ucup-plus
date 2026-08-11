import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, getPending2FAUserId, clearPending2FA } from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`verify-2fa:${ip}`, 8, 10 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  const userId = await getPending2FAUserId();
  if (!userId) {
    return NextResponse.json({ error: "Session expirée, reconnectez-vous." }, { status: 401 });
  }

  const { code } = await req.json();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA non configurée" }, { status: 400 });
  }

  let ok = verifyTotp(user.twoFactorSecret, String(code ?? ""));

  // Fall back to a one-time recovery code
  if (!ok && user.twoFactorRecoveryCodes) {
    const codes: string[] = JSON.parse(user.twoFactorRecoveryCodes);
    const idx = codes.indexOf(String(code ?? "").trim());
    if (idx !== -1) {
      ok = true;
      codes.splice(idx, 1);
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorRecoveryCodes: JSON.stringify(codes) },
      });
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "Code invalide" }, { status: 401 });
  }

  await clearPending2FA();
  await createSession({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin });
}
