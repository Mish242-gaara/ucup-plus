import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [matches, teams, players] = await Promise.all([
    prisma.match.findMany({ select: { id: true, updatedAt: true } }),
    prisma.team.findMany({ select: { id: true, updatedAt: true } }),
    prisma.player.findMany({ where: { status: "approved" }, select: { id: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/matches`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/teams`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/players`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/players/leaderboard`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/standings`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/galerie`, changeFrequency: "weekly", priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...matches.map((m) => ({
      url: `${siteUrl}/matches/${m.id}`,
      lastModified: m.updatedAt,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...teams.map((t) => ({
      url: `${siteUrl}/teams/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...players.map((p) => ({
      url: `${siteUrl}/players/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
