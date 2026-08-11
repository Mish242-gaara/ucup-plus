"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const teamSchema = z.object({
  universityId: z.coerce.number().int(),
  name: z.string().min(1),
  coach: z.string().optional(),
  captainId: z.coerce.number().int().optional(),
  category: z.string().default("senior"),
  year: z.coerce.number().int(),
});

export async function createTeam(formData: FormData) {
  await requireAdmin();

  const parsed = teamSchema.parse({
    universityId: formData.get("universityId"),
    name: formData.get("name"),
    coach: formData.get("coach") || undefined,
    captainId: formData.get("captainId") || undefined,
    category: formData.get("category") || "senior",
    year: formData.get("year"),
  });

  const team = await prisma.team.create({ data: { ...parsed, captainId: parsed.captainId ?? null } });
  await logAudit("team.create", "team", team.id, { name: parsed.name });
  revalidatePath("/admin/teams");
}

export async function updateTeam(id: number, formData: FormData) {
  await requireAdmin();

  const parsed = teamSchema.parse({
    universityId: formData.get("universityId"),
    name: formData.get("name"),
    coach: formData.get("coach") || undefined,
    captainId: formData.get("captainId") || undefined,
    category: formData.get("category") || "senior",
    year: formData.get("year"),
  });

  await prisma.team.update({ where: { id }, data: { ...parsed, captainId: parsed.captainId ?? null } });
  await logAudit("team.update", "team", id, { name: parsed.name });
  revalidatePath("/admin/teams");
  revalidatePath(`/teams/${id}`);
}

export async function deleteTeam(id: number) {
  await requireAdmin();
  const team = await prisma.team.findUnique({ where: { id } });
  await prisma.team.delete({ where: { id } });
  await logAudit("team.delete", "team", id, { name: team?.name });
  revalidatePath("/admin/teams");
}
