"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, Award, Shirt, CalendarDays, MapPin } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";

type PlayerRow = {
  id: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  goals: number;
  photo: string | null;
};

type MatchRow = {
  id: number;
  matchDate: string;
  status: string;
  homeScore: number;
  awayScore: number;
  venue: string | null;
  round: string | null;
  group: string | null;
  homeTeam: { id: number; name: string; university: { logo: string | null } };
  awayTeam: { id: number; name: string; university: { logo: string | null } };
};

type TeamData = {
  id: number;
  name: string;
  category: string;
  year: number;
  coach: string | null;
  captain: { firstName: string; lastName: string } | null;
  university: {
    name: string;
    shortName: string;
    logo: string | null;
    city: string | null;
    foundedYear: number | null;
    colors: string | null;
    description: string | null;
    address?: string | null;
    website?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    isVerified?: boolean;
  };
  group: string | null;
  standing: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  } | null;
  trophies: number;
  finals: number;
};

type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};

const TABS = ["Aperçu", "Effectif", "Matchs", "Statistiques", "Actualités"] as const;
const TAB_PARAM: Record<string, (typeof TABS)[number]> = {
  apercu: "Aperçu",
  effectif: "Effectif",
  matchs: "Matchs",
  statistiques: "Statistiques",
  actualites: "Actualités",
};

function StatBlock({ icon: Icon, value, label }: { icon: typeof Trophy; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-white">
      <Icon size={20} className="text-brand-200" />
      <div>
        <p className="text-lg font-extrabold leading-none">{value}</p>
        <p className="text-xs text-brand-100">{label}</p>
      </div>
    </div>
  );
}

export default function TeamProfile({
  team,
  players,
  upcomingMatch,
  allMatches,
  articles,
}: {
  team: TeamData;
  players: PlayerRow[];
  upcomingMatch: MatchRow | null;
  allMatches: MatchRow[];
  articles: ArticleRow[];
}) {
  const searchParams = useSearchParams();
  const initialTab = TAB_PARAM[searchParams.get("tab") ?? ""] ?? "Aperçu";
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab);

  const topScorers = [...players]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  return (
    <main>
      {/* --- Hero --- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/teams" className="text-sm text-brand-100 hover:text-white">
            ← Retour aux équipes
          </Link>

          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-2 sm:h-28 sm:w-28">
                <TeamLogo name={team.name} logo={team.university?.logo ?? null} size={96} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">{team.name}</h1>
                <p className="mt-1 text-sm text-brand-100">{team.university.name}</p>
                {team.university.city && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-brand-100">
                    <MapPin size={12} /> {team.university.city}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {team.group && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Groupe {team.group}</span>
                  )}
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold capitalize">
                    {team.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBlock icon={Trophy} value={team.trophies} label="Trophée(s)" />
              <StatBlock icon={Award} value={team.finals} label="Finale(s)" />
              <StatBlock icon={Shirt} value={team.standing?.played ?? 0} label="Matchs joués" />
              <StatBlock icon={CalendarDays} value={team.year} label="1ère participation" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "whitespace-nowrap border-b-2 border-brand-500 px-4 py-3 text-sm font-bold text-brand-600"
                  : "whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-500 hover:text-ink"
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {tab === "Aperçu" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="site-card border-l-4 border-brand-500 p-5 lg:col-span-1">
              <h2 className="font-bold text-ink">Présentation</h2>
              <p className="mt-2 text-sm text-gray-500">
                {team.university.description ||
                  `${team.name} participe à l'UCUP 2026 avec ambition et détermination.`}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Entraîneur</dt>
                  <dd className="font-semibold text-ink">{team.coach || "À déterminer"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Capitaine</dt>
                  <dd className="font-semibold text-ink">
                    {team.captain ? `${team.captain.firstName} ${team.captain.lastName}` : "À déterminer"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Fondation</dt>
                  <dd className="font-semibold text-ink">{team.university.foundedYear ?? "—"}</dd>
                </div>
                {team.university.colors && (
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Couleurs</dt>
                    <dd className="font-semibold text-ink">{team.university.colors}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="site-card border-l-4 border-brand-500 p-5 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-ink">Effectif</h2>
                <button onClick={() => setTab("Effectif")} className="text-xs font-semibold text-brand-500 hover:underline">
                  Voir tout →
                </button>
              </div>
              <table className="mt-3 w-full text-left text-xs">
                <thead className="text-gray-400">
                  <tr>
                    <th className="pb-1.5">#</th>
                    <th className="pb-1.5">Joueur</th>
                    <th className="pb-1.5">Poste</th>
                    <th className="pb-1.5 text-right">Buts</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 5).map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="py-1.5 font-bold text-brand-500">{p.jerseyNumber}</td>
                      <td className="py-1.5">
                        <Link href={`/players/${p.id}`} className="hover:text-brand-500">
                          {p.firstName} {p.lastName}
                        </Link>
                      </td>
                      <td className="py-1.5 text-gray-500">{p.position}</td>
                      <td className="py-1.5 text-right font-semibold">{p.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {players.length === 0 && <p className="mt-3 text-sm text-gray-400">Effectif pas encore publié.</p>}
            </div>

            <div className="space-y-4 lg:col-span-1">
              <div className="site-card border-l-4 border-brand-500 p-5">
                <h2 className="font-bold text-ink">Prochain match</h2>
                {!upcomingMatch ? (
                  <p className="mt-3 text-sm text-gray-400">Aucun match programmé.</p>
                ) : (
                  <Link href={`/matches/${upcomingMatch.id}`} className="mt-3 block">
                    <p className="text-xs text-gray-400">
                      {upcomingMatch.round ?? (upcomingMatch.group ? `Groupe ${upcomingMatch.group}` : "UCUP 2026")}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <TeamLogo
                        name={upcomingMatch.homeTeam.name}
                        logo={upcomingMatch.homeTeam.university?.logo ?? null}
                        size={36}
                      />
                      <span className="text-sm font-bold text-gray-400">VS</span>
                      <TeamLogo
                        name={upcomingMatch.awayTeam.name}
                        logo={upcomingMatch.awayTeam.university?.logo ?? null}
                        size={36}
                      />
                    </div>
                    <p className="mt-2 text-center text-xs text-gray-500">
                      {new Date(upcomingMatch.matchDate).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                      })}
                      {upcomingMatch.venue && ` · ${upcomingMatch.venue}`}
                    </p>
                  </Link>
                )}
              </div>

              <div className="site-card border-l-4 border-brand-500 p-5">
                <h2 className="font-bold text-ink">Statistiques clés</h2>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Matchs joués", value: team.standing?.played ?? 0 },
                    { label: "Victoires", value: team.standing?.won ?? 0 },
                    { label: "Nuls", value: team.standing?.drawn ?? 0 },
                    { label: "Défaites", value: team.standing?.lost ?? 0 },
                    { label: "Buts marqués", value: team.standing?.goalsFor ?? 0 },
                    { label: "Buts encaissés", value: team.standing?.goalsAgainst ?? 0 },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-lg font-extrabold text-ink">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Effectif" && (
          <div className="site-card p-5">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="pb-2">#</th>
                  <th className="pb-2">Joueur</th>
                  <th className="pb-2">Poste</th>
                  <th className="pb-2 text-right">Buts</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2 font-bold text-brand-500">{p.jerseyNumber}</td>
                    <td className="py-2">
                      <Link href={`/players/${p.id}`} className="flex items-center gap-2 hover:text-brand-500">
                        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[10px] font-bold text-gray-400">
                          {p.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            `${p.firstName[0]}${p.lastName[0]}`
                          )}
                        </span>
                        {p.firstName} {p.lastName}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-500">{p.position}</td>
                    <td className="py-2 text-right font-semibold">{p.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {players.length === 0 && <p className="text-sm text-gray-400">Effectif pas encore publié.</p>}
          </div>
        )}

        {tab === "Matchs" && (
          <div className="space-y-2">
            {allMatches.map((m) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="site-card block p-4 text-sm hover:shadow-md"
              >
                {m.homeTeam.name} {m.status !== "scheduled" && `${m.homeScore} - ${m.awayScore}`} {m.awayTeam.name} —{" "}
                {new Date(m.matchDate).toLocaleDateString("fr-FR")}
              </Link>
            ))}
            {allMatches.length === 0 && <p className="text-sm text-gray-400">Aucun match programmé.</p>}
          </div>
        )}

        {tab === "Statistiques" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="site-card p-5">
              <h2 className="font-bold text-ink">Bilan de la saison</h2>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Joués", value: team.standing?.played ?? 0 },
                  { label: "Victoires", value: team.standing?.won ?? 0 },
                  { label: "Nuls", value: team.standing?.drawn ?? 0 },
                  { label: "Défaites", value: team.standing?.lost ?? 0 },
                  { label: "Pts", value: team.standing?.points ?? 0 },
                  { label: "Diff.", value: (team.standing?.goalsFor ?? 0) - (team.standing?.goalsAgainst ?? 0) },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-extrabold text-ink">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="site-card p-5">
              <h2 className="font-bold text-ink">Meilleurs buteurs</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {topScorers.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <Link href={`/players/${p.id}`} className="hover:text-brand-500">
                      {p.firstName} {p.lastName}
                    </Link>
                    <span className="font-bold text-brand-500">{p.goals}</span>
                  </li>
                ))}
                {topScorers.length === 0 && <p className="text-gray-400">Aucun but marqué pour le moment.</p>}
              </ul>
            </div>
          </div>
        )}

        {tab === "Actualités" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {articles.length === 0 ? (
              <p className="site-card col-span-2 p-8 text-center text-sm text-gray-400">
                Pas encore d&apos;actualités pour {team.name}.
              </p>
            ) : (
              articles.map((a) => (
                <Link key={a.id} href={`/actualites/${a.slug}`} className="site-card overflow-hidden hover:shadow-md">
                  {a.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImage} alt={a.title} className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="font-bold text-ink">{a.title}</p>
                    {a.excerpt && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{a.excerpt}</p>}
                    <p className="mt-2 text-xs text-gray-400">
                      {a.publishedAt && new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* --- CTA --- */}
      <div className="mx-auto mb-10 max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-ink px-6 py-5 text-white sm:flex-row">
          <div className="flex items-center gap-3">
            <Trophy size={22} className="text-brand-400" />
            <div>
              <p className="font-bold">Soutiens {team.name} tout au long de l&apos;UCUP 2026 !</p>
              <p className="text-sm text-gray-400">Chaque match compte, chaque soutien motive.</p>
            </div>
          </div>
          <Link href="/matches" className="site-btn shrink-0">
            Voir les matchs
          </Link>
        </div>
      </div>
    </main>
  );
}