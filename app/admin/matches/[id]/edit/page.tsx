import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateMatch } from "@/lib/actions/matches";

// Force le rendu dynamique pour charger les données réelles
export const dynamic = "force-dynamic";

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  if (isNaN(matchId)) {
    notFound();
  }

  const [match, teams] = await Promise.all([
    prisma.match.findUnique({ where: { id: matchId } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!match) {
    notFound();
  }

  const updateWithId = updateMatch.bind(null, matchId);

  // Formate la date pour l'input datetime-local sans décalage UTC/Local
  const matchDate = new Date(match.matchDate);
  const localIsoDate = new Date(matchDate.getTime() - matchDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
      {/* Navigation & Titre */}
      <div className="mb-6">
        <Link
          href="/admin/matches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-400 transition-colors"
        >
          ← Retour à la gestion des matchs
        </Link>
        <h1 className="mt-2 text-xl sm:text-3xl font-black tracking-tight text-white">
          Modifier le match #{match.id}
        </h1>
      </div>

      {/* Formulaire de modification */}
      <form
        action={updateWithId}
        className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-6 shadow-xl space-y-6"
      >
        {/* Section 1 : Équipes */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
            1. Équipes participantes
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Équipe Domicile
              </label>
              <select
                name="homeTeamId"
                required
                defaultValue={match.homeTeamId}
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Équipe Extérieur
              </label>
              <select
                name="awayTeamId"
                required
                defaultValue={match.awayTeamId}
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Section 2 : Date, Lieu & Type */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
            2. Date & Emplacement
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Date et heure du coup d'envoi
              </label>
              <input
                name="matchDate"
                type="datetime-local"
                defaultValue={localIsoDate}
                required
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Type de rencontre
              </label>
              <select
                name="matchType"
                defaultValue={match.matchType ?? "tournament"}
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="tournament">Tournoi Officiel</option>
                <option value="friendly">Match Amical</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Lieu / Stade
              </label>
              <input
                name="venue"
                defaultValue={match.venue ?? ""}
                placeholder="Ex: Terrain Annexe ESTAM"
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Section 3 : Structure de la compétition */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
            3. Phase & Groupe
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Groupe (Poule)
              </label>
              <input
                name="group"
                defaultValue={match.group ?? ""}
                placeholder="Ex: Groupe A"
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                Phase du tournoi
              </label>
              <input
                name="round"
                defaultValue={match.round ?? ""}
                placeholder="Ex: Phase de poules, Quart de finale..."
                className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Configuration du Bracket */}
          <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-zinc-950/50 p-3 sm:p-4">
            <p className="text-xs font-semibold text-gray-400">
              Arbre à élimination directe (Bracket)
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Laissez vide s'il s'agit d'un match de phase de groupe.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-gray-400">N° de Tour</label>
                <input
                  name="bracketRound"
                  type="number"
                  min={1}
                  defaultValue={match.bracketRound ?? ""}
                  placeholder="Ex: 1 (Quarts), 2 (Demis)..."
                  className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-gray-400">Position dans le Tour</label>
                <input
                  name="bracketPosition"
                  type="number"
                  min={0}
                  defaultValue={match.bracketPosition ?? ""}
                  placeholder="Ex: 0, 1, 2..."
                  className="input w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Boutons de validation */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/matches"
            className="w-full sm:w-auto text-center rounded-lg border border-white/10 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-zinc-700 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="btn w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg hover:bg-brand-500 active:scale-[0.99] transition-all"
          >
            Mettre à jour le match
          </button>
        </div>
      </form>
    </div>
  );
}