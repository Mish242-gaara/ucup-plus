import { prisma } from "@/lib/prisma";

type Announcement = {
  id: number;
  text: string;
  active?: boolean;
};

export default async function FlashInfo() {
  const announcements: Announcement[] = await (prisma as any).announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="bg-red-600 text-white text-xs font-semibold py-2 px-4 overflow-hidden shadow-inner flex items-center gap-3">
      <span className="bg-white text-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0">
        FLASH INFO
      </span>
      <div className="whitespace-nowrap animate-marquee flex gap-8">
        {announcements.map((item: Announcement) => (
          <span key={item.id} className="inline-block">
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}