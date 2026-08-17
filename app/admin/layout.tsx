import Link from "next/link";
import { HeartHandshake, LogOut, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex max-w-7xl">
        {/* Barre latérale fixe (Sidebar) */}
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-white/10 bg-black/80 px-4 py-6 backdrop-blur-md">
          <div className="space-y-6">
            {/* Branding U Cup */}
            <Link href="/admin" className="flex items-center gap-3 px-2">
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

            {/* Email de la session */}
            <div className="rounded-lg border border-white/5 bg-zinc-900/60 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Connecté en tant que
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-gray-300">
                {session?.email ?? "Administrateur"}
              </p>
            </div>

            {/* Liens de navigation principale */}
            <AdminNav />
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

        {/* Zone de contenu principal */}
        <main className="min-h-screen flex-1 bg-gradient-to-b from-brand-950/20 via-zinc-950 to-zinc-950 px-6 py-8 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}