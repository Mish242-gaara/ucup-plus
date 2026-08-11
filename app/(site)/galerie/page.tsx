import { Play } from "lucide-react";
import { prisma } from "@/lib/prisma";

function toEmbedUrl(url: string) {
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  return null;
}

export default async function GaleriePage() {
  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Galerie</h1>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">Aucune photo ou vidéo pour le moment.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const embedUrl = item.mediaType === "video" ? toEmbedUrl(item.filePath) : null;

            return (
              <figure key={item.id} className="site-card overflow-hidden">
                {item.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.filePath}
                    alt={item.title ?? ""}
                    className="aspect-square w-full object-cover"
                  />
                ) : embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={item.title ?? "Vidéo"}
                    allowFullScreen
                    className="aspect-square w-full"
                  />
                ) : (
                  <a
                    href={item.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-500 hover:text-brand-500"
                  >
                    <Play size={28} />
                    <span className="text-xs">Voir la vidéo</span>
                  </a>
                )}
                {item.title && <figcaption className="p-2 text-xs text-gray-500">{item.title}</figcaption>}
              </figure>
            );
          })}
        </div>
      )}
    </main>
  );
}
