import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, createPending2FA } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`login:${ip}`, 5, 10 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  if (user.twoFactorConfirmedAt) {
    await createPending2FA(user.id);
    return NextResponse.json({ requiresTwoFactor: true });
  }

  await createSession({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin });
}
