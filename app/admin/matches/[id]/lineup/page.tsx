import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveLineup, setFormation, resetLineup, type LineupEntryInput } from "@/lib/actions/lineups";
import ConfirmButton from "@/components/ConfirmButton";

const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1", "3-4-3"];

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
  // Action serveur pour enregistrer la formation tactique
  async function handleSetFormation(formData: FormData) {
    "use server";
    const selectedFormation = formData.get("formation") as string;
    if (selectedFormation) {
      await setFormation(matchId, teamId, selectedFormation);
    }
  }

  // Action serveur pour enregistrer les rôles et positions de chaque joueur
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

  return (
    <div className="admin-card rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <h2 className="text-lg font-bold text-white">{teamName}</h2>
        <div className="flex items-center gap-3">
          {/* Formulaire de choix de formation */}
          <form action={handleSetFormation} className="flex items-center gap-2">
            <select
              name="formation"
              defaultValue={formation ?? "4-4-2"}
              className="input rounded-lg border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-white"
            >
              {FORMATIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-xs font-semibold text-brand-500 hover:text-brand-400 hover:underline"
            >
              Enregistrer
            </button>
          </form>

          {/* Formulaire de réinitialisation */}
          <form action={resetLineup.bind(null, matchId, teamId)}>
            <ConfirmButton
              message={`Réinitialiser la composition de ${teamName} ?`}
              className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline"
            >
              Réinitialiser
            </ConfirmButton>
          </form>
        </div>
      </div>

      {/* Formulaire principal des compositions */}
      <form action={submitLineup} className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="pb-2 font-semibold">Joueur</th>
                <th className="pb-2 font-semibold">Statut</th>
                <th className="pb-2 font-semibold">Position</th>
                <th className="pb-2 font-semibold">Ordre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map((p) => {
                const current = existing.get(p.id);
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-medium text-gray-200">
                      <span className="inline-block w-8 text-xs font-bold text-gray-500">#{p.jerseyNumber}</span>
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="py-2.5">
                      <select
                        name={`role-${p.id}`}
                        defaultValue={current?.role ?? "none"}
                        className="input rounded border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-white"
                      >
                        <option value="none">— Aucun</option>
                        <option value="starter">Titulaire</option>
                        <option value="substitute">Remplaçant</option>
                      </select>
                    </td>
                    <td className="py-2.5">
                      <input
                        name={`position-${p.id}`}
                        defaultValue={current?.position ?? p.position ?? ""}
                        placeholder="ex: DC"
                        className="input w-20 rounded border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-white uppercase placeholder:text-gray-600"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        name={`order-${p.id}`}
                        type="number"
                        min={1}
                        max={99}
                        defaultValue={current?.orderKey ?? ""}
                        placeholder="N°"
                        className="input w-16 rounded border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-white placeholder:text-gray-600"
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
          className="btn mt-6 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-500"
        >
          Enregistrer la composition
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Compositions — {match.homeTeam.name} <span className="text-gray-500">vs</span> {match.awayTeam.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-400">
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
            {match.homeCompositionReady ? (
              <span className="text-emerald-400">✅ Prête</span>
            ) : (
              <span className="text-amber-400">⏳ En attente</span>
            )}{" "}
            · {match.homeTeam.name}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
            {match.awayCompositionReady ? (
              <span className="text-emerald-400">✅ Prête</span>
            ) : (
              <span className="text-amber-400">⏳ En attente</span>
            )}{" "}
            · {match.awayTeam.name}
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
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