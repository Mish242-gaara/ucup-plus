"use client";

import Link from "next/link";
import { useRealtime } from "@/lib/hooks/useRealtime";

type ApiStanding = {
  id: number;
  teamId: number;
  group: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  team: { name: string };
};

export default function LiveStandings({ initialStandings }: { initialStandings: ApiStanding[] }) {
  const standings = useRealtime<ApiStanding[]>("/api/standings", initialStandings, "standings");
  const groups = Array.from(new Set(standings.map((s) => s.group ?? "—"))).sort();

  if (groups.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-400">
        Le classement sera disponible une fois les premiers matchs terminés.
      </p>
    );
  }

  return (
    <>
      {groups.map((group) => {
        const rows = standings
          .filter((s) => (s.group ?? "—") === group)
          .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);

        return (
          <section key={group} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Groupe {group}</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="pb-2"></th>
                  <th className="pb-2">Équipe</th>
                  <th className="pb-2 text-center">J</th>
                  <th className="pb-2 text-center">G</th>
                  <th className="pb-2 text-center">N</th>
                  <th className="pb-2 text-center">P</th>
                  <th className="pb-2 text-center">BP</th>
                  <th className="pb-2 text-center">BC</th>
                  <th className="pb-2 text-center">Diff.</th>
                  <th className="pb-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const qualifies = i < 2;
                  const eliminated = i === rows.length - 1 && rows.length > 2;
                  return (
                    <tr
                      key={s.id}
                      className={`border-t border-gray-200 ${qualifies ? "bg-green-50" : eliminated ? "bg-brand-50" : ""}`}
                    >
                      <td className="py-2 pl-2">
                        <span
                          className={`block h-4 w-1 rounded-full ${
                            qualifies ? "bg-green-500" : eliminated ? "bg-brand-500" : "bg-transparent"
                          }`}
                        />
                      </td>
                      <td className="py-2">
                        <Link href={`/teams/${s.teamId}`} className="hover:text-brand-500">
                          {s.team.name}
                        </Link>
                      </td>
                      <td className="py-2 text-center">{s.played}</td>
                      <td className="py-2 text-center">{s.won}</td>
                      <td className="py-2 text-center">{s.drawn}</td>
                      <td className="py-2 text-center">{s.lost}</td>
                      <td className="py-2 text-center">{s.goalsFor}</td>
                      <td className="py-2 text-center">{s.goalsAgainst}</td>
                      <td className="py-2 text-center">{s.goalDifference}</td>
                      <td className="py-2 text-center font-semibold">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Qualifié pour la phase suivante
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Zone d&apos;élimination
        </span>
      </div>
    </>
  );
}
