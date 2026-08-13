import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MVPWidget() {
  const mvp = await prisma.player.findFirst({
    where: { status: "approved" },
    orderBy: { goals: "desc" },
    include: { team: true },
  });

  if (!mvp) return null;

  return (
    <div className="site-card p-4 relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-red-50/30">
      <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-0.5 rounded">
        🌟 Joueur à la une
      </span>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {mvp.photo ? (
            <Image src={mvp.photo} alt={mvp.lastName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-extrabold text-gray-500">
              {mvp.firstName[0]}
              {mvp.lastName[0]}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-black text-ink text-base">
            {mvp.firstName} {mvp.lastName}
          </h3>
          <p className="text-xs font-semibold text-gray-500">{mvp.team.name} • {mvp.position}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-black text-red-600 bg-white border border-red-100 px-2 py-0.5 rounded shadow-sm">
              ⚽ {mvp.goals} buts marqués
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}