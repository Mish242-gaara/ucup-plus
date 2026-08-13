"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/universities", label: "Universités" },
  { href: "/admin/teams", label: "Équipes" },
  { href: "/admin/players", label: "Joueurs" },
  { href: "/admin/matches", label: "Matchs" },
  { href: "/admin/cms", label: "Contenu / CMS" },
  { href: "/admin/news", label: "Actualités" },
  { href: "/admin/gallery", label: "Galerie" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/users", label: "Comptes admin" },
  { href: "/admin/audit", label: "Journal d'activité" },
  { href: "/admin/settings", label: "Réglages du tournoi" },
  { href: "/admin/account/2fa", label: "Sécurité (2FA)" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 space-y-1">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
            
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "block rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
                : "block rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-brand-500/10 hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}