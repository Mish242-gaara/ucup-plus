import Link from "next/link";
import { Shield } from "lucide-react";
import SponsorBar from "@/components/SponsorBar";
import { getSession } from "@/lib/auth";

const COLUMNS = [
  {
    title: "Compétition",
    links: [
      { href: "/matches", label: "Matchs" },
      { href: "/standings", label: "Classement" },
      { href: "/teams", label: "Équipes" },
    ],
  },
  {
    title: "Joueurs",
    links: [
      { href: "/players", label: "Tous les joueurs" },
      { href: "/players/leaderboard", label: "Classements individuels" },
      { href: "/inscription-joueur", label: "S'inscrire" },
    ],
  },
  {
    title: "Média",
    links: [
      { href: "/actualites", label: "Actualités" },
      { href: "/galerie", label: "Galerie" },
    ],
  },
  {
    title: "Infos",
    links: [{ href: "/mentions-legales", label: "Mentions légales" }],
  },
];

export default async function SiteFooter() {
  const session = await getSession();

  return (
    <footer className="relative z-10 mt-16 bg-ink text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold text-white">UCUP 2026</p>
            <p className="mt-2 text-sm text-gray-400">
              Championnat universitaire de football — Pointe-Noire &amp; Brazzaville.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-brand-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} UCUP 2026. Tous droits réservés.</span>
          {session?.isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 font-semibold text-brand-400 hover:text-brand-300">
              <Shield size={14} /> Administration
            </Link>
          )}
        </div>
      </div>
      <SponsorBar />
    </footer>
  );
}
