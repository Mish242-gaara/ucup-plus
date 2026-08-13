import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function NewsFeed() {
  const news = await prisma.newsArticle.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  if (news.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
        📰 Fil d'Actualités
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {news.map((item) => (
          <div key={item.id} className="site-card p-4 hover:border-red-200 transition">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span className="font-bold text-red-600 uppercase">
                {item.teamId ? "Équipe" : "UCUP 2026"}
              </span>
              <span>
                {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <h3 className="font-bold text-ink text-sm hover:text-red-600 transition">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.excerpt || item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}