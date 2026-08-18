"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartHandshake, LogOut, ArrowLeft, Menu, X } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* --- HEADER MOBILE COMPACT (Visible uniquement < 768px) --- */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/10 bg-black/95 px-4 backdrop-blur-md md:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-md">
            <HeartHandshake size={18} />
          </span>
          <div>
            <span className="block text-xs font-black text-white">UCUP Admin</span>
            <span className="block text-[9px] font-semibold text-brand-400">Console</span>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border border-white/10 bg-zinc-900 p-2 text-gray-300 hover:bg-zinc-800 active:scale-95 transition"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* --- OVERLAY MOBILE (Fond noir semi-transparent au clic) --- */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* --- SIDEBAR (Drawer coulissant sur mobile, fixe sur desktop) --- */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-white/10 bg-black px-4 py-6 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 overflow-y-auto no-scrollbar ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-6">
            {/* Branding Desktop */}
            <Link href="/admin" className="hidden md:flex items-center gap-3 px-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-md shadow-brand-500/20">
                <HeartHandshake size={20} />
              </span>
              <div>
                <span className="block text-sm font-black tracking-tight text-white">
                  UCUP Admin
                </span>
                <span className="block text-[10px] font-semibold text-brand-400">
                  Console de Gestion
                </span>
              </div>
            </Link>

            {/* Information utilisateur */}
            <div className="rounded-lg border border-white/5 bg-zinc-900/60 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Connecté en tant que
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-gray-300">
                {userEmail}
              </p>
            </div>

            {/* Menu de navigation */}
            <div onClick={() => setMobileMenuOpen(false)}>
              <AdminNav />
            </div>
          </div>

          {/* Pied de la barre latérale */}
          <div className="border-t border-white/10 pt-4 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={14} /> Voir le site public
            </Link>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={14} /> Se déconnecter
            </a>
          </div>
        </aside>

        {/* --- ZONE DU CONTENU PRINCIPAL --- */}
        <main className="min-h-screen flex-1 bg-gradient-to-b from-brand-950/20 via-zinc-950 to-zinc-950 px-4 py-6 md:px-10 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}