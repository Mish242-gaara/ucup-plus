import { prisma } from "@/lib/prisma";

type AnnouncementType = {
  id: number;
  text: string;
};

export default async function FlashInfo() {
  // @ts-ignore
  const announcements: AnnouncementType[] = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="bg-red-600 text-white text-xs font-semibold py-2.5 px-4 overflow-hidden flex items-center relative">
      {/* Conteneur opaque qui masque les textes qui passent derrière le badge */}
      <div className="bg-red-600 pr-4 z-20 shrink-0 flex items-center">
        <span className="bg-white text-red-600 text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-md">
          FLASH INFO
        </span>
      </div>

      {/* Zone de défilement masquée sur le côté gauche grâce à la superposition opaque */}
      <div className="relative w-full overflow-hidden flex items-center z-10">
        <div className="animate-marquee flex items-center gap-12 w-full">
          {announcements.map((item: AnnouncementType) => (
            <span key={item.id} className="inline-block tracking-wide">
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}