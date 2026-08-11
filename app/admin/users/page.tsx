import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createUser, toggleUserAdmin, deleteUser } from "@/lib/actions/users";
import ConfirmButton from "@/components/ConfirmButton";

export default async function UsersPage() {
  const [users, session] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getSession(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Comptes admin</h1>

      <form action={createUser} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <input name="name" placeholder="Nom" required className="input" />
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input name="password" type="password" placeholder="Mot de passe (min. 8 car.)" required minLength={8} className="input" />
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input name="isAdmin" type="checkbox" className="h-4 w-4" />
          Administrateur
        </label>
        <button type="submit" className="btn col-span-2">
          Créer le compte
        </button>
      </form>

      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="pb-2">Nom</th>
            <th className="pb-2">Email</th>
            <th className="pb-2">Rôle</th>
            <th className="pb-2">2FA</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-white/10">
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.email}</td>
              <td className="py-2">
                <form action={toggleUserAdmin.bind(null, u.id, !u.isAdmin)}>
                  <button type="submit" className="text-xs text-brand-500 hover:underline">
                    {u.isAdmin ? "Admin" : "Staff"} (changer)
                  </button>
                </form>
              </td>
              <td className="py-2">{u.twoFactorConfirmedAt ? "✅" : "—"}</td>
              <td className="py-2 text-right">
                {u.id !== session?.userId && (
                  <form action={deleteUser.bind(null, u.id)}>
                    <ConfirmButton
                      message={`Supprimer le compte ${u.email} ?`}
                      className="text-brand-600 hover:underline"
                    >
                      Supprimer
                    </ConfirmButton>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
