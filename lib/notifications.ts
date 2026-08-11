import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

let client: Resend | null | undefined;

function getResend(): Resend | null {
  if (client !== undefined) return client;
  const key = process.env.RESEND_API_KEY;
  client = key ? new Resend(key) : null;
  return client;
}

async function sendToAdmins(subject: string, html: string) {
  const resend = getResend();
  if (!resend) return; // email notifications disabled — no config, no crash

  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { email: true } });
  if (admins.length === 0) return;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "UCUP 2026 <onboarding@resend.dev>",
      to: admins.map((a) => a.email),
      subject,
      html,
    });
  } catch {
    // Never let a broken email provider break the underlying admin action.
  }
}

export async function notifyAdminsNewRegistration(playerName: string, teamName: string) {
  await sendToAdmins(
    `Nouvelle inscription : ${playerName}`,
    `<p><strong>${playerName}</strong> vient de s'inscrire pour l'équipe <strong>${teamName}</strong>.</p>
     <p>À valider ici : <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/players">/admin/players</a></p>`
  );
}

export async function notifyAdminsMatchLive(homeTeam: string, awayTeam: string, matchId: number) {
  await sendToAdmins(
    `En direct : ${homeTeam} vs ${awayTeam}`,
    `<p>Le match <strong>${homeTeam} vs ${awayTeam}</strong> vient de démarrer.</p>
     <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/matches/${matchId}">Voir le direct</a></p>`
  );
}
