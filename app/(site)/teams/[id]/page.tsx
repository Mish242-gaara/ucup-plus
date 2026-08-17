import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeamProfile from "@/components/TeamProfile";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id: Number(id) },
    select: { name: true, university: { select: { name: true } } },
  });

  if (!team) return { title: "Équipe introuvable — UCUP 2026" };

  const title = `${team.name} — UCUP 2026`;
  const description = `${team.university.name} — effectif, résultats et calendrier.`;

  return { title, description, openGraph: { title, description } };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = Number(id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { university: true, captain: true },
  });

  if (!team) notFound();

  const [players, standing, matches, articles] = await Promise.all([
    prisma.player.findMany({
      where: { teamId, status: "approved" },
      orderBy: { goals: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jerseyNumber: true,
        position: true,
        goals: true,
        photo: true,
      },
    }),
    prisma.standing.findFirst({ where: { teamId } }),
    prisma.match.findMany({
      where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
      include: {
        homeTeam: { include: { university: true } },
        awayTeam: { include: { university: true } },
      },
      orderBy: { matchDate: "desc" },
      take: 20,
    }),
    prisma.newsArticle.findMany({
      where: { teamId, published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
      },
    }),
  ]);

  const finals = matches.filter(
    (m) => m.status === "finished" && m.round && /final/i.test(m.round)
  );
  const trophies = finals.filter((m) => {
    const isHome = m.homeTeamId === teamId;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const otherScore = isHome ? m.awayScore : m.homeScore;
    return teamScore > otherScore;
  }).length;

  const upcomingMatch = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())[0];

  const serializedMatches = matches.map((m) => ({
    ...m,
    matchDate: m.matchDate.toISOString(),
  }));

  return (
    <TeamProfile
      team={{
        id: team.id,
        name: team.name,
        category: team.category,
        year: team.year,
        coach: team.coach,
        captain: team.captain
          ? {
              firstName: team.captain.firstName,
              lastName: team.captain.lastName,
            }
          : null,
        university: {
          name: team.university.name,
          shortName: team.university.shortName,
          logo: team.university.logo,
          city: team.university.city,
          address: team.university.address,
          foundedYear: team.university.foundedYear,
          colors: team.university.colors,
          description: team.university.description,
          website: team.university.website,
          contactEmail: team.university.contactEmail,
          contactPhone: team.university.contactPhone,
          isVerified: team.university.isVerified,
        },
        group: standing?.group ?? null,
        standing: standing
          ? {
              played: standing.played,
              won: standing.won,
              drawn: standing.drawn,
              lost: standing.lost,
              goalsFor: standing.goalsFor,
              goalsAgainst: standing.goalsAgainst,
              points: standing.points,
            }
          : null,
        trophies,
        finals: finals.length,
      }}
      players={players}
      upcomingMatch={
        upcomingMatch
          ? serializedMatches.find((m) => m.id === upcomingMatch.id) ?? null
          : null
      }
      allMatches={serializedMatches}
      articles={articles.map((a) => ({
        ...a,
        publishedAt: a.publishedAt?.toISOString() ?? null,
      }))}
    />
  );
}