import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Actualités — UCUP 2026" };

export default async function NewsPage() {
  const articles = await prisma.newsArticle.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    include: { team: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Actualités</h1>

      {articles.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">Aucune actualité publiée pour le moment.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.id} href={`/actualites/${a.slug}`} className="site-card overflow-hidden hover:shadow-md">
              {a.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImage} alt={a.title} className="aspect-video w-full object-cover" />
              )}
              <div className="p-4">
                {a.team && (
                  <span className="text-xs font-bold uppercase tracking-wide text-brand-500">{a.team.name}</span>
                )}
                <p className="mt-1 font-bold text-ink">{a.title}</p>
                {a.excerpt && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{a.excerpt}</p>}
                <p className="mt-2 text-xs text-gray-400">
                  {a.publishedAt && new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
