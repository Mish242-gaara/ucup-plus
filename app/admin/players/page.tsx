import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPlayer, deletePlayer, setPlayerStatus } from "@/lib/actions/players";
import PhotoUploadField from "@/components/PhotoUploadField";
import ConfirmButton from "@/components/ConfirmButton";
import LicenseDownloadMenu from "@/components/LicenseDownloadMenu";

// Rendu dynamique obligatoire pour afficher les inscriptions en temps réel
export const dynamic = "force-dynamic";

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "border border-amber-500/20 bg-amber-500/10 text-amber-400",
  approved: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  rejected: "border border-zinc-600/30 bg-zinc-800 text-zinc-400",
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
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
            <span>Administration</span>
            <span>•</span>
            <span>Base de données</span>
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Gestion des Joueurs
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                {pendingCount} en attente
              </span>
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-xs text-gray-400">
            Les demandes d'inscription publiques arrivent avec le statut « En attente » et nécessitent 
            une validation manuelle pour apparaître sur les feuilles de match.
          </p>
        </div>

        <a
          href="/api/admin/export?type=players"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700 focus:ring-2 focus:ring-brand-500"
        >
          Exporter CSV ↓
        </a>
      </div>

      {/* Formulaire d'ajout rapide */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-brand-400">
          Ajout Rapide (Validation immédiate)
        </h2>
        <form action={createPlayer} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center gap-4 border-b border-white/5 pb-4">
            <PhotoUploadField name="photo" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-white">Photo d'identité</p>
              <p className="text-xs text-gray-500">Format portrait recommandé (JPG/PNG).</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <select name="teamId" required className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">Sélectionner une équipe…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <select name="position" required className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">Poste…</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <input name="jerseyNumber" type="number" placeholder="N° Maillot" required className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          <div className="lg:col-span-2">
            <input name="firstName" placeholder="Prénom" required className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          <div className="lg:col-span-2">
            <input name="lastName" placeholder="Nom" required className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          <div className="lg:col-span-1">
            <input name="birthDate" type="date" className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          <div className="lg:col-span-1">
            <input name="height" type="number" placeholder="Taille (cm)" className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          <div className="lg:col-span-2">
            <input name="nationality" placeholder="Nationalité" defaultValue="Congolaise" className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          <div className="lg:col-span-4 mt-2">
            <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-brand-500 active:scale-[0.99]">
              Ajouter au répertoire
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des joueurs */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-950/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3">Joueur</th>
                <th className="px-4 py-3">Équipe</th>
                <th className="px-4 py-3 text-center">N°</th>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                      {p.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-200">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {p.team.name}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-brand-400 font-bold">
                    {p.jerseyNumber}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {p.position}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                      <Link href={`/admin/players/${p.id}/edit`} className="text-blue-400 hover:text-blue-300 transition-colors">
                        Éditer
                      </Link>
                      
                      <LicenseDownloadMenu playerId={p.id} />
                      
                      {p.status !== "approved" && (
                        <form action={setPlayerStatus.bind(null, p.id, "approved")}>
                          <button type="submit" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                            Valider
                          </button>
                        </form>
                      )}
                      
                      {p.status !== "rejected" && (
                        <form action={setPlayerStatus.bind(null, p.id, "rejected")}>
                          <button type="submit" className="text-zinc-500 hover:text-zinc-400 transition-colors">
                            Rejeter
                          </button>
                        </form>
                      )}
                      
                      <form action={deletePlayer.bind(null, p.id)}>
                        <ConfirmButton
                          message={`Supprimer définitivement ${p.firstName} ${p.lastName} ?`}
                          className="text-rose-500 hover:text-rose-400 transition-colors"
                        >
                          Suppr.
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun joueur enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}