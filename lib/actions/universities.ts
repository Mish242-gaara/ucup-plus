"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadImage, deleteImage } from "@/lib/blob";

const universitySchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1).max(10),
  colors: z.string().optional(),
  city: z.string().optional(),
  foundedYear: z.coerce.number().int().optional(),
  description: z.string().optional(),
});

export async function createUniversity(formData: FormData) {
  await requireAdmin();

  const parsed = universitySchema.parse({
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    colors: formData.get("colors") || undefined,
    city: formData.get("city") || undefined,
    foundedYear: formData.get("foundedYear") || undefined,
    description: formData.get("description") || undefined,
  });

  const logo = await uploadImage(formData.get("logo") as File | null, "universities");

  const university = await prisma.university.create({ data: { ...parsed, logo } });
  await logAudit("university.create", "university", university.id, { name: parsed.name });
  revalidatePath("/admin/universities");
}

export async function updateUniversity(id: number, formData: FormData) {
  await requireAdmin();

  const parsed = universitySchema.parse({
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    colors: formData.get("colors") || undefined,
    city: formData.get("city") || undefined,
    foundedYear: formData.get("foundedYear") || undefined,
    description: formData.get("description") || undefined,
  });

  const existing = await prisma.university.findUnique({ where: { id } });
  const removed = formData.get("logo-removed") === "1";
  const newLogo = await uploadImage(formData.get("logo") as File | null, "universities");

  let logo = existing?.logo ?? null;
  if (newLogo) {
    await deleteImage(existing?.logo);
    logo = newLogo;
  } else if (removed) {
    await deleteImage(existing?.logo);
    logo = null;
  }

  await prisma.university.update({ where: { id }, data: { ...parsed, logo } });
  await logAudit("university.update", "university", id, { name: parsed.name });
  revalidatePath("/admin/universities");
}

export async function deleteUniversity(id: number) {
  await requireAdmin();
  const university = await prisma.university.findUnique({ where: { id } });
  await deleteImage(university?.logo);
  await prisma.university.delete({ where: { id } });
  await logAudit("university.delete", "university", id, { name: university?.name });
  revalidatePath("/admin/universities");
}
