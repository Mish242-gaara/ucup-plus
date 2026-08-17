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
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getElapsedSeconds, currentMinute } from "@/lib/elapsed-time";
import TeamLogo from "@/components/TeamLogo";

// Rendu dynamique pour recharger les statistiques et le match en direct à chaque navigation
export const dynamic = "force-dynamic";

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
    { 
      label: "En direct", 
      value: liveMatch ? 1 : 0, 
      icon: Radio,
      highlight: !!liveMatch,
      highlightClass: "border-rose-500/30 bg-rose-500/10 text-rose-400"
    },
    {
      label: "Inscriptions en attente",
      value: pendingPlayers,
      icon: UserPlus,
      highlight: pendingPlayers > 0,
      highlightClass: "border-amber-500/30 bg-amber-500/10 text-amber-400"
    },
  ];

  const lastScorer = liveMatch?.events[0];
  const liveMinute = liveMatch ? currentMinute(getElapsedSeconds(liveMatch)) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* En-tête du Tableau de bord */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
            <span>Administration</span>
            <span>•</span>
            <span>Vue globale</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Supervision générale de la compétition, exports de données et journalisation des événements.
          </p>
        </div>

        {/* Actions d'export rapide */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/export?type=standings"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-brand-500 active:scale-[0.99]"
          >
            <FileSpreadsheet size={14} /> Classement (CSV)
          </a>
          <a
            href="/api/admin/export?type=standings&format=pdf"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-brand-500 active:scale-[0.99]"
          >
            <FileText size={14} /> Classement (PDF)
          </a>
          <a
            href="/api/admin/export?type=players"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3.5 py-2 text-xs font-bold text-gray-200 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <FileSpreadsheet size={14} /> Joueurs (CSV)
          </a>
        </div>
      </div>

      {/* Cartes KPI (Statistiques) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 shadow-lg transition-all ${
              s.highlight && s.highlightClass
                ? s.highlightClass
                : "border-white/10 bg-zinc-900 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <s.icon size={18} className={s.highlight ? "currentColor" : "text-brand-400"} />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-gray-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grille principale des widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* --- Match Live Monitor --- */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400 flex items-center gap-2">
              <Radio size={14} className="animate-pulse text-rose-500" />
              Monitor Match en Direct
            </h2>
            {liveMatch && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                EN COURS
              </span>
            )}
          </div>

          {!liveMatch ? (
            <div className="flex h-36 items-center justify-center text-center">
              <p className="text-xs text-gray-500">Aucun match en direct actuellement sur la plateforme.</p>
            </div>
          ) : (
            <Link
              href={`/admin/matches/${liveMatch.id}/live`}
              className="mt-4 block rounded-lg border border-white/5 bg-zinc-950/60 p-4 transition-all hover:border-brand-500/40 hover:bg-zinc-950"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  {liveMatch.status === "halftime" ? "MI-TEMPS" : `${liveMinute}'`}
                </span>
                <span className="text-[10px] uppercase text-gray-400">Accéder au Control Center →</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2.5">
                  <TeamLogo name={liveMatch.homeTeam.name} logo={liveMatch.homeTeam.university.logo} size={32} />
                  <span className="text-sm font-bold text-white truncate">{liveMatch.homeTeam.name}</span>
                </div>

                <div className="rounded-md border border-white/10 bg-zinc-900 px-3 py-1 font-mono text-xl font-black text-white">
                  {liveMatch.homeScore} - {liveMatch.awayScore}
                </div>

                <div className="flex flex-1 items-center justify-end gap-2.5 text-right">
                  <span className="text-sm font-bold text-white truncate">{liveMatch.awayTeam.name}</span>
                  <TeamLogo name={liveMatch.awayTeam.name} logo={liveMatch.awayTeam.university.logo} size={32} />
                </div>
              </div>

              {lastScorer && (
                <div className="mt-3 border-t border-white/5 pt-2 text-center text-[11px] text-gray-400">
                  ⚽ Dernier but : <span className="font-semibold text-gray-200">{lastScorer.player.firstName} {lastScorer.player.lastName}</span> ({lastScorer.team.name})
                </div>
              )}
            </Link>
          )}
        </div>

        {/* --- Sponsors --- */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">Partenaires & Sponsors</h2>
            <Link href="/admin/sponsors" className="text-xs font-semibold text-gray-400 hover:text-brand-400 transition-colors">
              Gérer →
            </Link>
          </div>

          {sponsors.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-center">
              <p className="text-xs text-gray-500">Aucun sponsor enregistré dans la base.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2.5">
                {sponsors.slice(0, 8).map((s) => (
                  <div
                    key={s.id}
                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white p-2 shadow-sm transition-transform hover:scale-105"
                    title={s.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo} alt={s.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                <span className="font-bold text-white">{sponsors.length}</span> partenaire{sponsors.length > 1 ? "s" : ""} actif{sponsors.length > 1 ? "s" : ""} ·{" "}
                <span className="font-bold text-white">{sponsors.filter((s) => s.websiteUrl).length}</span> avec lien externe.
              </p>
            </div>
          )}
        </div>

        {/* --- Prochains matchs --- */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400">Prochains Matchs Programmés</h2>
            <Link href="/admin/matches" className="text-xs font-semibold text-gray-400 hover:text-brand-400 transition-colors">
              Calendrier complet →
            </Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-center">
              <p className="text-xs text-gray-500">Aucune rencontre à venir dans le calendrier.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Affiche</th>
                    <th className="py-2 text-right">Poule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {upcomingMatches.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-2.5 text-gray-400 font-mono">
                        {new Date(m.matchDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="py-2.5 font-semibold text-white">
                        {m.homeTeam.name} <span className="text-gray-500 font-normal">vs</span> {m.awayTeam.name}
                      </td>
                      <td className="py-2.5 text-right font-mono text-brand-400 font-bold">
                        {m.group ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- Journal de sécurité (Audit Log) --- */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <ShieldAlert size={14} />
              Journal d'Audit & Sécurité
            </h2>
            <Link href="/admin/audit" className="text-xs font-semibold text-gray-400 hover:text-brand-400 transition-colors">
              Historique complet →
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-center">
              <p className="text-xs text-gray-500">Aucune activité système enregistrée récemment.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Utilisateur</th>
                    <th className="py-2 text-right">Opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-2.5 text-gray-400 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="max-w-[140px] truncate py-2.5 text-gray-200 font-medium" title={log.actorEmail}>
                        {log.actorEmail}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[11px] font-bold text-brand-400">
                        {log.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}