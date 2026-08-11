import { prisma } from "@/lib/prisma";
import { deleteGalleryItem, reorderGalleryItem } from "@/lib/actions/gallery";
import GalleryUploadForm from "@/components/GalleryUploadForm";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Galerie</h1>
      <p className="mt-1 text-sm text-gray-400">
        Les vidéos sont des liens externes (YouTube, etc.) — pas d&apos;hébergement vidéo intégré.
      </p>

      <div className="mt-6">
        <GalleryUploadForm />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.id} className="admin-card overflow-hidden">
            <div className="aspect-square w-full bg-zinc-800">
              {item.mediaType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.filePath} alt={item.title ?? ""} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  Vidéo ↗
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-xs font-semibold text-white">{item.title || "Sans titre"}</p>
              <div className="mt-1 flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  <form action={reorderGalleryItem.bind(null, item.id, "up")}>
                    <button disabled={i === 0} className="text-gray-400 hover:text-brand-500 disabled:opacity-30">
                      ↑
                    </button>
                  </form>
                  <form action={reorderGalleryItem.bind(null, item.id, "down")}>
                    <button
                      disabled={i === items.length - 1}
                      className="text-gray-400 hover:text-brand-500 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                </div>
                <form action={deleteGalleryItem.bind(null, item.id)}>
                  <ConfirmButton message="Supprimer cet élément de la galerie ?" className="text-brand-600 hover:underline">
                    Suppr.
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm text-gray-400">Galerie vide pour le moment.</p>}
    </div>
  );
}
