"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadImage } from "@/lib/blob";

const sponsorSchema = z.object({
  name: z.string().min(1),
  websiteUrl: z.string().optional(),
});

function refresh() {
  revalidatePath("/admin/sponsors");
  revalidatePath("/", "layout");
}

export async function createSponsor(formData: FormData) {
  await requireAdmin();

  const parsed = sponsorSchema.parse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl") || undefined,
  });

  const logo = await uploadImage(formData.get("logo") as File | null, "sponsors");
  if (!logo) throw new Error("Un logo est requis.");

  const count = await prisma.sponsor.count();
  const sponsor = await prisma.sponsor.create({ data: { ...parsed, logo, sortOrder: count } });
  await logAudit("sponsor.create", "sponsor", sponsor.id, { name: parsed.name });
  refresh();
}

export async function deleteSponsor(id: number) {
  await requireAdmin();
  await prisma.sponsor.delete({ where: { id } });
  await logAudit("sponsor.delete", "sponsor", id);
  refresh();
}

export async function reorderSponsor(id: number, direction: "up" | "down") {
  await requireAdmin();

  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } });
  const index = sponsors.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= sponsors.length) return;

  const a = sponsors[index];
  const b = sponsors[swapIndex];

  await prisma.$transaction([
    prisma.sponsor.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.sponsor.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  refresh();
}
