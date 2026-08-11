import Link from "next/link";
import {
  GraduationCap,
  Users,
  UserRound,
  CalendarDays,
  Radio,
  UserPlus,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import TeamLogo from "@/components/TeamLogo";

export default async function AdminDashboard() {
  const [
    universities,
    teams,
    players,
    matches,
    liveMatch,
    pendingPlayers,
    upcomingMatches,
    sponsors,
    auditLogs,
  ] = await Promise.all([
    prisma.university.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.match.findFirst({
      where: { status: { in: ["live", "halftime"] } },
      include: {
        homeTeam: { include: { university: true } },
        awayTeam: { include: { university: true } },
        events: {
          where: { eventType: { in: ["goal", "penalty_goal", "own_goal"] } },
          orderBy: { minute: "desc" },
          take: 1,
          include: { player: true, team: true },
        },
      },
    }),
    prisma.player.count({ where: { status: "pending" } }),
    prisma.match.findMany({
      where: { status: "scheduled" },
      orderBy: { matchDate: "asc" },
      take: 4,
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Universités", value: universities, icon: GraduationCap },
    { label: "Équipes", value: teams, icon: Users },
    { label: "Joueurs", value: players, icon: UserRound },
    { label: "Matchs", value: matches, icon: CalendarDays },
    { label: "En direct", value: liveMatch ? 1 : 0, icon: Radio },
    {
      label: "Inscriptions en attente",
      value: pendingPlayers,
      icon: UserPlus,
      highlight: pendingPlayers > 0,
    },
  ];

  const lastScorer = liveMatch?.events[0];
  const liveMinute = liveMatch ? currentMinute(getElapsedSeconds(liveMatch)) : null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Tableau de bord</h1>

      <div className="mt-3 flex flex-wrap gap-3">
        <a
          href="/api/admin/export?type=standings"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-500"
        >
          <FileSpreadsheet size={14} /> Classement (CSV)
        </a>
        <a
          href="/api/admin/export?type=standings&format=pdf"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-500"
        >
          <FileText size={14} /> Classement (PDF)
        </a>
        <a
          href="/api/admin/export?type=players"
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-700"
        >
          <FileSpreadsheet size={14} /> Joueurs (CSV)
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className={`admin-card p-4 ${s.highlight ? "ring-2 ring-yellow-500/40" : ""}`}>
            <s.icon size={18} className="text-brand-400" />
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* --- Match Live Monitor --- */}
        <div className="admin-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-brand-400">Match Live Monitor</h2>
          {!liveMatch ? (
            <p className="mt-4 text-sm text-gray-500">Aucun match en direct pour le moment.</p>
          ) : (
            <Link href={`/admin/matches/${liveMatch.id}/live`} className="mt-3 block">
              <div className="flex items-center gap-2 text-sm font-semibold text-live">
                {liveMinute}&apos;
                <span className="h-2 w-2 animate-pulse rounded-full bg-live" />
                <span className="rounded-full bg-live/20 px-2 py-0.5 text-xs text-live">LIVE</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamLogo name={liveMatch.homeTeam.name} logo={liveMatch.homeTeam.university.logo} size={32} />
                  <span className="text-sm font-semibold text-white">{liveMatch.homeTeam.name}</span>
                </div>
                <span className="text-xl font-extrabold text-white">
                  {liveMatch.homeScore} - {liveMatch.awayScore}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{liveMatch.awayTeam.name}</span>
                  <TeamLogo name={liveMatch.awayTeam.name} logo={liveMatch.awayTeam.university.logo} size={32} />
                </div>
              </div>
              {lastScorer && (
                <p className="mt-2 text-xs text-gray-400">
                  ⚽ {lastScorer.player.firstName} {lastScorer.player.lastName} ({lastScorer.team.name})
                </p>
              )}
            </Link>
          )}
        </div>

        {/* --- Sponsors --- */}
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-400">Sponsors</h2>
            <Link href="/admin/sponsors" className="text-xs text-gray-400 hover:text-brand-400">
              Gérer →
            </Link>
          </div>
          {sponsors.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucun sponsor pour le moment.</p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {sponsors.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white p-1.5"
                    title={s.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo} alt={s.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                {sponsors.length} sponsor{sponsors.length > 1 ? "s" : ""} actif
                {sponsors.length > 1 ? "s" : ""} · {sponsors.filter((s) => s.websiteUrl).length} avec site web
              </p>
            </>
          )}
        </div>

        {/* --- Prochains matchs --- */}
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-400">Prochains matchs</h2>
            <Link href="/admin/matches" className="text-xs text-gray-400 hover:text-brand-400">
              Tout voir →
            </Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucun match programmé.</p>
          ) : (
            <table className="mt-3 w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Match</th>
                  <th className="pb-2 text-right">Groupe</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMatches.map((m) => (
                  <tr key={m.id} className="border-t border-white/10">
                    <td className="py-1.5 text-gray-400">
                      {new Date(m.matchDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td className="py-1.5 text-white">
                      {m.homeTeam.name} vs {m.awayTeam.name}
                    </td>
                    <td className="py-1.5 text-right text-gray-400">{m.group ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* --- Journal de sécurité (audit) --- */}
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-400">Journal de sécurité</h2>
            <Link href="/admin/audit" className="text-xs text-gray-400 hover:text-brand-400">
              Tout voir →
            </Link>
          </div>
          {auditLogs.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucune activité récente.</p>
          ) : (
            <table className="mt-3 w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Acteur</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10">
                    <td className="py-1.5 text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td className="max-w-[120px] truncate py-1.5 text-white">{log.actorEmail}</td>
                    <td className="py-1.5 text-right font-mono text-brand-400">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
