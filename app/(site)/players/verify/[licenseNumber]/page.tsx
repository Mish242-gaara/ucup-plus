import { ShieldCheck, ShieldX, ShieldQuestion } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TeamLogo from "@/components/TeamLogo";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vérification de licence — UCUP 2026" };

export default async function VerifyLicensePage({
  params,
}: {
  params: Promise<{ licenseNumber: string }>;
}) {
  const { licenseNumber } = await params;
  const decodedNumber = decodeURIComponent(licenseNumber);

  const player = await prisma.player.findUnique({
    where: { licenseNumber: decodedNumber },
    include: { team: { include: { university: true } } },
  });

  // Vérification sécurisée sans crash si player === null
  const isValid = Boolean(player && player.status === "approved");
  const isPending = Boolean(player && player.status !== "approved");

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="site-card overflow-hidden">
        <div
          className={`flex flex-col items-center gap-2 px-6 py-8 text-center text-white ${
            isValid ? "bg-green-600" : isPending ? "bg-yellow-500" : "bg-red-600"
          }`}
        >
          {isValid ? (
            <ShieldCheck size={48} />
          ) : isPending ? (
            <ShieldQuestion size={48} />
          ) : (
            <ShieldX size={48} />
          )}
          <p className="text-lg font-extrabold uppercase tracking-wide">
            {isValid ? "Licence valide" : isPending ? "Licence en attente de validation" : "Licence invalide"}
          </p>
          <p className="text-xs opacity-90">
            {isValid
              ? "Ce document correspond à un joueur inscrit et approuvé pour l'UCUP 2026."
              : isPending
                ? "Ce numéro existe mais le joueur n'est pas encore validé par l'organisation."
                : "Aucune licence UCUP 2026 ne correspond à ce numéro."}
          </p>
        </div>

        {player && (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                {player.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.photo}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                    {player.firstName[0]}
                    {player.lastName[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-ink">
                  {player.firstName} {player.lastName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                  <TeamLogo name={player.team.name} logo={player.team.university.logo} size={16} />
                  {player.team.name}
                </div>
              </div>
            </div>

            <dl className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Numéro de licence</dt>
                <dd className="font-mono font-semibold text-ink">{player.licenseNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Poste</dt>
                <dd className="font-semibold text-ink">{player.position}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Numéro de maillot</dt>
                <dd className="font-semibold text-ink">#{player.jerseyNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Université</dt>
                <dd className="font-semibold text-ink">{player.team.university.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Saison</dt>
                <dd className="font-semibold text-ink">2026</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Vérification officielle UCUP 2026 — en cas de doute, contacte le comité d&apos;organisation.
      </p>
    </main>
  );
}