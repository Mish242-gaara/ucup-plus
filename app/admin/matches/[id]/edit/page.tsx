import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateMatch } from "@/lib/actions/matches";

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  const [match, teams] = await Promise.all([
    prisma.match.findUnique({ where: { id: matchId } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!match) notFound();

  const updateWithId = updateMatch.bind(null, matchId);
  const dateValue = new Date(match.matchDate).toISOString().slice(0, 16);

  return (
    <div>
      <Link href="/admin/matches" className="text-sm text-gray-400 hover:text-brand-500">
        ← Retour aux matchs
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-white">Modifier le match</h1>

      <form action={updateWithId} className="mt-6 grid max-w-2xl grid-cols-2 gap-3">
        <select name="homeTeamId" required defaultValue={match.homeTeamId} className="input">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="awayTeamId" required defaultValue={match.awayTeamId} className="input">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="matchDate" type="datetime-local" defaultValue={dateValue} required className="input col-span-2" />
        <input name="venue" defaultValue={match.venue ?? ""} placeholder="Lieu" className="input" />
        <input name="group" defaultValue={match.group ?? ""} placeholder="Groupe (A, B…)" className="input" />
        <input
          name="round"
          defaultValue={match.round ?? ""}
          placeholder="Phase (Quart, Demi, Finale…)"
          className="input"
        />
        <select name="matchType" defaultValue={match.matchType ?? "tournament"} className="input">
          <option value="tournament">Tournoi</option>
          <option value="friendly">Amical</option>
        </select>

        <div className="col-span-2 rounded-md border border-dashed border-white/10 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Position dans le bracket à élimination directe (laisser vide pour un match de poule)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <input
              name="bracketRound"
              type="number"
              min={1}
              defaultValue={match.bracketRound ?? ""}
              placeholder="N° de tour"
              className="input"
            />
            <input
              name="bracketPosition"
              type="number"
              min={0}
              defaultValue={match.bracketPosition ?? ""}
              placeholder="Position dans le tour"
              className="input"
            />
          </div>
        </div>

        <button type="submit" className="btn col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
