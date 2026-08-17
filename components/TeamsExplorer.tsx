"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, LayoutGrid, List, Users2, RotateCcw, Shield, Shirt, Goal, ShieldAlert } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import { useFavorites } from "@/lib/hooks/useFavorites";

type TeamRow = {
  id: number;
  name: string;
  university: { name: string; logo: string | null };
  group: string | null;
  playerCount: number;
  matchCount: number;
};

const SORTS = {
  name: (a: TeamRow, b: TeamRow) => a.name.localeCompare(b.name),
  players: (a: TeamRow, b: TeamRow) => b.playerCount - a.playerCount,
  matches: (a: TeamRow, b: TeamRow) => b.matchCount - a.matchCount,
} as const;

function TeamCard({
  team,
  favorite,
  onToggleFavorite,
  compact,
}: {
  team: TeamRow;
  favorite: boolean;
  onToggleFavorite: () => void;
  compact: boolean;
}) {
  return (
    <div className={`site-card relative p-4 ${compact ? "flex items-center gap-4" : "text-center"}`}>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite();
        }}
        className="absolute right-3 top-3 text-gray-300 hover:text-brand-500 transition-colors"
        title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Star size={18} className={favorite ? "fill-brand-500 text-brand-500" : ""} />
      </button>

      <Link href={`/teams/${team.id}`} className={compact ? "flex flex-1 items-center gap-4" : "block"}>
        <div className={compact ? "" : "mx-auto"} style={{ width: compact ? undefined : "fit-content" }}>
          <TeamLogo name={team.name} logo={team.university?.logo ?? null} size={compact ? 48 : 72} />
        </div>
        <div className={compact ? "flex-1" : "mt-3"}>
          <p className="font-bold text-ink hover:text-brand-600 transition-colors">{team.name}</p>
          <p className={`text-xs text-gray-500 ${compact ? "" : "mx-auto max-w-[180px]"}`}>{team.university.name}</p>
          <div className={`mt-2 flex items-center gap-2 ${compact ? "" : "justify-center"}`}>
            {team.group && (
              <span className="rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-extrabold text-brand-700">
                Groupe {team.group}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500">
            {team.playerCount} joueurs · {team.matchCount} matchs
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function TeamsExplorer({
  teams,
  overview,
}: {
  teams: TeamRow[];
  overview: { totalPlayers: number; matchesPlayed: number; goalsFor: number; goalsAgainst: number };
}) {
  const { isFavorite, toggle } = useFavorites();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [sortKey, setSortKey] = useState<keyof typeof SORTS>("name");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mode, setMode] = useState<"all" | "grouped">("all");

  const groups = useMemo(
    () => Array.from(new Set(teams.map((t) => t.group).filter(Boolean))).sort() as string[],
    [teams]
  );

  const filtered = useMemo(() => {
    return teams
      .filter((t) => (group === "all" ? true : t.group === group))
      .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
      .sort(SORTS[sortKey]);
  }, [teams, query, group, sortKey]);

  function reset() {
    setQuery("");
    setGroup("all");
    setSortKey("name");
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TeamRow[]>();
    for (const t of filtered) {
      const key = t.group ?? "Sans groupe";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <section className="lg:col-span-3">
        {/* --- Onglets de basculement de vue --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("all")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-all ${
                mode === "all"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-ink"
              }`}
            >
              <LayoutGrid size={15} /> Toutes les équipes
            </button>
            <button
              onClick={() => setMode("grouped")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-all ${
                mode === "grouped"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-ink"
              }`}
            >
              <Users2 size={15} /> Par groupe
            </button>
          </div>
        </div>

        {/* --- Entête résultats et filtres rapides --- */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-600">
            <span className="font-bold text-ink">{filtered.length}</span> équipe{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as keyof typeof SORTS)}
              className="site-input py-1.5 text-xs font-semibold"
            >
              <option value="name">Trier par nom</option>
              <option value="players">Trier par effectif</option>
              <option value="matches">Trier par matchs joués</option>
            </select>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded transition-colors ${view === "grid" ? "bg-brand-600 text-white" : "text-gray-500 hover:text-ink"}`}
                title="Vue en grille"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded transition-colors ${view === "list" ? "bg-brand-600 text-white" : "text-gray-500 hover:text-ink"}`}
                title="Vue en liste"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* --- Affichage des équipes --- */}
        {mode === "all" ? (
          <div className={`mt-4 grid gap-4 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {filtered.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                favorite={isFavorite(t.id)}
                onToggleFavorite={() => toggle(t.id)}
                compact={view === "list"}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm font-medium text-gray-500">
                Aucune équipe ne correspond à vos critères.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-8">
            {grouped.map(([g, teamsInGroup]) => (
              <div key={g} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-brand-600">
                    {g === "Sans groupe" ? g : `Groupe ${g}`}
                  </h2>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {teamsInGroup.map((t) => (
                    <TeamCard
                      key={t.id}
                      team={t}
                      favorite={isFavorite(t.id)}
                      onToggleFavorite={() => toggle(t.id)}
                      compact={view === "list"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Barre latérale aperçu & filtres --- */}
      <aside className="space-y-4">
        <div className="site-card p-4">
          <h2 className="border-l-4 border-brand-500 pl-2 text-sm font-extrabold text-ink">Aperçu général</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-gray-600">
                <Shield size={15} className="text-brand-500" /> Total équipes
              </span>
              <span className="font-extrabold text-ink">{teams.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-gray-600">
                <Shirt size={15} className="text-brand-500" /> Total joueurs
              </span>
              <span className="font-extrabold text-ink">{overview.totalPlayers}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-gray-600">
                <Goal size={15} className="text-brand-500" /> Matchs joués
              </span>
              <span className="font-extrabold text-ink">{overview.matchesPlayed}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-gray-600">
                <Star size={15} className="text-brand-500" /> Buts marqués
              </span>
              <span className="font-extrabold text-ink">{overview.goalsFor}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-gray-600">
                <ShieldAlert size={15} className="text-brand-500" /> Buts encaissés
              </span>
              <span className="font-extrabold text-ink">{overview.goalsAgainst}</span>
            </li>
          </ul>
        </div>

        <div className="site-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">Filtres</h2>
            <button onClick={reset} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
              <RotateCcw size={12} /> Réinitialiser
            </button>
          </div>

          <label className="mt-4 block text-xs font-bold text-gray-700">Recherche</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une équipe..."
            className="site-input mt-1 w-full"
          />

          <label className="mt-4 block text-xs font-bold text-gray-700">Filtrer par groupe</label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="site-input mt-1 w-full">
            <option value="all">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                Groupe {g}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-xs font-bold text-gray-700">Trier par</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as keyof typeof SORTS)}
            className="site-input mt-1 w-full"
          >
            <option value="name">Nom (A-Z)</option>
            <option value="players">Effectif</option>
            <option value="matches">Matchs joués</option>
          </select>
        </div>
      </aside>
    </div>
  );
}