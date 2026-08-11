import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, formatElapsed } from "@/lib/elapsed-time";
import {
  startTimer,
  pauseTimer,
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

const EVENT_TYPES = [
  "goal",
  "penalty_goal",
  "own_goal",
  "yellow_card",
  "second_yellow",
  "red_card",
  "substitution_in",
  "substitution_out",
  "injury",
  "penalty_missed",
  "big_chance_missed",
];

export default async function AdminLiveMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: { where: { status: "approved" } } } },
      awayTeam: { include: { players: { where: { status: "approved" } } } },
      events: { orderBy: [{ minute: "asc" }, { id: "asc" }], include: { player: true, team: true } },
      commentary: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
    },
  });

  if (!match) notFound();

  const elapsed = getElapsedSeconds(match);
  const allPlayers = [...match.homeTeam.players, ...match.awayTeam.players];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">
        {match.homeTeam.name} {match.homeScore} - {match.awayScore} {match.awayTeam.name}
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        Statut : <span className="text-gray-300">{match.status}</span> · Temps :{" "}
        <span className="tabular-nums text-gray-300">{formatElapsed(elapsed)}</span>
        {match.timerPausedAt ? " (en pause)" : ""}
      </p>
      <div className="mt-2">
        <WhatsAppShareLink
          text={`⚽ ${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name} — suis le direct sur ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/matches/${matchId}`}
        />
      </div>

      {/* --- Timer controls --- */}
      <section className="mt-6 admin-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Minuteur</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={startTimer.bind(null, matchId)}>
            <button className="btn" type="submit">
              Démarrer
            </button>
          </form>
          <form action={pauseTimer.bind(null, matchId)}>
            <button className="btn" type="submit">
              Pause / Mi-temps
            </button>
          </form>
          <form action={resumeTimer.bind(null, matchId)}>
            <button className="btn" type="submit">
              Reprendre
            </button>
          </form>
          <form action={stopTimer.bind(null, matchId)}>
            <button className="btn" type="submit">
              Terminer le match
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4 text-sm">
          <form
            action={async (fd: FormData) => {
              "use server";
              await addAdditionalTime(matchId, "first", Number(fd.get("minutes")));
            }}
            className="flex items-end gap-2"
          >
            <div>
              <label className="block text-xs text-gray-400">Temps additionnel 1ère mi-temps</label>
              <input name="minutes" type="number" defaultValue={1} className="input w-20" />
            </div>
            <button className="text-brand-500 hover:underline" type="submit">
              Ajouter
            </button>
          </form>

          <form
            action={async (fd: FormData) => {
              "use server";
              await addAdditionalTime(matchId, "second", Number(fd.get("minutes")));
            }}
            className="flex items-end gap-2"
          >
            <div>
              <label className="block text-xs text-gray-400">Temps additionnel 2e mi-temps</label>
              <input name="minutes" type="number" defaultValue={1} className="input w-20" />
            </div>
            <button className="text-brand-500 hover:underline" type="submit">
              Ajouter
            </button>
          </form>

          <form action={setExtraTime.bind(null, matchId, !match.isExtraTime)}>
            <button className="text-brand-500 hover:underline" type="submit">
              {match.isExtraTime ? "Désactiver" : "Activer"} la prolongation
            </button>
          </form>

          <form action={setPenaltyShootout.bind(null, matchId, !match.isPenaltyShootout)}>
            <button className="text-brand-500 hover:underline" type="submit">
              {match.isPenaltyShootout ? "Désactiver" : "Activer"} les tirs au but
            </button>
          </form>
        </div>
      </section>

      {/* --- Quick-action stats (feeds the public Match Centre "Stats" tab) --- */}
      <section className="mt-6 admin-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Statistiques en direct
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Chaque clic se répercute immédiatement sur l&apos;onglet Stats du Match Centre public.
        </p>
        <div className="mt-4">
          <QuickStatButtons
            matchId={matchId}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            initialPossession={match.homePossession ?? 50}
            initialStats={{
              shots: [match.homeShots, match.awayShots],
              shotsOnTarget: [match.homeShotsOnTarget ?? 0, match.awayShotsOnTarget ?? 0],
              corners: [match.homeCorners, match.awayCorners],
              fouls: [match.homeFouls, match.awayFouls],
              offsides: [match.homeOffsides, match.awayOffsides],
              saves: [match.homeSaves, match.awaySaves],
              freeKicks: [match.homeFreeKicks, match.awayFreeKicks],
              throwIns: [match.homeThrowIns, match.awayThrowIns],
              goalkicks: [match.homeGoalkicks, match.awayGoalkicks],
              penalties: [match.homePenalties, match.awayPenalties],
            }}
          />
        </div>
      </section>

      {/* --- Add event --- */}
      <section className="mt-6 admin-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Ajouter un événement</h2>
        <form action={addEvent} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="hidden" name="matchId" value={matchId} />

          <select name="teamId" required className="input">
            <option value={match.homeTeamId}>{match.homeTeam.name}</option>
            <option value={match.awayTeamId}>{match.awayTeam.name}</option>
          </select>

          <select name="eventType" required className="input">
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select name="playerId" required className="input">
            <option value="">Joueur…</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber} {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <input name="minute" type="number" placeholder="Minute" required className="input" />

          <select name="assistPlayerId" className="input">
            <option value="">Passeur (optionnel)</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber} {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <select name="outPlayerId" className="input">
            <option value="">Joueur sorti (optionnel)</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber} {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <input name="additionalTime" placeholder="Temps add. (+2…)" className="input" />
          <input name="description" placeholder="Note" className="input" />

          <button type="submit" className="btn col-span-2 sm:col-span-4">
            Ajouter l&apos;événement
          </button>
        </form>
      </section>

      {/* --- Add commentary --- */}
      <section className="mt-6 admin-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-400">
          Ajouter un commentaire
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Texte libre (occasion manquée, ambiance, tactique…), affiché dans le fil du match aux côtés
          des événements suivis (buts, cartons…).
        </p>
        <form
          action={async (fd: FormData) => {
            "use server";
            await addCommentary(matchId, Number(fd.get("minute")), String(fd.get("text") ?? ""));
          }}
          className="mt-3 grid grid-cols-6 gap-2"
        >
          <input name="minute" type="number" min={0} placeholder="Min." required className="input col-span-1" />
          <input name="text" placeholder="Commentaire…" required className="input col-span-4" />
          <button type="submit" className="btn col-span-1">
            Ajouter
          </button>
        </form>
      </section>

      {/* --- Event & commentary feed --- */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Fil du match</h2>
        <ul className="mt-3 space-y-2">
          {[
            ...match.events.map((e) => ({ kind: "event" as const, minute: e.minute, sortKey: e.minute * 10, item: e })),
            ...match.commentary.map((c) => ({
              kind: "comment" as const,
              minute: c.minute,
              sortKey: c.minute * 10 + 1,
              item: c,
            })),
          ]
            .sort((a, b) => a.sortKey - b.sortKey)
            .map((row) =>
              row.kind === "event" ? (
                <li
                  key={`e-${row.item.id}`}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm"
                >
                  <span>
                    {row.item.minute}&apos; — {row.item.eventType} — {row.item.player.firstName}{" "}
                    {row.item.player.lastName} ({row.item.team.name})
                  </span>
                  <form action={deleteEvent.bind(null, row.item.id)}>
                    <ConfirmButton message="Supprimer cet événement ?" className="text-brand-600 hover:underline">
                      Supprimer
                    </ConfirmButton>
                  </form>
                </li>
              ) : (
                <li
                  key={`c-${row.item.id}`}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm italic text-gray-400"
                >
                  <span>
                    {row.item.minute}&apos; — 💬 {row.item.text}
                  </span>
                  <form action={deleteCommentary.bind(null, row.item.id, matchId)}>
                    <ConfirmButton message="Supprimer ce commentaire ?" className="not-italic text-brand-600 hover:underline">
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
