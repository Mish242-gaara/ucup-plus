"use client";

import { useActionState } from "react";
import { registerPlayer, type RegistrationResult } from "@/lib/actions/registration";

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const initialState: RegistrationResult = { ok: false, error: "" };

export default function RegistrationForm({ teams }: { teams: { id: number; name: string }[] }) {
  const [state, formAction, pending] = useActionState(async (_: RegistrationResult, formData: FormData) => {
    return registerPlayer(formData);
  }, initialState);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        Demande envoyée ! Elle sera visible sur le site une fois validée par l&apos;organisation.
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <select name="teamId" required className="site-input col-span-2">
        <option value="">Équipe…</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <input name="firstName" placeholder="Prénom" required className="site-input" />
      <input name="lastName" placeholder="Nom" required className="site-input" />
      <input name="jerseyNumber" type="number" placeholder="N° de maillot souhaité" required className="site-input" />
      <select name="position" required className="site-input">
        <option value="">Poste…</option>
        {POSITIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input name="birthDate" type="date" className="site-input" />
      <input name="height" type="number" placeholder="Taille (cm)" className="site-input" />
      <input name="nationality" placeholder="Nationalité" defaultValue="DRC" className="site-input col-span-2" />
      <input
        name="accessCode"
        placeholder="Code d'accès (fourni par ton entraîneur)"
        required
        className="site-input col-span-2"
      />

      {state.error && <p className="col-span-2 text-sm text-brand-600">{state.error}</p>}

      <button type="submit" disabled={pending} className="site-btn col-span-2 disabled:opacity-50">
        {pending ? "Envoi…" : "S'inscrire"}
      </button>
    </form>
  );
}
