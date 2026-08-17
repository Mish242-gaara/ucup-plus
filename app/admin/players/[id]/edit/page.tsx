import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updatePlayer } from "@/lib/actions/players";
import PhotoUploadField from "@/components/PhotoUploadField";

// Rendu dynamique pour assurer la mise à jour immédiate
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

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  if (isNaN(playerId)) {
    notFound();
  }

  const [player, teams] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!player) {
    notFound();
  }

  const updateWithId = updatePlayer.bind(null, playerId);

  // Formate la date au format YYYY-MM-DD sans décalage UTC
  const birthDateValue = player.birthDate
    ? new Date(
        new Date(player.birthDate).getTime() -
          new Date(player.birthDate).getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 10)
    : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Navigation & En-tête */}
      <div className="mb-6">
        <Link
          href="/admin/players"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-400 transition-colors"
        >
          ← Retour à la liste des joueurs
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Modifier {player.firstName} {player.lastName}
          </h1>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              STATUS_STYLE[player.status] ?? STATUS_STYLE.pending
            }`}
          >
            {STATUS_LABEL[player.status] ?? player.status}
          </span>
        </div>
      </div>

      {/* Formulaire de modification */}
      <form
        action={updateWithId}
        className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl space-y-6"
      >
        {/* Photo de profil */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
            1. Photo du joueur
          </h2>
          <div className="flex items-center gap-4 rounded-lg border border-white/5 bg-zinc-950/50 p-4">
            <PhotoUploadField name="photo" initialValue={player.photo} />
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-white">Changer la photo</p>
              <p>Format portrait recommandé pour la génération automatique des licences.</p>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Informations Club & Terrain */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
            2. Affectation & Poste
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Équipe
              </label>
              <select
                name="teamId"
                required
                defaultValue={player.teamId}
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Poste principal
              </label>
              <select
                name="position"
                required
                defaultValue={player.position}
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                N° de Maillot
              </label>
              <input
                name="jerseyNumber"
                type="number"
                defaultValue={player.jerseyNumber}
                placeholder="Ex: 10"
                required
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* État Civil & Caractéristiques */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
            3. État Civil & Mensurations
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Prénom
              </label>
              <input
                name="firstName"
                defaultValue={player.firstName}
                placeholder="Prénom"
                required
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Nom
              </label>
              <input
                name="lastName"
                defaultValue={player.lastName}
                placeholder="Nom"
                required
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Date de naissance
              </label>
              <input
                name="birthDate"
                type="date"
                defaultValue={birthDateValue}
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Taille (cm)
              </label>
              <input
                name="height"
                type="number"
                defaultValue={player.height ?? ""}
                placeholder="Ex: 182"
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Nationalité
              </label>
              <input
                name="nationality"
                defaultValue={player.nationality ?? "Congolaise"}
                placeholder="Nationalité"
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/players"
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-zinc-700 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="btn rounded-lg bg-brand-600 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg hover:bg-brand-500 active:scale-[0.99] transition-all"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
}