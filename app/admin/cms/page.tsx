import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
type Announcement = { id: number; text: string; active?: boolean };
type NewsArticle = { id: number; title: string; excerpt?: string };
type Sponsor = { id: number; name: string; logo?: string; sortOrder?: number };

export const dynamic = "force-dynamic";

export default async function AdminCMSPage() {
  const [announcements, newsArticles, sponsors]: [
    Announcement[],
    NewsArticle[],
    Sponsor[]
  ] = await Promise.all([
    (prisma as any).announcement.findMany({ orderBy: { createdAt: "desc" } }),
    (prisma as any).newsArticle.findMany({ orderBy: { createdAt: "desc" } }),
    (prisma as any).sponsor.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  // Server Action : Ajouter une annonce
    async function addAnnouncement(formData: FormData) {
    "use server";
    const text = formData.get("text") as string;
    if (text) {
      await (prisma as any).announcement.create({ data: { text } });
      revalidatePath("/");
      revalidatePath("/admin/cms");
    }
  }

  // Server Action : Supprimer une annonce
    async function deleteAnnouncement(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    if (id) {
      await (prisma as any).announcement.delete({ where: { id } });
      revalidatePath("/");
      revalidatePath("/admin/cms");
    }
  }

  // Server Action : Ajouter un article
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

      await (prisma as any).newsArticle.create({
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

  // Server Action : Ajouter un sponsor
    async function addSponsor(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const logo = formData.get("logo") as string;
    if (name) {
      await (prisma as any).sponsor.create({
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
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      <h1 className="text-2xl font-black text-ink">Gestion du Contenu (CMS Accueil)</h1>

      {/* SECTION 1: FLASH INFO */}
      <section className="site-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">📢 Flash Info Défilant</h2>
        <form action={addAnnouncement} className="flex gap-2">
          <input
            type="text"
            name="text"
            placeholder="Texte du message..."
            required
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg">
            Ajouter
          </button>
        </form>

        <ul className="divide-y divide-gray-100 mt-4">
          {announcements.map((a: Announcement) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span>{a.text}</span>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-xs text-red-600 font-bold hover:underline">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 2: ACTUALITÉS */}
      <section className="site-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">📰 Fil d'Actualités</h2>
        <form action={addArticle} className="grid gap-3">
          <input
            type="text"
            name="title"
            placeholder="Titre de l'article"
            required
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <textarea
            name="excerpt"
            placeholder="Résumé / Contenu..."
            required
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg w-fit">
            Publier l'article
          </button>
        </form>

        <ul className="divide-y divide-gray-100 mt-4">
          {newsArticles.map((art: NewsArticle) => (
            <li key={art.id} className="py-2 text-sm">
              <span className="font-bold">{art.title}</span>
              <p className="text-xs text-gray-500">{art.excerpt}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 3: SPONSORS */}
      <section className="site-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">🤝 Partenaires & Sponsors</h2>
        <form action={addSponsor} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Nom du partenaire"
            required
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="logo"
            placeholder="URL du logo (optionnel)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg">
            Ajouter
          </button>
        </form>

        <ul className="divide-y divide-gray-100 mt-4">
          {sponsors.map((s: Sponsor) => (
            <li key={s.id} className="py-2 text-sm font-semibold">
              {s.name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}