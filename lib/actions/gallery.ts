"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadImage, deleteImage } from "@/lib/blob";

const gallerySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  mediaType: z.enum(["image", "video"]),
});

export async function createGalleryItem(formData: FormData) {
  await requireAdmin();

  const parsed = gallerySchema.parse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    mediaType: formData.get("mediaType"),
  });

  let filePath: string | null;
  if (parsed.mediaType === "image") {
    filePath = await uploadImage(formData.get("filePath") as File | null, "gallery");
  } else {
    filePath = (formData.get("filePath") as string) || null;
  }
  if (!filePath) throw new Error("Une image ou un lien vidéo est requis.");

  const count = await prisma.galleryItem.count();
  const item = await prisma.galleryItem.create({ data: { ...parsed, filePath, sortOrder: count } });
  await logAudit("gallery.create", "gallery_item", item.id, { title: parsed.title });

  revalidatePath("/admin/gallery");
  revalidatePath("/galerie");
}

export async function deleteGalleryItem(id: number) {
  await requireAdmin();
  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (item?.mediaType === "image") await deleteImage(item.filePath);
  await prisma.galleryItem.delete({ where: { id } });
  await logAudit("gallery.delete", "gallery_item", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/galerie");
}

export async function reorderGalleryItem(id: number, direction: "up" | "down") {
  await requireAdmin();

  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });
  const index = items.findIndex((i) => i.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  const a = items[index];
  const b = items[swapIndex];

  await prisma.$transaction([
    prisma.galleryItem.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.galleryItem.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  revalidatePath("/admin/gallery");
  revalidatePath("/galerie");
}
