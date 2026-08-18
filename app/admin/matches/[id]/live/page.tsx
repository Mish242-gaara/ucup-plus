import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, formatElapsed } from "@/lib/elapsed-time";
import {
  startTimer,
  pauseTimer,
  setHalftime,
  resumeTimer,
  stopTimer,
  addAdditionalTime,
  setExtraTime,
  setPenaltyShootout,
} from "@/lib/actions/timer";
import { addEvent, deleteEvent, addCommentary, deleteCommentary } from "@/lib/actions/events";
import QuickStatButtons from "@/components/QuickStatButtons";
import ConfirmButton from "@/components/ConfirmButton";
import WhatsAppShareLink from "@/components/WhatsAppShareLink";

export const dynamic = "force-dynamic";

const EVENT_TYPES = [
  { value: "goal", label: "⚽ But" },
  { value: "penalty_goal", label: "🎯 But sur penalty" },
  { value: "own_goal", label: "💥 But contre son camp" },
  { value: "yellow_card", label: "🟨 Carton jaune" },
  { value: "second_yellow", label: "🟥 Deuxième jaune (Exclusion)" },
  { value: "red_card", label: "🟥 Carton rouge direct" },
  { value: "substitution_in", label: "🔄 Entrée en jeu" },
  { value: "substitution_out", label: "⬅️ Sortie du joueur" },
  { value: "injury", label: "🚑 Blessure" },
  { value: "penalty_missed", label: "❌ Penalty manqué" },
  { value: "big_chance_missed", label: "⚠️ Grosse occasion manquée" },
];

const STATUS_LABELS: Record<string, string> = {
  scheduled: "À venir",
  live: "En direct",
  halftime: "Mi-temps",
  finished: "Terminé",
  postponed: "Reporté",
};

export default async function AdminLiveMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  if (isNaN(matchId)) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: { where: { status: "approved" }, orderBy: { jerseyNumber: "asc" } } } },
      awayTeam: { include: { players: { where: { status: "approved" }, orderBy: { jerseyNumber: "asc" } } } },
      events: { orderBy: [{ minute: "asc" }, { id: "asc" }], include: { player: true, team: true } },
      commentary: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
    },
  });

  if (!match) notFound();

  const elapsed = getElapsedSeconds(match);
  const allPlayers = [...match.homeTeam.players, ...match.awayTeam.players];

  // Extraction des Server Actions
  async function handleAddFirstHalfTime(formData: FormData) {
    "use server";
    await addAdditionalTime(matchId, "first", Number(formData.get("minutes")));
  }

  async function handleAddSecondHalfTime(formData: FormData) {
    "use server";
    await addAdditionalTime(matchId, "second", Number(formData.get("minutes")));
  }

  async function handleAddCommentary(formData: FormData) {
    "use server";
    const minute = Number(formData.get("minute"));
    const text = String(formData.get("text") ?? "");
    await addCommentary(matchId, minute, text);
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-2 sm:px-0 overflow-x-hidden">
      {/* --- Dashboard Header (Flashscore / Sofascore Style) --- */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex h-3 w-3 relative shrink-0">
              {match.status === "live" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  match.status === "live"
                    ? "bg-emerald-500"
                    : match.status === "halftime"
                    ? "bg-amber-500"
                    : "bg-zinc-600"
                }`}
              />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-brand-400">
              {formatElapsed(elapsed)} {match.timerPausedAt ? "(En pause)" : ""}
            </span>
          </div>

          <WhatsAppShareLink
            text={`⚽ ${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name} — Suis le direct sur ${
              process.env.NEXT_PUBLIC_SITE_URL ?? ""
            }/matches/${matchId}`}
          />
        </div>

        {/* Score Board */}
        <div className="mt-4 flex items-center justify-between gap-2 text-center">
          <div className="flex-1 text-right">
            <h2 className="text-sm font-bold text-white sm:text-2xl truncate">{match.homeTeam.name}</h2>
          </div>
          <div className="shrink-0 rounded-lg bg-zinc-950 px-3 py-1.5 sm:px-5 sm:py-2 font-mono text-2xl font-black text-white shadow-inner sm:text-4xl">
            {match.homeScore} - {match.awayScore}
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-sm font-bold text-white sm:text-2xl truncate">{match.awayTeam.name}</h2>
          </div>
        </div>
      </div>

      {/* --- Timer Controls --- */}
      <section className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-5 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contrôle du Minuteur</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={startTimer.bind(null, matchId)} className="flex-1 sm:flex-none">
            <button className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500" type="submit">
              ▶ Démarrer
            </button>
          </form>
          <form action={pauseTimer.bind(null, matchId)} className="flex-1 sm:flex-none">
            <button className="w-full rounded-md bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500" type="submit">
              ⏸ Pause
            </button>
          </form>
          <form action={setHalftime.bind(null, matchId)} className="flex-1 sm:flex-none">
            <button className="w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500" type="submit">
              ☕ Mi-Temps
            </button>
          </form>
          <form action={resumeTimer.bind(null, matchId)} className="flex-1 sm:flex-none">
            <button className="w-full rounded-md bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500" type="submit">
              🔄 Reprendre
            </button>
          </form>
          <form action={stopTimer.bind(null, matchId)} className="flex-1 sm:flex-none">
            <button className="w-full rounded-md bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500" type="submit">
              ⏹ Fin de Match
            </button>
          </form>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/5 pt-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <form action={handleAddFirstHalfTime} className="flex items-center gap-2">
            <input name="minutes" type="number" defaultValue={1} className="input w-16 text-center py-1" />
            <button className="font-semibold text-brand-400 hover:underline" type="submit">
              + Add. MT1
            </button>
          </form>

          <form action={handleAddSecondHalfTime} className="flex items-center gap-2">
            <input name="minutes" type="number" defaultValue={1} className="input w-16 text-center py-1" />
            <button className="font-semibold text-brand-400 hover:underline" type="submit">
              + Add. MT2
            </button>
          </form>

          <form action={setExtraTime.bind(null, matchId, !match.isExtraTime)} className="flex items-center">
            <button className="font-semibold text-indigo-400 hover:underline py-1" type="submit">
              {match.isExtraTime ? "❌ Annuler Prolongations" : "⏱️ Activer Prolongations"}
            </button>
          </form>

          <form action={setPenaltyShootout.bind(null, matchId, !match.isPenaltyShootout)} className="flex items-center">
            <button className="font-semibold text-amber-400 hover:underline py-1" type="submit">
              {match.isPenaltyShootout ? "❌ Annuler TAB" : "🎯 Activer Tirs au But"}
            </button>
          </form>
        </div>
      </section>

      {/* --- Quick-action Stats --- */}
      <section className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-5 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">Saisie Rapide des Stats Live</h2>
        <p className="mt-1 text-xs text-gray-400">
          Chaque incrémentation met à jour instantanément la vue publique SofaScore.
        </p>
        <div className="mt-4 overflow-x-auto">
          <QuickStatButtons
            matchId={matchId}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            initialPossession={match.homePossession ?? 50}
            initialStats={{
              shots: [match.homeShots ?? 0, match.awayShots ?? 0],
              shotsOnTarget: [match.homeShotsOnTarget ?? 0, match.awayShotsOnTarget ?? 0],
              corners: [match.homeCorners ?? 0, match.awayCorners ?? 0],
              fouls: [match.homeFouls ?? 0, match.awayFouls ?? 0],
              offsides: [match.homeOffsides ?? 0, match.awayOffsides ?? 0],
              saves: [match.homeSaves ?? 0, match.awaySaves ?? 0],
              freeKicks: [match.homeFreeKicks ?? 0, match.awayFreeKicks ?? 0],
              throwIns: [match.homeThrowIns ?? 0, match.awayThrowIns ?? 0],
              goalkicks: [match.homeGoalkicks ?? 0, match.awayGoalkicks ?? 0],
              penalties: [match.homePenalties ?? 0, match.awayPenalties ?? 0],
            }}
          />
        </div>
      </section>

      {/* --- Add Event Form --- */}
      <section className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-5 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Enregistrer un Événement</h2>
        <form action={addEvent} className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input type="hidden" name="matchId" value={matchId} />

          <select name="teamId" required className="input w-full">
            <option value={match.homeTeamId}>{match.homeTeam.name}</option>
            <option value={match.awayTeamId}>{match.awayTeam.name}</option>
          </select>

          <select name="eventType" required className="input w-full">
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select name="playerId" required className="input w-full">
            <option value="">Joueur principal…</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <input name="minute" type="number" placeholder="Minute (ex: 45)" required className="input w-full" />

          <select name="assistPlayerId" className="input w-full">
            <option value="">Passeur (Optionnel)</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <select name="outPlayerId" className="input w-full">
            <option value="">Joueur sortant (Optionnel)</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <input name="additionalTime" placeholder="Temps Add. (ex: +3)" className="input w-full" />
          <input name="description" placeholder="Note ou détails" className="input w-full" />

          <button type="submit" className="btn col-span-1 sm:col-span-2 md:col-span-4 bg-brand-600 hover:bg-brand-500 w-full">
            Valider l&apos;Événement
          </button>
        </form>
      </section>

      {/* --- Commentary Form --- */}
      <section className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-5 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">Commentaire Live / Fil d&apos;Actu</h2>
        <form action={handleAddCommentary} className="mt-3 flex flex-col sm:flex-row gap-2">
          <input name="minute" type="number" min={0} placeholder="Min." required className="input w-full sm:w-20 shrink-0" />
          <input name="text" placeholder="Description de l'action, arrêt décisif, ambiance..." required className="input flex-1 w-full" />
          <button type="submit" className="btn bg-zinc-800 hover:bg-zinc-700 shrink-0 w-full sm:w-auto">
            Publier
          </button>
        </form>
      </section>

      {/* --- Event & Commentary Feed --- */}
      <section className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-5 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Fil Événementiel Chronologique</h2>
        <ul className="mt-4 space-y-2">
          {[
            ...match.events.map((e) => ({ kind: "event" as const, minute: e.minute, sortKey: e.minute * 10, item: e })),
            ...match.commentary.map((c) => ({
              kind: "comment" as const,
              minute: c.minute,
              sortKey: c.minute * 10 + 1,
              item: c,
            })),
          ]
            .sort((a, b) => b.sortKey - a.sortKey) // Du plus récent au plus ancien
            .map((row) =>
              row.kind === "event" ? (
                <li
                  key={`e-${row.item.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 sm:px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-400 shrink-0">{row.item.minute}&apos;</span>
                    <span className="font-semibold text-white">
                      {EVENT_TYPES.find((t) => t.value === row.item.eventType)?.label ?? row.item.eventType}
                    </span>
                    <span className="text-gray-300 text-xs sm:text-sm">
                      — {row.item.player.firstName} {row.item.player.lastName} ({row.item.team.name})
                    </span>
                  </div>
                  <form action={deleteEvent.bind(null, row.item.id)} className="self-end sm:self-center">
                    <ConfirmButton message="Supprimer cet événement ?" className="text-xs text-rose-500 hover:underline">
                      Supprimer
                    </ConfirmButton>
                  </form>
                </li>
              ) : (
                <li
                  key={`c-${row.item.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/5 bg-zinc-950/50 px-3 sm:px-4 py-2.5 text-sm italic text-gray-400"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-bold text-gray-500 shrink-0">{row.item.minute}&apos;</span>
                    <span className="break-words text-xs sm:text-sm">💬 {row.item.text}</span>
                  </div>
                  <form action={deleteCommentary.bind(null, row.item.id, matchId)} className="self-end sm:self-center">
                    <ConfirmButton message="Supprimer ce commentaire ?" className="not-italic text-xs text-rose-500 hover:underline">
                      Supprimer
                    </ConfirmButton>
                  </form>
                </li>
              )
            )}
        </ul>
      </section>
    </div>
  );
}