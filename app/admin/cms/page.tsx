import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type AnnouncementType = {
  id: number;
  text: string;
  active: boolean;
  createdAt: Date;
};

type NewsArticleType = {
  id: number;
  title: string;
  excerpt: string | null;
};

type SponsorType = {
  id: number;
  name: string;
  logo: string;
};

export default async function AdminCMSPage() {
  // @ts-ignore
  const announcements: AnnouncementType[] = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  const newsArticles: NewsArticleType[] = await prisma.newsArticle.findMany({
    orderBy: { createdAt: "desc" },
  });

  const sponsors: SponsorType[] = await prisma.sponsor.findMany({
    orderBy: { sortOrder: "asc" },
  });

  async function addAnnouncement(formData: FormData) {
    "use server";
    const text = formData.get("text") as string;
    if (text) {
      // @ts-ignore
      await prisma.announcement.create({ data: { text } });
      revalidatePath("/");
      revalidatePath("/admin/cms");
    }
  }

  async function deleteAnnouncement(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    if (id) {
      // @ts-ignore
      await prisma.announcement.delete({ where: { id } });
      revalidatePath("/");
      revalidatePath("/admin/cms");
    }
  }

  async function addArticle(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    if (title && excerpt) {
      const slug =
        title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now();

      await prisma.newsArticle.create({
        data: {
          title,
          slug,
          excerpt,
          content: excerpt,
          published: true,
          publishedAt: new Date(),
        },
      });
      revalidatePath("/");
      revalidatePath("/admin/cms");
    }
  }

  async function addSponsor(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const logo = formData.get("logo") as string;
    if (name) {
      await prisma.sponsor.create({
        data: {
          name,
          logo: logo || "",
        },
      });
      revalidatePath("/");
      revalidatePath("/admin/cms");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10 text-white">
      {/* Titre Principal visible en Blanc */}
      <h1 className="text-2xl font-black text-white">Gestion du Contenu (CMS Accueil)</h1>

      {/* SECTION 1: FLASH INFO */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
           Flash Info Défilant
        </h2>
        <form action={addAnnouncement} className="flex gap-2">
          <input
            type="text"
            name="text"
            placeholder="Ex: Le match d'ouverture est reporté à 16h..."
            required
            className="flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
            Ajouter
          </button>
        </form>

        <ul className="divide-y divide-zinc-800 mt-4">
          {announcements.map((a: AnnouncementType) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-200">{a.text}</span>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-xs text-red-500 font-bold hover:underline">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 2: ACTUALITÉS */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Fil d'Actualités
        </h2>
        <form action={addArticle} className="grid gap-3">
          <input
            type="text"
            name="title"
            placeholder="Titre de l'article"
            required
            className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
          <textarea
            name="excerpt"
            placeholder="Résumé / Contenu..."
            required
            rows={3}
            className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg w-fit transition">
            Publier l'article
          </button>
        </form>

        <ul className="divide-y divide-zinc-800 mt-4">
          {newsArticles.map((art: NewsArticleType) => (
            <li key={art.id} className="py-2 text-sm">
              <span className="font-bold text-white">{art.title}</span>
              <p className="text-xs text-gray-400 mt-1">{art.excerpt}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 3: SPONSORS */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Partenaires & Sponsors
        </h2>
        <form action={addSponsor} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Nom du partenaire"
            required
            className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500 flex-1"
          />
          <input
            type="text"
            name="logo"
            placeholder="URL du logo (optionnel)"
            className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500 flex-1"
          />
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
            Ajouter
          </button>
        </form>

        <ul className="divide-y divide-zinc-800 mt-4">
          {sponsors.map((s: SponsorType) => (
            <li key={s.id} className="py-2 text-sm font-semibold text-gray-200">
              {s.name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}