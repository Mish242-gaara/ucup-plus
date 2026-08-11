import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateUniversity } from "@/lib/actions/universities";
import PhotoUploadField from "@/components/PhotoUploadField";

export default async function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const university = await prisma.university.findUnique({ where: { id: Number(id) } });

  if (!university) notFound();

  const updateWithId = updateUniversity.bind(null, university.id);

  return (
    <div>
      <Link href="/admin/universities" className="text-sm text-gray-400 hover:text-brand-500">
        ← Retour aux universités
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-white">Modifier {university.name}</h1>

      <form action={updateWithId} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="logo" initialValue={university.logo} label="Logo" />
        <input name="name" defaultValue={university.name} placeholder="Nom" required className="input col-span-2" />
        <input
          name="shortName"
          defaultValue={university.shortName}
          placeholder="Sigle (ex: ESTAM)"
          maxLength={10}
          required
          className="input"
        />
        <input name="colors" defaultValue={university.colors ?? ""} placeholder="Couleurs" className="input" />
        <input name="city" defaultValue={university.city ?? ""} placeholder="Ville (ex: Pointe-Noire)" className="input" />
        <input
          name="foundedYear"
          type="number"
          defaultValue={university.foundedYear ?? ""}
          placeholder="Année de fondation"
          className="input"
        />
        <textarea
          name="description"
          defaultValue={university.description ?? ""}
          placeholder="Description"
          className="input col-span-2"
          rows={2}
        />
        <button type="submit" className="btn col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
