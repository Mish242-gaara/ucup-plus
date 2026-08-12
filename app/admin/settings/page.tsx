import { getTournamentSettings, updateTournamentSettings } from "@/lib/actions/settings";
import PhotoUploadField from "@/components/PhotoUploadField";

export default async function SettingsPage() {
  const settings = await getTournamentSettings();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Réglages du tournoi</h1>
      <p className="mt-1 text-sm text-gray-400">
        Le logo officiel et le nom de l&apos;organisateur renseignés ici apparaissent sur les
        licences joueur générées depuis la page Joueurs.
      </p>

      <form action={updateTournamentSettings} className="mt-6 grid max-w-xl grid-cols-2 gap-3">
        <PhotoUploadField name="logo" initialValue={settings.logo} label="Logo UCUP" />
        <input
          name="organizerName"
          defaultValue={settings.organizerName ?? ""}
          placeholder="Nom de l'organisateur (ex: Comité d'organisation UCUP 2026)"
          className="input col-span-2"
        />
        <input
          name="organizerSub"
          defaultValue={settings.organizerSub ?? ""}
          placeholder="Précision (ex: Le Bureau Départemental Des Étudiants — Pointe-Noire)"
          className="input col-span-2"
        />
        <button type="submit" className="btn col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
