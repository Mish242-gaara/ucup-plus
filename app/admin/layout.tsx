import Link from "next/link";
import { HeartHandshake, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex max-w-6xl">
        <aside className="min-h-screen w-56 shrink-0 border-r border-white/10 bg-black px-4 py-6">
          <Link href="/admin" className="flex items-center gap-2 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-white">
              <HeartHandshake size={18} />
            </span>
            <span>
              <span className="block text-sm font-extrabold leading-tight tracking-tight">UCUP Admin</span>
            </span>
          </Link>
          <p className="mt-3 truncate px-2 text-xs text-gray-500">{session?.email}</p>

          <AdminNav />

          <Link
            href="/"
            className="mt-6 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-white/5 hover:text-gray-300"
          >
            <LogOut size={14} /> Retour au site public
          </Link>
        </aside>
        <main className="min-h-screen flex-1 bg-gradient-to-b from-brand-900/40 via-zinc-950 to-zinc-950 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
