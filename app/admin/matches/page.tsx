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

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-white">Matchs</h1>
        <Link href="/bracket" className="ml-auto text-sm font-semibold text-brand-500 hover:underline">
          Voir le bracket →
        </Link>
      </div>

      <form action={createMatch} className="mt-6 grid max-w-2xl grid-cols-2 gap-3">
        <select name="homeTeamId" required className="input">
          <option value="">Équipe domicile…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="awayTeamId" required className="input">
          <option value="">Équipe visiteuse…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="matchDate" type="datetime-local" required className="input col-span-2" />
        <input name="venue" placeholder="Lieu" className="input" />
        <input name="group" placeholder="Groupe (A, B…)" className="input" />
        <input name="round" placeholder="Phase (Quart, Demi, Finale…)" className="input" />
        <select name="matchType" className="input" defaultValue="tournament">
          <option value="tournament">Tournoi</option>
          <option value="friendly">Amical</option>
        </select>
        <div className="col-span-2 rounded-md border border-dashed border-white/10 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Position dans le bracket à élimination directe (optionnel — laisser vide pour un match de poule)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <input
              name="bracketRound"
              type="number"
              min={1}
              placeholder="N° de tour (1=1er tour, 2=suivant…)"
              className="input"
            />
            <input
              name="bracketPosition"
              type="number"
              min={0}
              placeholder="Position dans le tour (0, 1, 2…)"
              className="input"
            />
          </div>
        </div>
        <button type="submit" className="btn col-span-2">
          Créer le match
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="admin-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {m.homeTeam.name} {m.homeScore} - {m.awayScore} {m.awayTeam.name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(m.matchDate).toLocaleString("fr-FR")} · {m.venue ?? "lieu à définir"} ·{" "}
                  groupe {m.group ?? "-"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs uppercase tracking-wide text-gray-300">
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
                <a href={`/admin/matches/${m.id}/edit`} className="text-xs text-brand-500 hover:underline">
                  Modifier →
                </a>
                <a href={`/admin/matches/${m.id}/live`} className="text-xs text-brand-500 hover:underline">
                  Live Center →
                </a>
                <a href={`/admin/matches/${m.id}/lineup`} className="text-xs text-brand-500 hover:underline">
                  Compositions →
                </a>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <form
                action={async (fd: FormData) => {
                  "use server";
                  const home = Number(fd.get("home"));
                  const away = Number(fd.get("away"));
                  await updateMatchScore(m.id, home, away);
                }}
                className="flex items-center gap-2"
              >
                <input name="home" type="number" defaultValue={m.homeScore} className="input w-14" />
                <span>-</span>
                <input name="away" type="number" defaultValue={m.awayScore} className="input w-14" />
                <button type="submit" className="text-xs text-brand-500 hover:underline">
                  Mettre à jour le score
                </button>
              </form>

              <form
                action={async (fd: FormData) => {
                  "use server";
                  await updateMatchStatus(m.id, fd.get("status") as any);
                }}
                className="flex items-center gap-2"
              >
                <select name="status" defaultValue={m.status} className="input">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button type="submit" className="text-xs text-brand-500 hover:underline">
                  Changer statut
                </button>
              </form>

              <form action={duplicateMatch.bind(null, m.id)}>
                <button className="text-xs text-gray-500 hover:underline" type="submit">
                  Dupliquer
                </button>
              </form>

              <form action={deleteMatch.bind(null, m.id)}>
                <ConfirmButton
                  message={`Supprimer ce match (${m.homeTeam.name} vs ${m.awayTeam.name}) ? Ses événements et compositions seront aussi supprimés.`}
                  className="text-xs text-brand-600 hover:underline"
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
