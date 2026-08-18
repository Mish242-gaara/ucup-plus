import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/actions/news";
import PhotoUploadField from "@/components/PhotoUploadField";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const articleId = Number(id);

  if (isNaN(articleId)) {
    notFound();
  }

  const [article, teams] = await Promise.all([
    prisma.newsArticle.findUnique({ where: { id: articleId } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  const updateWithId = updateArticle.bind(null, articleId);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
      {/* Navigation & Titre */}
      <div className="mb-6">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-400 transition-colors"
        >
          ← Retour aux actualités
        </Link>
        <h1 className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
          Modifier l&apos;article #{article.id}
        </h1>
      </div>

      {/* Formulaire de modification */}
      <form
        action={updateWithId}
        className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-6 shadow-xl space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Image de couverture */}
          <div className="col-span-1 sm:col-span-2">
            <PhotoUploadField
              name="coverImage"
              initialValue={article.coverImage}
              label="Image de couverture"
            />
          </div>

          {/* Titre */}
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">
              Titre de l'article
            </label>
            <input
              name="title"
              defaultValue={article.title}
              placeholder="Ex: Titre de l'actualité"
              required
              className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Résumé */}
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">
              Résumé (Extrait)
            </label>
            <textarea
              name="excerpt"
              defaultValue={article.excerpt ?? ""}
              placeholder="Brève description de l'article..."
              rows={2}
              className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Contenu */}
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">
              Contenu principal
            </label>
            <textarea
              name="content"
              defaultValue={article.content}
              placeholder="Rédigez le contenu complet de l'article ici..."
              rows={8}
              required
              className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Équipe associée */}
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">
              Équipe liée (Optionnel)
            </label>
            <select
              name="teamId"
              defaultValue={article.teamId ?? ""}
              className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Actualité générale UCUP 2026</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Statut de publication */}
          <div className="col-span-1 sm:col-span-2 pt-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              <input
                name="published"
                type="checkbox"
                defaultChecked={article.published}
                className="h-4 w-4 rounded border-white/10 bg-zinc-800 text-brand-600 focus:ring-brand-500 focus:ring-offset-zinc-900"
              />
              Publier l'article immédiatement
            </label>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Boutons d'action */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/news"
            className="w-full sm:w-auto text-center rounded-lg border border-white/10 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-zinc-700 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="btn w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg hover:bg-brand-500 active:scale-[0.99] transition-all"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
}