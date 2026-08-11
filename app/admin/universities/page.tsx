import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createUniversity, deleteUniversity } from "@/lib/actions/universities";
import ConfirmButton from "@/components/ConfirmButton";
import PhotoUploadField from "@/components/PhotoUploadField";

export default async function UniversitiesPage() {
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Universités</h1>

      <form action={createUniversity} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="logo" label="Logo" />
        <input name="name" placeholder="Nom" required className="input col-span-2" />
        <input name="shortName" placeholder="Sigle (ex: ESTAM)" maxLength={10} required className="input" />
        <input name="colors" placeholder="Couleurs" className="input" />
        <input name="city" placeholder="Ville (ex: Pointe-Noire)" className="input" />
        <input name="foundedYear" type="number" placeholder="Année de fondation" className="input" />
        <textarea name="description" placeholder="Description" className="input col-span-2" rows={2} />
        <button type="submit" className="btn col-span-2">
          Ajouter
        </button>
      </form>

      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="pb-2"></th>
            <th className="pb-2">Nom</th>
            <th className="pb-2">Sigle</th>
            <th className="pb-2">Équipes</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {universities.map((u) => (
            <tr key={u.id} className="border-t border-white/10">
              <td className="py-2">
                <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                  {u.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.logo} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </td>
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.shortName}</td>
              <td className="py-2">{u._count.teams}</td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/universities/${u.id}/edit`} className="text-brand-500 hover:underline">
                    Modifier
                  </Link>
                  <form action={deleteUniversity.bind(null, u.id)}>
                    <ConfirmButton
                      message={`Supprimer l'université ${u.name} ? Ses équipes, joueurs et matchs seront aussi supprimés.`}
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
