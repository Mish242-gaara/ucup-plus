import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPlayer, deletePlayer, setPlayerStatus } from "@/lib/actions/players";
import PhotoUploadField from "@/components/PhotoUploadField";
import ConfirmButton from "@/components/ConfirmButton";
import LicenseDownloadMenu from "@/components/LicenseDownloadMenu";

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-zinc-800 text-gray-500",
};

export default async function PlayersPage() {
  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      orderBy: [{ status: "asc" }, { team: { name: "asc" } }, { lastName: "asc" }],
      include: { team: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  const pendingCount = players.filter((p) => p.status === "pending").length;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-white">Joueurs</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
            {pendingCount} en attente de validation
          </span>
        )}
        <a href="/api/admin/export?type=players" className="ml-auto text-sm font-semibold text-brand-500 hover:underline">
          Exporter en CSV ↓
        </a>
      </div>
      <p className="mt-1 text-sm text-gray-400">
        Les demandes d&apos;inscription publiques (via /inscription-joueur) arrivent en statut
        &laquo; En attente &raquo; et ne sont visibles sur le site qu&apos;une fois approuvées.
      </p>

      <form action={createPlayer} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="photo" />
        <select name="teamId" required className="input col-span-2">
          <option value="">Équipe…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="firstName" placeholder="Prénom" required className="input" />
        <input name="lastName" placeholder="Nom" required className="input" />
        <input name="jerseyNumber" type="number" placeholder="N° maillot" required className="input" />
        <select name="position" required className="input">
          <option value="">Poste…</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input name="birthDate" type="date" className="input" />
        <input name="height" type="number" placeholder="Taille (cm)" className="input" />
        <input name="nationality" placeholder="Nationalité" defaultValue="DRC" className="input col-span-2" />
        <button type="submit" className="btn col-span-2">
          Ajouter (approuvé immédiatement)
        </button>
      </form>

      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="pb-2"></th>
            <th className="pb-2">Joueur</th>
            <th className="pb-2">Équipe</th>
            <th className="pb-2">N°</th>
            <th className="pb-2">Poste</th>
            <th className="pb-2">Statut</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="py-2">
                <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                  {p.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
              </td>
              <td className="py-2">
                {p.firstName} {p.lastName}
              </td>
              <td className="py-2">{p.team.name}</td>
              <td className="py-2">{p.jerseyNumber}</td>
              <td className="py-2">{p.position}</td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/players/${p.id}/edit`} className="text-brand-500 hover:underline">
                    Modifier
                  </Link>
                  <LicenseDownloadMenu playerId={p.id} />
                  {p.status !== "approved" && (
                    <form action={setPlayerStatus.bind(null, p.id, "approved")}>
                      <button className="text-green-600 hover:underline" type="submit">
                        Approuver
                      </button>
                    </form>
                  )}
                  {p.status !== "rejected" && (
                    <form action={setPlayerStatus.bind(null, p.id, "rejected")}>
                      <button className="text-gray-500 hover:underline" type="submit">
                        Rejeter
                      </button>
                    </form>
                  )}
                  <form action={deletePlayer.bind(null, p.id)}>
                    <ConfirmButton
                      message={`Supprimer ${p.firstName} ${p.lastName} ? Cette action est irréversible.`}
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
