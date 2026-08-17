import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createUniversity, deleteUniversity } from "@/lib/actions/universities";
import ConfirmButton from "@/components/ConfirmButton";
import PhotoUploadField from "@/components/PhotoUploadField";
import {
  GraduationCap,
  PlusCircle,
  Pencil,
  Trash2,
  Globe,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage() {
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
          <GraduationCap size={14} />
          <span>Gestion Académique</span>
        </div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Universités & Établissements
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Enregistrez et gérez les institutions universitaires participantes aux tournois.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Formulaire de création (4 cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <PlusCircle size={16} className="text-brand-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Ajouter une université
              </h2>
            </div>

            <form action={createUniversity} className="mt-4 space-y-4">
              <PhotoUploadField name="logo" label="Logo de l'université" />

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Nom officiel *
                </label>
                <input
                  name="name"
                  placeholder="Ex: École Supérieure des Technologies..."
                  required
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Sigle *
                  </label>
                  <input
                    name="shortName"
                    placeholder="Ex: ESTAM"
                    maxLength={10}
                    required
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-mono uppercase text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Fondation
                  </label>
                  <input
                    name="foundedYear"
                    type="number"
                    placeholder="Ex: 2008"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Ville
                  </label>
                  <input
                    name="city"
                    defaultValue="Pointe-Noire"
                    placeholder="Pointe-Noire"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Couleurs
                  </label>
                  <input
                    name="colors"
                    placeholder="Bleu / Blanc"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Adresse du Campus
                </label>
                <input
                  name="address"
                  placeholder="Ex: Centre-ville, face CEG Poaty Bernard"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Email Contact
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    placeholder="contact@univ.cg"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Téléphone
                  </label>
                  <input
                    name="contactPhone"
                    placeholder="+242 06..."
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Site Web
                </label>
                <input
                  name="website"
                  type="url"
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Présentation concise de l'établissement..."
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="isVerified"
                  id="isVerifiedNew"
                  defaultChecked={true}
                  className="h-4 w-4 rounded border-white/10 bg-zinc-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-zinc-950"
                />
                <label htmlFor="isVerifiedNew" className="text-xs font-semibold text-white">
                  Marquer comme vérifié
                </label>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-brand-500 active:scale-[0.99]"
              >
                Enregistrer l'université
              </button>
            </form>
          </div>
        </div>

        {/* Tableau des universités (8 cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Universités répertoriées ({universities.length})
              </h2>
            </div>

            {universities.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-center">
                <p className="text-xs text-gray-500">
                  Aucune université enregistrée pour le moment.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="pb-3 font-semibold">Établissement</th>
                      <th className="pb-3 font-semibold">Sigle</th>
                      <th className="pb-3 font-semibold">Localisation</th>
                      <th className="pb-3 text-center font-semibold">Équipes</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {universities.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                        {/* Logo + Nom */}
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                              {u.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={u.logo}
                                  alt={u.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <Building2 size={16} className="text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="max-w-[180px] truncate font-bold text-white"
                                  title={u.name}
                                >
                                  {u.name}
                                </span>
                                {u.isVerified && (
                                  <CheckCircle2
                                    size={12}
                                    className="text-brand-500"
                                    aria-label="Établissement vérifié"
                                  />
                                )}
                              </div>
                              {u.website ? (
                                <a
                                  href={u.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:underline"
                                >
                                  <Globe size={10} /> Site web
                                </a>
                              ) : u.contactEmail ? (
                                <span className="text-[10px] text-gray-500">{u.contactEmail}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Sigle */}
                        <td className="py-3 font-mono font-bold text-brand-400">
                          {u.shortName}
                        </td>

                        {/* Localisation */}
                        <td className="py-3 text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-500" />
                            <span>{u.city || "—"}</span>
                          </div>
                        </td>

                        {/* Nombre d'équipes */}
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-gray-300">
                            <Users size={11} /> {u._count.teams}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/universities/${u.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-gray-300 transition-colors hover:bg-zinc-700 hover:text-white"
                            >
                              <Pencil size={12} /> Modifier
                            </Link>

                            <form action={deleteUniversity.bind(null, u.id)} className="inline-block">
                              <ConfirmButton
                                message={`Supprimer l'université ${u.name} ? Toutes ses équipes, joueurs et matchs associés seront définitivement supprimés.`}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                              >
                                <Trash2 size={12} /> Supprimer
                              </ConfirmButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}