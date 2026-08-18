import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveLineup, setFormation, resetLineup, type LineupEntryInput } from "@/lib/actions/lineups";
import ConfirmButton from "@/components/ConfirmButton";

// Ne pas mettre en cache la page d'administration
export const dynamic = "force-dynamic";

const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "3-5-2",
  "5-3-2",
  "4-1-4-1",
  "3-4-3",
  "4-3-2-1",
  "3-4-2-1",
];

type Player = {
  id: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
};

type LineupEntry = {
  role: string;
  position: string | null;
  orderKey: number | null;
};

function TeamLineupForm({
  matchId,
  teamId,
  teamName,
  formation,
  players,
  existing,
}: {
  matchId: number;
  teamId: number;
  teamName: string;
  formation: string | null;
  players: Player[];
  existing: Map<number, LineupEntry>;
}) {
  // Action serveur pour enregistrer la disposition tactique
  async function handleSetFormation(formData: FormData) {
    "use server";
    const selectedFormation = formData.get("formation") as string;
    if (selectedFormation) {
      await setFormation(matchId, teamId, selectedFormation);
    }
  }

  // Action serveur pour enregistrer la feuille de match globale
  async function submitLineup(formData: FormData) {
    "use server";

    const entries: LineupEntryInput[] = players.map((p) => {
      const rawRole = (formData.get(`role-${p.id}`) as string) || "none";
      const role = (["starter", "substitute", "none"].includes(rawRole) ? rawRole : "none") as LineupEntryInput["role"];
      const position = (formData.get(`position-${p.id}`) as string) || "";
      const rawOrder = formData.get(`order-${p.id}`);
      const parsedOrder = rawOrder !== null && rawOrder !== "" ? Number(rawOrder) : null;

      return {
        playerId: p.id,
        role,
        position,
        orderKey: parsedOrder !== null && !isNaN(parsedOrder) ? parsedOrder : 0,
      };
    });

    await saveLineup(matchId, teamId, entries);
  }

  // Calcul du nombre de titulaires et remplaçants définis
  const startersCount = Array.from(existing.values()).filter((e) => e.role === "starter").length;
  const subsCount = Array.from(existing.values()).filter((e) => e.role === "substitute").length;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-3 sm:p-5 shadow-xl w-full">
      {/* Header Équipe & Choix de la Formation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">{teamName}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-400">
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20">
              {startersCount} Titulaires
            </span>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-400 border border-blue-500/20">
              {subsCount} Remplaçants
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Formulaire Formation */}
          <form action={handleSetFormation} className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Schéma :</span>
            <select
              name="formation"
              defaultValue={formation ?? "4-4-2"}
              className="input rounded-lg border border-white/10 bg-zinc-800 px-2 py-1 text-xs font-mono font-bold text-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {FORMATIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-zinc-700 active:bg-zinc-600"
            >
              OK
            </button>
          </form>

          {/* Formulaire Réinitialisation */}
          <form action={resetLineup.bind(null, matchId, teamId)}>
            <ConfirmButton
              message={`Réinitialiser totalement la composition de ${teamName} ?`}
              className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline px-1 py-1"
            >
              Effacer
            </ConfirmButton>
          </form>
        </div>
      </div>

      {/* Formulaire Principal de la Feuille de Match */}
      <form action={submitLineup} className="mt-4">
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full text-left text-xs sm:text-sm min-w-[340px]">
            <thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="pb-2 sm:pb-3 font-semibold">Joueur</th>
                <th className="pb-2 sm:pb-3 font-semibold">Rôle</th>
                <th className="pb-2 sm:pb-3 font-semibold">Poste</th>
                <th className="pb-2 sm:pb-3 font-semibold text-center">Ordre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map((p) => {
                const current = existing.get(p.id);
                const roleValue = current?.role ?? "none";

                return (
                  <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="py-2 pr-1 font-medium text-gray-200">
                      <span className="inline-block w-6 sm:w-8 font-mono text-[11px] sm:text-xs font-bold text-brand-400">
                        #{p.jerseyNumber ?? "-"}
                      </span>
                      <span className="truncate inline-block max-w-[110px] sm:max-w-none align-bottom">
                        {p.firstName} {p.lastName}
                      </span>
                    </td>

                    <td className="py-2 px-1">
                      <select
                        name={`role-${p.id}`}
                        defaultValue={roleValue}
                        className={`input rounded border px-1.5 py-1 text-[11px] sm:text-xs font-semibold focus:outline-none ${
                          roleValue === "starter"
                            ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                            : roleValue === "substitute"
                            ? "border-blue-500/30 bg-blue-950/40 text-blue-400"
                            : "border-white/10 bg-zinc-800 text-gray-400"
                        }`}
                      >
                        <option value="none">— Hors</option>
                        <option value="starter">Titulaire</option>
                        <option value="substitute">Remplaçant</option>
                      </select>
                    </td>

                    <td className="py-2 px-1">
                      <input
                        name={`position-${p.id}`}
                        defaultValue={current?.position ?? p.position ?? ""}
                        placeholder="ex: G"
                        className="input w-14 sm:w-20 rounded border border-white/10 bg-zinc-800 px-1.5 py-1 font-mono text-[11px] sm:text-xs uppercase text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </td>

                    <td className="py-2 pl-1 text-center">
                      <input
                        name={`order-${p.id}`}
                        type="number"
                        min={1}
                        max={99}
                        defaultValue={current?.orderKey ?? ""}
                        placeholder="N°"
                        className="input w-12 sm:w-14 rounded border border-white/10 bg-zinc-800 px-1 py-1 text-center font-mono text-[11px] sm:text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          className="btn mt-5 sm:mt-6 w-full rounded-lg bg-brand-600 py-2.5 sm:py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-brand-500 active:scale-[0.99]"
        >
          Enregistrer la composition ({teamName})
        </button>
      </form>
    </div>
  );
}

export default async function LineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  if (isNaN(matchId)) {
    notFound();
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: {
        include: {
          players: {
            where: { status: "approved" },
            orderBy: { jerseyNumber: "asc" },
          },
        },
      },
      awayTeam: {
        include: {
          players: {
            where: { status: "approved" },
            orderBy: { jerseyNumber: "asc" },
          },
        },
      },
      matchLineups: true,
    },
  });

  if (!match) {
    notFound();
  }

  const homeExisting = new Map<number, LineupEntry>(
    match.matchLineups
      .filter((l) => l.teamId === match.homeTeamId)
      .map((l) => [l.playerId, { role: l.role, position: l.position, orderKey: l.orderKey }])
  );

  const awayExisting = new Map<number, LineupEntry>(
    match.matchLineups
      .filter((l) => l.teamId === match.awayTeamId)
      .map((l) => [l.playerId, { role: l.role, position: l.position, orderKey: l.orderKey }])
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-400">
            <span>SofaScore Match Console</span>
            <span>•</span>
            <span>Feuilles de Match</span>
          </div>
          <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-3xl">
            {match.homeTeam.name} <span className="text-zinc-600">vs</span> {match.awayTeam.name}
          </h1>
        </div>

        {/* Badges d'état de la composition publique */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 shadow">
            <span className="text-gray-400 truncate max-w-[100px] sm:max-w-none">{match.homeTeam.name} :</span>
            {match.homeCompositionReady ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Publiée
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Non prête
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 shadow">
            <span className="text-gray-400 truncate max-w-[100px] sm:max-w-none">{match.awayTeam.name} :</span>
            {match.awayCompositionReady ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Publiée
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Non prête
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grille des Formulaires Domicile & Extérieur */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TeamLineupForm
          matchId={matchId}
          teamId={match.homeTeamId}
          teamName={match.homeTeam.name}
          formation={match.homeFormation}
          players={match.homeTeam.players}
          existing={homeExisting}
        />
        <TeamLineupForm
          matchId={matchId}
          teamId={match.awayTeamId}
          teamName={match.awayTeam.name}
          formation={match.awayFormation}
          players={match.awayTeam.players}
          existing={awayExisting}
        />
      </div>
    </div>
  );
}