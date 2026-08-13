import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamLogo from "@/components/TeamLogo";

export default async function FeaturedMatchHero() {
  // Récupère le prochain match prévu
  const nextMatch = await prisma.match.findFirst({
    where: { status: "scheduled" },
    orderBy: { matchDate: "asc" },
    include: {
      homeTeam: { include: { university: true } },
      awayTeam: { include: { university: true } },
    },
  });

  if (!nextMatch) return null;

  const matchDate = new Date(nextMatch.matchDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950 p-6 text-white shadow-xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          Prochaine Affiche Majeure
        </span>
        <span className="text-xs text-gray-400 font-medium capitalize">{matchDate}</span>
      </div>

      <div className="my-6 flex items-center justify-around gap-4">
        {/* Équipe Domicile */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-2 shadow-inner border border-white/10">
            <TeamLogo
              name={nextMatch.homeTeam.name}
              logo={nextMatch.homeTeam.university.logo}
              size={48}
            />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {nextMatch.homeTeam.name}
          </span>
        </div>

        {/* VS / Heure */}
        <div className="flex flex-col items-center text-center">
          <span className="text-2xl font-black text-red-500 italic">VS</span>
          <span className="mt-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-200 backdrop-blur-md">
            Match à venir
          </span>
        </div>

        {/* Équipe Extérieur */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-2 shadow-inner border border-white/10">
            <TeamLogo
              name={nextMatch.awayTeam.name}
              logo={nextMatch.awayTeam.university.logo}
              size={48}
            />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {nextMatch.awayTeam.name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-gray-400">
        <span>📍 Terrain UCUP</span>
        <Link
          href={`/matches`}
          className="font-bold text-red-400 hover:text-red-300 transition hover:underline"
        >
          Voir le calendrier complet →
        </Link>
      </div>
    </div>
  );
}