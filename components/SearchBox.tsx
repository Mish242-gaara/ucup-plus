"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Result = { id: number; name: string; subtitle: string };
type SearchResponse = { teams: Result[]; players: Result[] };

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>({ teams: [], players: [] });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ teams: [], players: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const hasResults = results.teams.length > 0 || results.players.length > 0;

  return (
    <div ref={containerRef} className="relative hidden shrink-0 sm:block">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Recherche"
        className="site-input w-40 pl-8 lg:w-56"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-gray-400">Aucun résultat pour « {query} ».</p>
          ) : (
            <>
              {results.teams.length > 0 && (
                <div>
                  <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-brand-500">Équipes</p>
                  {results.teams.map((t) => (
                    <button
                      key={`team-${t.id}`}
                      onClick={() => {
                        router.push(`/teams/${t.id}`);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full flex-col px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="font-semibold text-ink">{t.name}</span>
                      <span className="text-xs text-gray-400">{t.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.players.length > 0 && (
                <div>
                  <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-brand-500">Joueurs</p>
                  {results.players.map((p) => (
                    <button
                      key={`player-${p.id}`}
                      onClick={() => {
                        router.push(`/players/${p.id}`);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full flex-col px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="font-semibold text-ink">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="h-2" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
