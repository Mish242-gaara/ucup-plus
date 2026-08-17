import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createUser, toggleUserAdmin, deleteUser } from "@/lib/actions/users";
import ConfirmButton from "@/components/ConfirmButton";
import {
  UserPlus,
  ShieldCheck,
  Shield,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, session] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getSession(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
          <Users size={14} />
          <span>Sécurité & Accès</span>
        </div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Gestion des comptes administrateurs
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Gérez les membres de l'équipe administrative, leurs rôles et la sécurité d'accès.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Formulaire de création rapide (4 cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <UserPlus size={16} className="text-brand-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Créer un nouvel utilisateur
              </h2>
            </div>

            <form action={createUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Nom complet
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Ex: John Doe"
                  required
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Adresse Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="admin@ucup.cg"
                  required
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Mot de passe
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="mt-1 block text-[10px] text-gray-500">
                  Minimum 8 caractères
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-950/60 p-3">
                <input
                  id="isAdmin"
                  name="isAdmin"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/10 bg-zinc-900 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isAdmin" className="text-xs font-medium text-gray-300 select-none cursor-pointer">
                  Accès Administrateur complet
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-brand-500 active:scale-[0.99]"
              >
                Créer le compte
              </button>
            </form>
          </div>
        </div>

        {/* Tableau des utilisateurs (8 cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Comptes enregistrés ({users.length})
              </h2>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="pb-3 font-semibold">Utilisateur</th>
                    <th className="pb-3 font-semibold">Rôle</th>
                    <th className="pb-3 font-semibold text-center">2FA</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => {
                    const isSelf = u.id === session?.userId;

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                        {/* Identité */}
                        <td className="py-3">
                          <div className="font-bold text-white flex items-center gap-2">
                            {u.name}
                            {isSelf && (
                              <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-400 border border-brand-500/30">
                                VOUS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400">{u.email}</div>
                        </td>

                        {/* Rôle & Switch */}
                        <td className="py-3">
                          {isSelf ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                              <ShieldCheck size={12} /> {u.isAdmin ? "Admin" : "Staff"}
                            </span>
                          ) : (
                            <form action={toggleUserAdmin.bind(null, u.id, !u.isAdmin)}>
                              <button
                                type="submit"
                                title="Cliquer pour changer le rôle"
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-all hover:scale-105 ${
                                  u.isAdmin
                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                                    : "border-gray-500/30 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                                }`}
                              >
                                {u.isAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                {u.isAdmin ? "Admin" : "Staff"}
                              </button>
                            </form>
                          )}
                        </td>

                        {/* Double Authentification */}
                        <td className="py-3 text-center">
                          {u.twoFactorConfirmedAt ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                              <CheckCircle2 size={13} /> Activé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500 text-[11px]">
                              <XCircle size={13} /> Non activé
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          {!isSelf && (
                            <form action={deleteUser.bind(null, u.id)} className="inline-block">
                              <ConfirmButton
                                message={`Êtes-vous sûr de vouloir supprimer le compte ${u.email} ?`}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                              >
                                <Trash2 size={12} /> Supprimer
                              </ConfirmButton>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}