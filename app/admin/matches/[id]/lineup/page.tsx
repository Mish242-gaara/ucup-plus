import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveLineup, setFormation, resetLineup, type LineupEntryInput } from "@/lib/actions/lineups";
import ConfirmButton from "@/components/ConfirmButton";

const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1", "3-4-3"];

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
  players: { id: number; firstName: string; lastName: string; jerseyNumber: number; position: string }[];
  existing: Map<number, { role: string; position: string | null; orderKey: number | null }>;
}) {
  async function submitLineup(formData: FormData) {
    "use server";
    const entries: LineupEntryInput[] = players.map((p) => ({
      playerId: p.id,
      role: (formData.get(`role-${p.id}`) as LineupEntryInput["role"]) || "none",
      position: (formData.get(`position-${p.id}`) as string) || "",
      orderKey: Number(formData.get(`order-${p.id}`) || 0),
    }));
    await saveLineup(matchId, teamId, entries);
  }

  return (
    <div className="admin-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{teamName}</h2>
        <div className="flex items-center gap-2">
          <form
            action={async (fd: FormData) => {
              "use server";
              await setFormation(matchId, teamId, fd.get("formation") as string);
            }}
            className="flex items-center gap-2"
          >
            <select name="formation" defaultValue={formation ?? "4-4-2"} className="input">
              {FORMATIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button type="submit" className="text-xs text-brand-500 hover:underline">
              Enregistrer
            </button>
          </form>
          <form action={resetLineup.bind(null, matchId, teamId)}>
            <ConfirmButton
              message={`Réinitialiser la composition de ${teamName} ?`}
              className="text-xs text-brand-600 hover:underline"
            >
              Réinitialiser
            </ConfirmButton>
          </form>
        </div>
      </div>

      <form action={submitLineup} className="mt-4">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="pb-2">Joueur</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Position</th>
              <th className="pb-2">Ordre</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const current = existing.get(p.id);
              return (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="py-1.5">
                    #{p.jerseyNumber} {p.firstName} {p.lastName}
                  </td>
                  <td className="py-1.5">
                    <select
                      name={`role-${p.id}`}
                      defaultValue={current?.role ?? "none"}
                      className="input py-1"
                    >
                      <option value="none">—</option>
                      <option value="starter">Titulaire</option>
                      <option value="substitute">Remplaçant</option>
                    </select>
                  </td>
                  <td className="py-1.5">
                    <input
                      name={`position-${p.id}`}
                      defaultValue={current?.position ?? p.position}
                      className="input w-20 py-1"
                    />
                  </td>
                  <td className="py-1.5">
                    <input
                      name={`order-${p.id}`}
                      type="number"
                      defaultValue={current?.orderKey ?? ""}
                      className="input w-16 py-1"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="submit" className="btn mt-4">
          Enregistrer la composition
        </button>
      </form>
    </div>
  );
}

export default async function LineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: { where: { status: "approved" }, orderBy: { jerseyNumber: "asc" } } } },
      awayTeam: { include: { players: { where: { status: "approved" }, orderBy: { jerseyNumber: "asc" } } } },
      matchLineups: true,
    },
  });

  if (!match) notFound();

  const homeExisting = new Map(
    match.matchLineups
      .filter((l) => l.teamId === match.homeTeamId)
      .map((l) => [l.playerId, { role: l.role, position: l.position, orderKey: l.orderKey }])
  );
  const awayExisting = new Map(
    match.matchLineups
      .filter((l) => l.teamId === match.awayTeamId)
      .map((l) => [l.playerId, { role: l.role, position: l.position, orderKey: l.orderKey }])
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">
        Compositions — {match.homeTeam.name} vs {match.awayTeam.name}
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        {match.homeCompositionReady ? "✅" : "⏳"} {match.homeTeam.name} ·{" "}
        {match.awayCompositionReady ? "✅" : "⏳"} {match.awayTeam.name}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
