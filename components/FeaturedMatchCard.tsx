import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function FeaturedMatchCard() {
  const match = await prisma.match.findFirst({
    where: { status: "scheduled" },
    orderBy: { matchDate: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!match) return null;

  return (
    <div className="site-card overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
      <div className="px-5 pt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-100">Match phare</p>
        <p className="mt-2 text-xl font-extrabold leading-tight">
          {match.homeTeam.name}
          <span className="mx-2 text-brand-200">vs</span>
          {match.awayTeam.name}
        </p>
        <p className="mt-3 text-sm text-brand-100">
          {new Date(match.matchDate).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          {match.venue && ` · ${match.venue}`}
        </p>
      </div>
      <div className="p-5 pt-4">
        <Link
          href={`/matches/${match.id}`}
          className="inline-block rounded-full bg-white px-5 py-2 text-sm font-bold uppercase tracking-wide text-brand-600 hover:bg-brand-50"
        >
          Plus d&apos;infos
        </Link>
      </div>
    </div>
  );
}
