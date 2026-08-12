"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/blob";
import { logAudit } from "@/lib/audit";

export async function getTournamentSettings() {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: 1 } });
  return (
    settings ?? {
      id: 1,
      logo: null,
      organizerName: "Comité d'organisation UCUP 2026",
      organizerSub: null,
      updatedAt: new Date(),
    }
  );
}

export async function updateTournamentSettings(formData: FormData) {
  await requireAdmin();

  const existing = await prisma.tournamentSettings.findUnique({ where: { id: 1 } });
  const removed = formData.get("logo-removed") === "1";
  const newLogo = await uploadImage(formData.get("logo") as File | null, "tournament");

  let logo = existing?.logo ?? null;
  if (newLogo) {
    await deleteImage(existing?.logo);
    logo = newLogo;
  } else if (removed) {
    await deleteImage(existing?.logo);
    logo = null;
  }

  await prisma.tournamentSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      logo,
      organizerName: (formData.get("organizerName") as string) || "Comité d'organisation UCUP 2026",
      organizerSub: (formData.get("organizerSub") as string) || null,
    },
    update: {
      logo,
      organizerName: (formData.get("organizerName") as string) || "Comité d'organisation UCUP 2026",
      organizerSub: (formData.get("organizerSub") as string) || null,
    },
  });

  await logAudit("settings.update", "tournament_settings", 1);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/players");
}

/** Generates and persists a stable license number the first time a player's license is created. */
export async function ensureLicenseNumber(playerId: number): Promise<string> {
  const player = await prisma.player.findUniqueOrThrow({
    where: { id: playerId },
    include: { team: { include: { university: true } } },
  });

  if (player.licenseNumber) return player.licenseNumber;

  const shortName = player.team.university.shortName.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const countInTeam = await prisma.player.count({
    where: { teamId: player.teamId, licenseNumber: { not: null } },
  });
  const sequence = String(countInTeam + 1).padStart(2, "0");
  const licenseNumber = `UCUP2026-${shortName}-${sequence}`;

  await prisma.player.update({ where: { id: playerId }, data: { licenseNumber } });
  return licenseNumber;
}
