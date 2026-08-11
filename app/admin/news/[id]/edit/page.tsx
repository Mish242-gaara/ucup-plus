import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/actions/news";
import PhotoUploadField from "@/components/PhotoUploadField";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const articleId = Number(id);

  const [article, teams] = await Promise.all([
    prisma.newsArticle.findUnique({ where: { id: articleId } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  const updateWithId = updateArticle.bind(null, articleId);

  return (
    <div>
      <Link href="/admin/news" className="text-sm text-gray-400 hover:text-brand-500">
        ← Retour aux actualités
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-white">Modifier l&apos;article</h1>

      <form action={updateWithId} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="coverImage" initialValue={article.coverImage} label="Image" />
        <input name="title" defaultValue={article.title} placeholder="Titre" required className="input col-span-2" />
        <textarea
          name="excerpt"
          defaultValue={article.excerpt ?? ""}
          placeholder="Résumé"
          rows={2}
          className="input col-span-2"
        />
        <textarea
          name="content"
          defaultValue={article.content}
          placeholder="Contenu"
          rows={8}
          required
          className="input col-span-2"
        />
        <select name="teamId" defaultValue={article.teamId ?? ""} className="input col-span-2">
          <option value="">Actualité générale UCUP 2026</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="col-span-2 flex items-center gap-2 text-sm text-gray-300">
          <input name="published" type="checkbox" defaultChecked={article.published} className="h-4 w-4" />
          Publié
        </label>
        <button type="submit" className="btn col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
