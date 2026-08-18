import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  createMatch,
  deleteMatch,
  duplicateMatch,
  updateMatchScore,
  updateMatchStatus,
} from "@/lib/actions/matches";
import ConfirmButton from "@/components/ConfirmButton";

// Ne pas mettre en cache la page d'administration
export const dynamic = "force-dynamic";

const STATUSES = ["scheduled", "live", "halftime", "finished", "postponed"] as const;
const STATUS_LABELS: Record<string, string> = {
  scheduled: "À venir",
  live: "En direct",
  halftime: "Mi-temps",
  finished: "Terminé",
  postponed: "Reporté",
};

export default async function MatchesPage() {
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      orderBy: { matchDate: "desc" },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Actions serveur encapsulées avec liaison d'ID
  async function handleUpdateScore(matchId: number, formData: FormData) {
    "use server";
    const home = Number(formData.get("home"));
    const away = Number(formData.get("away"));
    await updateMatchScore(matchId, home, away);
  }

  async function handleUpdateStatus(matchId: number, formData: FormData) {
    "use server";
    const status = formData.get("status") as any;
    await updateMatchStatus(matchId, status);
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-0 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Matchs</h1>
        <Link href="/bracket" className="text-sm font-semibold text-brand-500 hover:underline">
          Voir le bracket →
        </Link>
      </div>

      {/* Formulaire de création de match */}
      <form action={createMatch} className="mt-6 grid max-w-2xl grid-cols-1 sm:grid-cols-2 gap-3">
        <select name="homeTeamId" required aria-label="Équipe domicile" className="input w-full">
          <option value="">Équipe domicile…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select name="awayTeamId" required aria-label="Équipe visiteuse" className="input w-full">
          <option value="">Équipe visiteuse…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <input
          name="matchDate"
          type="datetime-local"
          required
          aria-label="Date et heure du match"
          className="input col-span-1 sm:col-span-2 w-full"
        />
        <input name="venue" placeholder="Lieu" className="input w-full" />
        <input name="group" placeholder="Groupe (A, B…)" className="input w-full" />
        <input name="round" placeholder="Phase (Quart, Demi, Finale…)" className="input w-full" />

        <select name="matchType" className="input w-full" defaultValue="tournament" aria-label="Type de match">
          <option value="tournament">Tournoi</option>
          <option value="friendly">Amical</option>
        </select>

        <div className="col-span-1 sm:col-span-2 rounded-md border border-dashed border-white/10 p-3">
          <p className="text-xs font-semibold text-gray-400">
            Position dans le bracket à élimination directe (optionnel — laisser vide pour un match de poule)
          </p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="bracketRound"
              type="number"
              min={1}
              placeholder="N° de tour (1=1er tour, 2=suivant…)"
              className="input w-full"
            />
            <input
              name="bracketPosition"
              type="number"
              min={0}
              placeholder="Position dans le tour (0, 1, 2…)"
              className="input w-full"
            />
          </div>
        </div>

        <button type="submit" className="btn col-span-1 sm:col-span-2 w-full">
          Créer le match
        </button>
      </form>

      {/* Liste des matchs */}
      <div className="mt-8 space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="admin-card p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <p className="font-semibold text-white text-sm sm:text-base">
                  {m.homeTeam.name}{" "}
                  <span className="text-brand-400 font-bold">{m.homeScore ?? 0}</span> -{" "}
                  <span className="text-brand-400 font-bold">{m.awayScore ?? 0}</span>{" "}
                  {m.awayTeam.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(m.matchDate).toLocaleString("fr-FR")} · {m.venue ?? "lieu à définir"} ·{" "}
                  groupe {m.group ?? "-"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-300">
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
                <Link href={`/admin/matches/${m.id}/edit`} className="text-xs text-brand-500 hover:underline">
                  Modifier →
                </Link>
                <Link href={`/admin/matches/${m.id}/live`} className="text-xs text-brand-500 hover:underline">
                  Live Center →
                </Link>
                <Link href={`/admin/matches/${m.id}/lineup`} className="text-xs text-brand-500 hover:underline">
                  Compositions →
                </Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              {/* Formulaire Score */}
              <form
                action={handleUpdateScore.bind(null, m.id)}
                className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800"
              >
                <input
                  name="home"
                  type="number"
                  defaultValue={m.homeScore ?? 0}
                  aria-label="Score domicile"
                  className="input w-12 text-center text-xs py-1 px-1"
                />
                <span className="text-gray-500">-</span>
                <input
                  name="away"
                  type="number"
                  defaultValue={m.awayScore ?? 0}
                  aria-label="Score extérieur"
                  className="input w-12 text-center text-xs py-1 px-1"
                />
                <button type="submit" className="text-xs text-brand-500 hover:underline px-1 font-medium">
                  Mettre à jour
                </button>
              </form>

              {/* Formulaire Statut */}
              <form
                action={handleUpdateStatus.bind(null, m.id)}
                className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800"
              >
                <select
                  name="status"
                  defaultValue={m.status}
                  aria-label="Statut du match"
                  className="input text-xs py-1 px-2"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button type="submit" className="text-xs text-brand-500 hover:underline px-1 font-medium">
                  Changer
                </button>
              </form>

              {/* Action Dupliquer */}
              <form action={duplicateMatch.bind(null, m.id)}>
                <button className="text-xs text-gray-400 hover:text-white hover:underline py-1" type="submit">
                  Dupliquer
                </button>
              </form>

              {/* Action Supprimer */}
              <form action={deleteMatch.bind(null, m.id)}>
                <ConfirmButton
                  message={`Supprimer ce match (${m.homeTeam.name} vs ${m.awayTeam.name}) ? Ses événements et compositions seront aussi supprimés.`}
                  className="text-xs text-rose-500 hover:underline py-1"
                >
                  Supprimer
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}