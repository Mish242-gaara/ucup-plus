import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamLogo from "@/components/TeamLogo";
import RecentFormChart from "@/components/RecentFormChart";
import { computeMatchRating } from "@/lib/rating";
import type { Metadata } from "next";

function age(birthDate: Date | null) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id: Number(id) },
    select: { firstName: true, lastName: true, position: true, goals: true, status: true, team: { select: { name: true } } },
  });

  if (!player || player.status !== "approved") return { title: "Joueur introuvable — UCUP 2026" };

  const title = `${player.firstName} ${player.lastName} — ${player.team.name} — UCUP 2026`;
  const description = `${player.position} · ${player.goals} but(s) cette édition.`;

  return { title, description, openGraph: { title, description } };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: { include: { university: true } } },
  });

  if (!player || player.status !== "approved") notFound();

  const lineups = await prisma.matchLineup.findMany({
    where: { playerId },
    include: {
      match: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: { match: { matchDate: "desc" } },
    take: 10,
  });

  const finishedLineups = lineups.filter((l) => l.match.status === "finished");
  const matchIds = finishedLineups.map((l) => l.matchId);

  const events = matchIds.length
    ? await prisma.matchEvent.findMany({
        where: { playerId, matchId: { in: matchIds } },
      })
    : [];

  const assistEvents = matchIds.length
    ? await prisma.matchEvent.findMany({
        where: { assistPlayerId: playerId, matchId: { in: matchIds } },
      })
    : [];

  const eventsByMatch = new Map<number, typeof events>();
  for (const e of events) {
    eventsByMatch.set(e.matchId, [...(eventsByMatch.get(e.matchId) ?? []), e]);
  }
  const assistsByMatch = new Map<number, number>();
  for (const e of assistEvents) {
    assistsByMatch.set(e.matchId, (assistsByMatch.get(e.matchId) ?? 0) + 1);
  }

  const history = finishedLineups.map((l) => {
    const m = l.match;
    const isHome = m.homeTeamId === l.teamId;
    const opponent = isHome ? m.awayTeam.name : m.homeTeam.name;
    const matchEvents = eventsByMatch.get(m.id) ?? [];
    const goals = matchEvents.filter((e) => ["goal", "penalty_goal"].includes(e.eventType)).length;
    const assists = assistsByMatch.get(m.id) ?? 0;
    const yellow = matchEvents.filter((e) => e.eventType === "yellow_card" || e.eventType === "second_yellow").length;
    const red = matchEvents.filter((e) => e.eventType === "red_card" || e.eventType === "second_yellow").length;

    const teamScore = isHome ? m.homeScore : m.awayScore;
    const otherScore = isHome ? m.awayScore : m.homeScore;
    const teamResult = teamScore > otherScore ? "win" : teamScore < otherScore ? "loss" : "draw";
    const rating = computeMatchRating({ goals, assists, yellowCards: yellow, redCards: red, teamResult });

    return {
      matchId: m.id,
      date: m.matchDate,
      opponent,
      score: `${m.homeScore} - ${m.awayScore}`,
      role: l.role === "starter" ? "Titulaire" : "Remplaçant",
      goals,
      yellow,
      red,
      rating,
    };
  });

  const formData = [...history]
    .slice(0, 5)
    .reverse()
    .map((h, i) => ({ label: `M${i + 1}`, goals: h.goals }));

  const avgRating =
    history.length > 0 ? Math.round((history.reduce((sum, h) => sum + h.rating, 0) / history.length) * 10) / 10 : null;

  const stats = [
    { label: "Buts", value: player.goals },
    { label: "Passes décisives", value: player.assists },
    { label: "Matchs joués", value: player.matchesPlayed },
    { label: "Précision passes", value: `${player.passAccuracy}%` },
    { label: "Note moyenne", value: avgRating !== null ? `${avgRating}/10` : "—" },
  ];

  const keyInfo = [
    { label: "Université", value: player.team.university.shortName },
    { label: "Numéro", value: `#${player.jerseyNumber}` },
    { label: "Poste", value: player.position },
    { label: "Âge", value: age(player.birthDate) ? `${age(player.birthDate)} ans` : "—" },
    { label: "Nationalité", value: player.nationality },
    { label: "Taille", value: player.height ? `${player.height} cm` : "—" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Header — text on the left, large photo on the right */}
      <div className="flex items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 via-brand-600 to-brand-700 px-6 py-6 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-100">Profil joueur</p>
          <h1 className="text-3xl font-extrabold">
            {player.firstName} {player.lastName}
          </h1>
          <Link href={`/teams/${player.teamId}`} className="text-sm text-brand-100 hover:underline">
            {player.team.name}
          </Link>
          <p className="mt-1 text-sm text-brand-100">
            #{player.jerseyNumber} · {player.position}
          </p>
        </div>

        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30 bg-white/10 sm:h-32 sm:w-32">
          {player.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photo}
              alt={`${player.firstName} ${player.lastName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/70">
              {player.firstName[0]}
              {player.lastName[0]}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="site-card flex items-center gap-4 p-5">
          <TeamLogo name={player.team.name} logo={player.team.university.logo} size={56} />
          <div>
            <p className="text-lg font-bold text-ink">
              {player.firstName} {player.lastName}
            </p>
            <p className="text-sm text-gray-400">{player.team.name}</p>
          </div>
        </div>

        <div className="site-card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Statistiques de l&apos;édition</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-ink">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="site-card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Informations clés</p>
          <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
            {keyInfo.map((k) => (
              <div key={k.label}>
                <dt className="text-gray-400">{k.label}</dt>
                <dd className="font-semibold text-ink">{k.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="site-card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">
            Forme récente (buts / 5 derniers matchs)
          </p>
          <div className="mt-3">
            <RecentFormChart data={formData} />
          </div>
        </div>
      </div>

      <div className="site-card mt-6 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Parcours récent</p>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Pas encore de matchs terminés.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-gray-400">
              <tr>
                <th className="pb-2">Date</th>
                <th className="pb-2">Adversaire</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Buts</th>
                <th className="pb-2">Cartons</th>
                <th className="pb-2 text-right">Note</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.matchId} className="border-t border-gray-100">
                  <td className="py-2">{new Date(h.date).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2">
                    <Link href={`/matches/${h.matchId}`} className="hover:text-brand-500">
                      {h.opponent}
                    </Link>
                  </td>
                  <td className="py-2">{h.score}</td>
                  <td className="py-2">{h.role}</td>
                  <td className="py-2">{h.goals || "—"}</td>
                  <td className="py-2">
                    {h.yellow > 0 && "🟨"} {h.red > 0 && "🟥"}
                    {h.yellow === 0 && h.red === 0 && "—"}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        h.rating >= 7 ? "bg-green-50 text-green-700" : h.rating < 5 ? "bg-brand-50 text-brand-600" : "text-gray-500"
                      }`}
                    >
                      {h.rating.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
