import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.newsArticle.findUnique({ where: { slug }, select: { title: true, excerpt: true } });
  if (!article) return { title: "Article introuvable — UCUP 2026" };
  return {
    title: `${article.title} — UCUP 2026`,
    description: article.excerpt ?? undefined,
    openGraph: { title: article.title, description: article.excerpt ?? undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.newsArticle.findUnique({ where: { slug }, include: { team: true } });

  if (!article || !article.published) notFound();

  const paragraphs = article.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/actualites" className="text-sm text-gray-400 hover:text-brand-500">
        ← Toutes les actualités
      </Link>

      {article.team && (
        <Link
          href={`/teams/${article.team.id}`}
          className="mt-3 inline-block text-xs font-bold uppercase tracking-wide text-brand-500 hover:underline"
        >
          {article.team.name}
        </Link>
      )}
      <h1 className="mt-1 text-3xl font-extrabold text-ink">{article.title}</h1>
      <p className="mt-1 text-sm text-gray-400">
        {article.publishedAt && new Date(article.publishedAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
      </p>

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImage} alt={article.title} className="mt-6 w-full rounded-xl object-cover" />
      )}

      <div className="prose mt-6 space-y-4 text-sm leading-relaxed text-gray-700">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </main>
  );
}
