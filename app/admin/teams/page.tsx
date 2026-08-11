import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createTeam, deleteTeam } from "@/lib/actions/teams";
import ConfirmButton from "@/components/ConfirmButton";

export default async function TeamsPage() {
  const [teams, universities] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: { university: true, _count: { select: { players: true } } },
    }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Équipes</h1>

      <form action={createTeam} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <select name="universityId" required className="input col-span-2">
          <option value="">Université…</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input name="name" placeholder="Nom de l'équipe" required className="input col-span-2" />
        <input name="coach" placeholder="Entraîneur" className="input" />
        <input name="category" placeholder="Catégorie (senior…)" defaultValue="senior" className="input" />
        <input name="year" type="number" placeholder="Année" required className="input" />
        <button type="submit" className="btn col-span-2">
          Ajouter
        </button>
      </form>

      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="pb-2">Équipe</th>
            <th className="pb-2">Université</th>
            <th className="pb-2">Joueurs</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id} className="border-t border-white/10">
              <td className="py-2">{t.name}</td>
              <td className="py-2">{t.university.shortName}</td>
              <td className="py-2">{t._count.players}</td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/teams/${t.id}/edit`} className="text-brand-500 hover:underline">
                    Modifier
                  </Link>
                  <form action={deleteTeam.bind(null, t.id)}>
                    <ConfirmButton
                      message={`Supprimer l'équipe ${t.name} ? Ses joueurs et matchs seront aussi supprimés.`}
                      className="text-brand-600 hover:underline"
                    >
                      Supprimer
                    </ConfirmButton>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
