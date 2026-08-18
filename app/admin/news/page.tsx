import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createArticle, deleteArticle, togglePublish } from "@/lib/actions/news";
import PhotoUploadField from "@/components/PhotoUploadField";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AdminNewsPage() {
  const [articles, teams] = await Promise.all([
    prisma.newsArticle.findMany({ orderBy: { createdAt: "desc" }, include: { team: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-extrabold text-white">Actualités</h1>

      {/* Formulaire responsive : 1 colonne sur mobile, 2 colonnes sur tablette/desktop */}
      <form action={createArticle} className="mt-6 grid max-w-xl grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <PhotoUploadField name="coverImage" label="Image" />
        </div>
        <input name="title" placeholder="Titre" required className="input col-span-1 sm:col-span-2 w-full" />
        <textarea name="excerpt" placeholder="Résumé (affiché dans les listes)" rows={2} className="input col-span-1 sm:col-span-2 w-full" />
        <textarea
          name="content"
          placeholder="Contenu de l'article (un paragraphe par ligne vide)"
          rows={6}
          required
          className="input col-span-1 sm:col-span-2 w-full"
        />
        <select name="teamId" className="input col-span-1 sm:col-span-2 w-full">
          <option value="">Actualité générale UCUP 2026</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="col-span-1 sm:col-span-2 flex items-center gap-2 text-sm text-gray-300 py-1">
          <input name="published" type="checkbox" className="h-4 w-4 rounded accent-red-600" />
          Publier immédiatement
        </label>
        <button type="submit" className="btn col-span-1 sm:col-span-2 w-full">
          Créer l&apos;article
        </button>
      </form>

      {/* Liste des articles avec disposition adaptée pour mobile */}
      <div className="mt-8 space-y-3">
        {articles.map((a) => (
          <div key={a.id} className="admin-card flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <p className="font-semibold text-white text-sm sm:text-base">{a.title}</p>
              <p className="text-xs text-gray-400 mt-1">
                {a.team ? a.team.name : "Actualité générale"} ·{" "}
                {a.published ? "Publié" : "Brouillon"} ·{" "}
                {new Date(a.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm pt-2 sm:pt-0 border-t border-zinc-800 sm:border-t-0 justify-end">
              <form action={togglePublish.bind(null, a.id, !a.published)}>
                <button type="submit" className="text-brand-400 hover:underline font-medium">
                  {a.published ? "Dépublier" : "Publier"}
                </button>
              </form>
              <Link href={`/admin/news/${a.id}/edit`} className="text-brand-400 hover:underline font-medium">
                Modifier
              </Link>
              <form action={deleteArticle.bind(null, a.id)}>
                <ConfirmButton message={`Supprimer l'article "${a.title}" ?`} className="text-gray-400 hover:text-red-400 hover:underline font-medium">
                  Supprimer
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
        {articles.length === 0 && <p className="text-sm text-gray-500">Aucun article pour le moment.</p>}
      </div>
    </div>
  );
}