import { prisma } from "@/lib/prisma";
import RegistrationForm from "@/components/RegistrationForm";

export default async function InscriptionJoueurPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink">Inscription joueur</h1>
      <p className="mt-1 text-sm text-gray-400">
        Rejoins ton équipe pour l&apos;UCUP 2026. Un encadrant validera ton profil.
      </p>
      <div className="mt-6">
        <RegistrationForm teams={teams} />
      </div>
      <p className="mt-4 text-xs text-gray-400">
        En t&apos;inscrivant, tu acceptes que ces informations soient utilisées pour la gestion du
        tournoi. Détails dans les{" "}
        <a href="/mentions-legales" className="underline hover:text-brand-500">
          mentions légales
        </a>
        .
      </p>
    </main>
  );
}
