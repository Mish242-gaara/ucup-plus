import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateUniversity } from "@/lib/actions/universities";
import PhotoUploadField from "@/components/PhotoUploadField";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function EditUniversityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const university = await prisma.university.findUnique({
    where: { id: Number(id) },
  });

  if (!university) notFound();

  const updateWithId = updateUniversity.bind(null, university.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* En-tête */}
      <div className="border-b border-white/10 pb-6">
        <Link
          href="/admin/universities"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-brand-400"
        >
          <ArrowLeft size={14} /> Retour à la liste
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
            <Pencil size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Modifier {university.shortName}
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Mettez à jour les informations de {university.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
        <form action={updateWithId} className="space-y-6">
          {/* Logo */}
          <div className="border-b border-white/5 pb-6">
            <PhotoUploadField
              name="logo"
              initialValue={university.logo}
              label="Logo de l'université"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Colonne 1 : Informations de base */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-500">
                Informations Principales
              </h3>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Nom officiel *
                </label>
                <input
                  name="name"
                  defaultValue={university.name}
                  placeholder="Ex: École Supérieure..."
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
                    defaultValue={university.shortName}
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
                    defaultValue={university.foundedYear ?? ""}
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
                    defaultValue={university.city ?? ""}
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
                    defaultValue={university.colors ?? ""}
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
                  defaultValue={university.address ?? ""}
                  placeholder="Ex: Centre-ville, face CEG Poaty Bernard"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Colonne 2 : Contact & Statut */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-500">
                Contact & Description
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Email Contact
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue={university.contactEmail ?? ""}
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
                    defaultValue={university.contactPhone ?? ""}
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
                  defaultValue={university.website ?? ""}
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
                  defaultValue={university.description ?? ""}
                  rows={3}
                  placeholder="Présentation concise de l'établissement..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-zinc-950/50 p-3">
                <input
                  type="checkbox"
                  name="isVerified"
                  id="isVerified"
                  defaultChecked={university.isVerified}
                  className="h-4 w-4 rounded border-white/10 bg-zinc-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-zinc-950"
                />
                <label htmlFor="isVerified" className="text-xs font-semibold text-white">
                  Établissement vérifié
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-white/5 pt-6">
            <Link
              href="/admin/universities"
              className="rounded-lg bg-zinc-800 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-700"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-brand-500 active:scale-[0.99]"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}