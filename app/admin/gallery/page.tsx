import { prisma } from "@/lib/prisma";
import { deleteGalleryItem, reorderGalleryItem } from "@/lib/actions/gallery";
import GalleryUploadForm from "@/components/GalleryUploadForm";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
          Galerie Médias
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          Les vidéos sont des liens externes (YouTube, etc.) — pas d&apos;hébergement vidéo intégré.
        </p>
      </div>

      {/* Formulaire d'upload / ajout */}
      <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-6 shadow-xl">
        <GalleryUploadForm />
      </div>

      {/* Grille des médias */}
      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-md transition-all hover:border-white/20"
            >
              {/* Conteneur Média */}
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                {item.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.filePath}
                    alt={item.title ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center text-xs text-gray-400">
                    <span className="rounded-full bg-brand-500/10 px-3 py-1 font-mono text-[11px] text-brand-400 border border-brand-500/20">
                      Vidéo ↗
                    </span>
                  </div>
                )}

                {/* Tag de type de média */}
                <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {item.mediaType}
                </span>
              </div>

              {/* Détails & Actions */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <p className="truncate text-xs font-bold text-white" title={item.title || "Sans titre"}>
                  {item.title || "Sans titre"}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                  {/* Boutons de réordonnancement */}
                  <div className="flex items-center gap-1">
                    <form action={reorderGalleryItem.bind(null, item.id, "up")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        aria-label="Déplacer vers le haut"
                        className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-xs text-gray-300 hover:bg-zinc-700 hover:text-white disabled:opacity-20 disabled:hover:bg-zinc-800 transition-colors"
                      >
                        ↑
                      </button>
                    </form>

                    <form action={reorderGalleryItem.bind(null, item.id, "down")}>
                      <button
                        type="submit"
                        disabled={i === items.length - 1}
                        aria-label="Déplacer vers le bas"
                        className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-xs text-gray-300 hover:bg-zinc-700 hover:text-white disabled:opacity-20 disabled:hover:bg-zinc-800 transition-colors"
                      >
                        ↓
                      </button>
                    </form>
                  </div>

                  {/* Bouton de suppression */}
                  <form action={deleteGalleryItem.bind(null, item.id)}>
                    <ConfirmButton
                      message="Supprimer cet élément de la galerie ?"
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Supprimer
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-sm text-gray-400">Galerie vide pour le moment.</p>
        </div>
      )}
    </div>
  );
}