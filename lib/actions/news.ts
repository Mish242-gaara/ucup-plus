"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { uploadImage, deleteImage } from "@/lib/blob";
import { slugify } from "@/lib/slugify";

const articleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  teamId: z.coerce.number().int().optional(),
  published: z.coerce.boolean().default(false),
});

async function uniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title) || "article";
  let slug = base;
  let n = 2;
  // Small tournament site — a plain loop is fine, no need for anything fancier.
  while (
    await prisma.newsArticle.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}

function refresh(teamId?: number | null, slug?: string) {
  revalidatePath("/admin/news");
  revalidatePath("/actualites");
  if (slug) revalidatePath(`/actualites/${slug}`);
  if (teamId) revalidatePath(`/teams/${teamId}`);
}

export async function createArticle(formData: FormData) {
  await requireAdmin();

  const parsed = articleSchema.parse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    teamId: formData.get("teamId") || undefined,
    published: formData.get("published") === "on",
  });

  const slug = await uniqueSlug(parsed.title);
  const coverImage = await uploadImage(formData.get("coverImage") as File | null, "news");

  const article = await prisma.newsArticle.create({
    data: {
      ...parsed,
      teamId: parsed.teamId ?? null,
      slug,
      coverImage,
      publishedAt: parsed.published ? new Date() : null,
    },
  });

  await logAudit("news.create", "news_article", article.id, { title: parsed.title });
  refresh(parsed.teamId, slug);
}

export async function updateArticle(id: number, formData: FormData) {
  await requireAdmin();

  const parsed = articleSchema.parse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    teamId: formData.get("teamId") || undefined,
    published: formData.get("published") === "on",
  });

  const existing = await prisma.newsArticle.findUniqueOrThrow({ where: { id } });
  const slug = existing.title === parsed.title ? existing.slug : await uniqueSlug(parsed.title, id);

  const removed = formData.get("coverImage-removed") === "1";
  const newCover = await uploadImage(formData.get("coverImage") as File | null, "news");
  let coverImage = existing.coverImage;
  if (newCover) {
    await deleteImage(existing.coverImage);
    coverImage = newCover;
  } else if (removed) {
    await deleteImage(existing.coverImage);
    coverImage = null;
  }

  await prisma.newsArticle.update({
    where: { id },
    data: {
      ...parsed,
      teamId: parsed.teamId ?? null,
      slug,
      coverImage,
      publishedAt: parsed.published ? (existing.publishedAt ?? new Date()) : null,
    },
  });

  await logAudit("news.update", "news_article", id, { title: parsed.title });
  refresh(parsed.teamId, slug);
  if (existing.teamId && existing.teamId !== parsed.teamId) refresh(existing.teamId, existing.slug);
}

export async function deleteArticle(id: number) {
  await requireAdmin();
  const article = await prisma.newsArticle.findUnique({ where: { id } });
  await deleteImage(article?.coverImage);
  await prisma.newsArticle.delete({ where: { id } });
  await logAudit("news.delete", "news_article", id, { title: article?.title });
  refresh(article?.teamId, article?.slug);
}

export async function togglePublish(id: number, published: boolean) {
  await requireAdmin();
  const article = await prisma.newsArticle.update({
    where: { id },
    data: { published, publishedAt: published ? new Date() : null },
  });
  await logAudit(published ? "news.publish" : "news.unpublish", "news_article", id);
  refresh(article.teamId, article.slug);
}
