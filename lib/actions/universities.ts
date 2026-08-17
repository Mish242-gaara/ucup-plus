"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadImage, deleteImage } from "@/lib/blob";

// Utilitaire pour nettoyer les valeurs vides issues de FormData
function getOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const universitySchema = z.object({
  name: z.string().min(1, "Le nom officiel est obligatoire"),
  shortName: z
    .string()
    .min(1, "Le sigle est obligatoire")
    .max(10, "Le sigle ne doit pas dépasser 10 caractères"),
  colors: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  foundedYear: z.coerce.number().int().optional(),
  website: z.string().url("Format d'URL invalide").optional(),
  contactEmail: z.string().email("Format d'adresse email invalide").optional(),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  isVerified: z.boolean().default(true),
});

export async function createUniversity(formData: FormData) {
  await requireAdmin();

  const rawData = {
    name: getOptionalString(formData, "name") ?? "",
    shortName: getOptionalString(formData, "shortName") ?? "",
    colors: getOptionalString(formData, "colors"),
    city: getOptionalString(formData, "city"),
    address: getOptionalString(formData, "address"),
    foundedYear: getOptionalString(formData, "foundedYear"),
    website: getOptionalString(formData, "website"),
    contactEmail: getOptionalString(formData, "contactEmail"),
    contactPhone: getOptionalString(formData, "contactPhone"),
    description: getOptionalString(formData, "description"),
    isVerified:
      formData.get("isVerified") === "true" || formData.get("isVerified") === "on",
  };

  const parsed = universitySchema.parse(rawData);

  const logo = await uploadImage(
    formData.get("logo") as File | null,
    "universities"
  );

  const university = await prisma.university.create({
    data: { ...parsed, logo },
  });

  await logAudit("university.create", "university", university.id, {
    name: parsed.name,
  });

  revalidatePath("/admin/universities");
  revalidatePath("/universities");
}

export async function updateUniversity(id: number, formData: FormData) {
  await requireAdmin();

  const rawData = {
    name: getOptionalString(formData, "name") ?? "",
    shortName: getOptionalString(formData, "shortName") ?? "",
    colors: getOptionalString(formData, "colors"),
    city: getOptionalString(formData, "city"),
    address: getOptionalString(formData, "address"),
    foundedYear: getOptionalString(formData, "foundedYear"),
    website: getOptionalString(formData, "website"),
    contactEmail: getOptionalString(formData, "contactEmail"),
    contactPhone: getOptionalString(formData, "contactPhone"),
    description: getOptionalString(formData, "description"),
    isVerified:
      formData.get("isVerified") === "true" || formData.get("isVerified") === "on",
  };

  const parsed = universitySchema.parse(rawData);

  const existing = await prisma.university.findUnique({ where: { id } });
  const removed = formData.get("logo-removed") === "1";
  const newLogo = await uploadImage(
    formData.get("logo") as File | null,
    "universities"
  );

  let logo = existing?.logo ?? null;
  if (newLogo) {
    await deleteImage(existing?.logo);
    logo = newLogo;
  } else if (removed) {
    await deleteImage(existing?.logo);
    logo = null;
  }

  await prisma.university.update({
    where: { id },
    data: { ...parsed, logo },
  });

  await logAudit("university.update", "university", id, { name: parsed.name });

  revalidatePath("/admin/universities");
  revalidatePath(`/admin/universities/${id}/edit`);
  revalidatePath("/universities");
}

export async function deleteUniversity(id: number) {
  await requireAdmin();

  const university = await prisma.university.findUnique({ where: { id } });
  await deleteImage(university?.logo);
  await prisma.university.delete({ where: { id } });

  await logAudit("university.delete", "university", id, {
    name: university?.name,
  });

  revalidatePath("/admin/universities");
  revalidatePath("/universities");
}