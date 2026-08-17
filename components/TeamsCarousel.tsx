import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamLogo from "@/components/TeamLogo";

export default async function TeamsCarousel() {
  const teams = await prisma.team.findMany({
    include: { university: true },
    orderBy: { name: "asc" },
  });

  if (teams.length === 0) return null;

  return (
    <div className="site-card p-4">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
        Équipes du tournoi
      </h2>
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 p-1 group-hover:scale-105 group-hover:border-red-500 transition">
              <TeamLogo name={team.name} logo={team.university?.logo ?? null} size={32} />
            </div>
            <span className="text-[11px] font-bold text-ink group-hover:text-red-600 transition">
              {team.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}