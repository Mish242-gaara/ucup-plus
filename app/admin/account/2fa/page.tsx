import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TwoFactorSetup from "@/components/TwoFactorSetup";

export default async function TwoFactorPage() {
  const session = await getSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.userId } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Sécurité du compte</h1>
      <p className="mt-1 text-sm text-gray-400">Connecté en tant que {user.email}</p>

      <div className="mt-6 max-w-md admin-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Double authentification (2FA)
        </h2>
        <div className="mt-3">
          <TwoFactorSetup isEnabled={Boolean(user.twoFactorConfirmedAt)} />
        </div>
      </div>
    </div>
  );
}
