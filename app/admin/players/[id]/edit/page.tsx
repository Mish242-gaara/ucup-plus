import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updatePlayer } from "@/lib/actions/players";
import PhotoUploadField from "@/components/PhotoUploadField";

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  const [player, teams] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!player) notFound();

  const updateWithId = updatePlayer.bind(null, playerId);
  const birthDateValue = player.birthDate ? new Date(player.birthDate).toISOString().slice(0, 10) : "";

  return (
    <div>
      <Link href="/admin/players" className="text-sm text-gray-400 hover:text-brand-500">
        ← Retour aux joueurs
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-white">
        Modifier {player.firstName} {player.lastName}
      </h1>

      <form action={updateWithId} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="photo" initialValue={player.photo} />

        <select name="teamId" required defaultValue={player.teamId} className="input col-span-2">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="firstName" defaultValue={player.firstName} placeholder="Prénom" required className="input" />
        <input name="lastName" defaultValue={player.lastName} placeholder="Nom" required className="input" />
        <input
          name="jerseyNumber"
          type="number"
          defaultValue={player.jerseyNumber}
          placeholder="N° maillot"
          required
          className="input"
        />
        <select name="position" required defaultValue={player.position} className="input">
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input name="birthDate" type="date" defaultValue={birthDateValue} className="input" />
        <input name="height" type="number" defaultValue={player.height ?? ""} placeholder="Taille (cm)" className="input" />
        <input
          name="nationality"
          defaultValue={player.nationality}
          placeholder="Nationalité"
          className="input col-span-2"
        />
        <button type="submit" className="btn col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
