import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function SponsorsBanner() {
  const sponsors = await prisma.sponsor.findMany({
    orderBy: { sortOrder: "asc" },
  });

  if (sponsors.length === 0) return null;

  return (
    <div className="site-card p-4 text-center">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
        Nos Partenaires Officiels
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {sponsors.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            {s.logo ? (
              <div className="relative h-8 w-20">
                <Image src={s.logo} alt={s.name} fill className="object-contain" />
              </div>
            ) : (
              <span className="font-bold text-sm text-gray-500 italic">{s.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}