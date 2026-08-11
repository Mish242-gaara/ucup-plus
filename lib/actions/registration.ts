"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { notifyAdminsNewRegistration } from "@/lib/notifications";

const registrationSchema = z.object({
  teamId: z.coerce.number().int(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  jerseyNumber: z.coerce.number().int().min(0).max(99),
  position: z.string().min(1),
  birthDate: z.string().optional(),
  height: z.coerce.number().int().optional(),
  nationality: z.string().default("DRC"),
  accessCode: z.string().min(1),
});

export type RegistrationResult = { ok: true } | { ok: false; error: string };

export async function registerPlayer(formData: FormData): Promise<RegistrationResult> {
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`register-player:${ip}`, 5, 60 * 60);
  if (!allowed) {
    return { ok: false, error: "Trop de tentatives. Réessaie dans une heure." };
  }

  const parsed = registrationSchema.safeParse({
    teamId: formData.get("teamId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    birthDate: formData.get("birthDate") || undefined,
    height: formData.get("height") || undefined,
    nationality: formData.get("nationality") || "DRC",
    accessCode: formData.get("accessCode"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Merci de vérifier les champs du formulaire." };
  }

  // Anti-abuse gate: only people who received the code from the organizers/coaches
  // can submit a request at all. This does not bypass admin approval below.
  const expectedCode = process.env.REGISTRATION_CODE;
  if (!expectedCode || parsed.data.accessCode !== expectedCode) {
    return { ok: false, error: "Code d'accès invalide. Demande-le à ton entraîneur ou à l'organisation." };
  }

  const { teamId, jerseyNumber, birthDate, accessCode: _accessCode, ...rest } = parsed.data;

  const clash = await prisma.player.findFirst({ where: { teamId, jerseyNumber } });
  if (clash) {
    return { ok: false, error: `Le numéro ${jerseyNumber} est déjà pris dans cette équipe.` };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });

  await prisma.player.create({
    data: {
      ...rest,
      teamId,
      jerseyNumber,
      birthDate: birthDate ? new Date(birthDate) : null,
      status: "pending", // requires admin approval before appearing publicly
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: `public:${ip}`,
      action: "player.register",
      entityType: "player",
      detail: JSON.stringify({ teamId, firstName: rest.firstName, lastName: rest.lastName }),
    },
  });

  await notifyAdminsNewRegistration(`${rest.firstName} ${rest.lastName}`, team?.name ?? "équipe inconnue");

  revalidatePath("/admin/players");
  return { ok: true };
}
