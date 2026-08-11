import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateTeam } from "@/lib/actions/teams";

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);

  const [team, universities] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, include: { players: true } }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!team) notFound();

  const updateWithId = updateTeam.bind(null, teamId);

  return (
    <div>
      <Link href="/admin/teams" className="text-sm text-gray-400 hover:text-brand-500">
        ← Retour aux équipes
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-white">Modifier {team.name}</h1>

      <form action={updateWithId} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <select name="universityId" required defaultValue={team.universityId} className="input col-span-2">
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input name="name" defaultValue={team.name} placeholder="Nom de l'équipe" required className="input col-span-2" />
        <input name="coach" defaultValue={team.coach ?? ""} placeholder="Entraîneur" className="input" />
        <select name="captainId" defaultValue={team.captainId ?? ""} className="input">
          <option value="">Capitaine — à déterminer</option>
          {team.players.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.jerseyNumber} {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
        <input name="category" defaultValue={team.category} placeholder="Catégorie" className="input" />
        <input name="year" type="number" defaultValue={team.year} placeholder="Année" required className="input" />
        <button type="submit" className="btn col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
