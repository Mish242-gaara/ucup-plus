"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadImage, deleteImage } from "@/lib/blob";
import { notifyPlayersUpdate } from "@/lib/realtime";

const playerSchema = z.object({
  teamId: z.coerce.number().int(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  jerseyNumber: z.coerce.number().int(),
  position: z.string().min(1),
  birthDate: z.string().optional(),
  height: z.coerce.number().int().optional(),
  nationality: z.string().default("DRC"),
});

function baseData(parsed: z.infer<typeof playerSchema>) {
  return {
    ...parsed,
    birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
  };
}

async function assertNoJerseyClash(teamId: number, jerseyNumber: number, excludePlayerId?: number) {
  const clash = await prisma.player.findFirst({
    where: { teamId, jerseyNumber, ...(excludePlayerId ? { id: { not: excludePlayerId } } : {}) },
  });
  if (clash) {
    throw new Error(`Le numéro ${jerseyNumber} est déjà pris dans cette équipe (${clash.firstName} ${clash.lastName}).`);
  }
}

export async function createPlayer(formData: FormData) {
  await requireAdmin();

  const parsed = playerSchema.parse({
    teamId: formData.get("teamId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    birthDate: formData.get("birthDate") || undefined,
    height: formData.get("height") || undefined,
    nationality: formData.get("nationality") || "DRC",
  });

  await assertNoJerseyClash(parsed.teamId, parsed.jerseyNumber);

  const photoFile = formData.get("photo") as File | null;
  const photo = await uploadImage(photoFile, "players");

  const player = await prisma.player.create({ data: { ...baseData(parsed), photo } });
  await logAudit("player.create", "player", player.id, { name: `${parsed.firstName} ${parsed.lastName}` });
  revalidatePath("/admin/players");
  await notifyPlayersUpdate();
}

export async function updatePlayer(id: number, formData: FormData) {
  await requireAdmin();

  const parsed = playerSchema.parse({
    teamId: formData.get("teamId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    birthDate: formData.get("birthDate") || undefined,
    height: formData.get("height") || undefined,
    nationality: formData.get("nationality") || "DRC",
  });

  await assertNoJerseyClash(parsed.teamId, parsed.jerseyNumber, id);

  const existing = await prisma.player.findUnique({ where: { id } });
  const photoFile = formData.get("photo") as File | null;
  const removed = formData.get("photo-removed") === "1";

  let photo = existing?.photo ?? null;
  const newPhoto = await uploadImage(photoFile, "players");
  if (newPhoto) {
    await deleteImage(existing?.photo);
    photo = newPhoto;
  } else if (removed) {
    await deleteImage(existing?.photo);
    photo = null;
  }

  await prisma.player.update({ where: { id }, data: { ...baseData(parsed), photo } });
  await logAudit("player.update", "player", id, { name: `${parsed.firstName} ${parsed.lastName}` });
  revalidatePath("/admin/players");
  revalidatePath(`/players/${id}`);
  revalidatePath("/players");
  await notifyPlayersUpdate();
}

export async function deletePlayer(id: number) {
  await requireAdmin();
  const player = await prisma.player.findUnique({ where: { id } });
  await deleteImage(player?.photo);
  await prisma.player.delete({ where: { id } });
  await logAudit("player.delete", "player", id, {
    name: player ? `${player.firstName} ${player.lastName}` : undefined,
  });
  revalidatePath("/admin/players");
  await notifyPlayersUpdate();
}

export async function setPlayerStatus(id: number, status: "pending" | "approved" | "rejected") {
  await requireAdmin();
  await prisma.player.update({ where: { id }, data: { status } });
  await logAudit(`player.${status}`, "player", id);
  revalidatePath("/admin/players");
  revalidatePath("/players");
  await notifyPlayersUpdate();
}
