import { prisma } from "@/lib/prisma";
import { createSponsor, deleteSponsor, reorderSponsor } from "@/lib/actions/sponsors";
import PhotoUploadField from "@/components/PhotoUploadField";
import ConfirmButton from "@/components/ConfirmButton";

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Sponsors</h1>
      <p className="mt-1 text-sm text-gray-400">
        Affichés en bandeau sur les pages publiques, dans l&apos;ordre ci-dessous.
      </p>

      <form action={createSponsor} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="logo" label="Logo" />
        <input name="name" placeholder="Nom du sponsor" required className="input col-span-2" />
        <input name="websiteUrl" placeholder="Site web (optionnel)" className="input col-span-2" />
        <button type="submit" className="btn col-span-2">
          Ajouter
        </button>
      </form>

      <ul className="mt-8 max-w-xl divide-y divide-gray-100">
        {sponsors.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logo} alt={s.name} className="max-h-full max-w-full object-contain" />
            </div>
            <span className="flex-1 text-sm font-semibold text-white">{s.name}</span>
            <form action={reorderSponsor.bind(null, s.id, "up")}>
              <button disabled={i === 0} className="text-gray-400 hover:text-brand-500 disabled:opacity-30">
                ↑
              </button>
            </form>
            <form action={reorderSponsor.bind(null, s.id, "down")}>
              <button
                disabled={i === sponsors.length - 1}
                className="text-gray-400 hover:text-brand-500 disabled:opacity-30"
              >
                ↓
              </button>
            </form>
            <form action={deleteSponsor.bind(null, s.id)}>
              <ConfirmButton message={`Retirer ${s.name} des sponsors ?`} className="text-brand-600 hover:underline">
                Suppr.
              </ConfirmButton>
            </form>
          </li>
        ))}
        {sponsors.length === 0 && <p className="py-3 text-sm text-gray-400">Aucun sponsor pour le moment.</p>}
      </ul>
    </div>
  );
}
