"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Star, Trophy } from "lucide-react";
import SearchBox from "@/components/SearchBox";

const TABS = [
  { href: "/matches", label: "Tous", filter: undefined },
  { href: "/matches?filter=live", label: "En direct", filter: "live" },
  { href: "/matches?filter=finished", label: "Résultats", filter: "finished" },
  { href: "/matches?filter=upcoming", label: "Calendrier", filter: "upcoming" },
  { href: "/standings", label: "Classements", filter: undefined },
  { href: "/bracket", label: "Bracket", filter: undefined },
  { href: "/teams", label: "Équipes", filter: undefined },
  { href: "/players", label: "Joueurs", filter: undefined },
];

export default function PublicNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter");

  function isActive(t: (typeof TABS)[number]) {
    if (t.href.startsWith("/matches")) {
      return pathname === "/matches" && (t.filter ?? null) === currentFilter;
    }
    return pathname === t.href;
  }

  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
            <Trophy size={16} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">UCUP 2026</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {TABS.map((t) => {
            const active = isActive(t);
            return (
              <Link
                key={t.label}
                href={t.href}
                className={
                  active
                    ? "flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 px-4 py-1.5 text-sm font-bold text-white"
                    : "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-ink"
                }
              >
                {t.label}
                {active && t.filter === "live" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/favoris"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-gray-500 hover:text-brand-500 sm:flex"
        >
          <Star size={16} /> Favoris
        </Link>

        <SearchBox />
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
        {TABS.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={
              isActive(t)
                ? "whitespace-nowrap rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white"
                : "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
