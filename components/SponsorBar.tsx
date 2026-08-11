import { prisma } from "@/lib/prisma";

export default async function SponsorBar() {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } });

  if (sponsors.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-black/20 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4">
        {sponsors.map((s) =>
          s.websiteUrl ? (
            <a key={s.id} href={s.websiteUrl} target="_blank" rel="noreferrer" title={s.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logo} alt={s.name} className="h-8 w-auto opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.id}
              src={s.logo}
              alt={s.name}
              title={s.name}
              className="h-8 w-auto opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          )
        )}
      </div>
    </div>
  );
}
