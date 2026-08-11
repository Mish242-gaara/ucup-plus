import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";")
    )
    .join("\n");
}

async function buildStandingsPdf(
  standings: { group: string | null; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number; team: { name: string } }[]
) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const brandRed = rgb(0.835, 0.122, 0.165); // matches the site's brand-500

  let page = doc.addPage([595, 842]); // A4
  let y = 800;

  page.drawText("UCUP 2026 — Classement", { x: 50, y, size: 20, font: bold, color: brandRed });
  y -= 18;
  page.drawText(new Date().toLocaleDateString("fr-FR"), { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  const groups = Array.from(new Set(standings.map((s) => s.group ?? "—"))).sort();
  const cols = [50, 220, 280, 320, 360, 400, 440, 480, 520];
  const headers = ["Équipe", "J", "G", "N", "P", "BP", "BC", "Diff", "Pts"];

  for (const group of groups) {
    if (y < 100) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(`Groupe ${group}`, { x: 50, y, size: 13, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= 20;

    headers.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: bold, color: rgb(0.5, 0.5, 0.5) }));
    y -= 14;

    const rows = standings
      .filter((s) => (s.group ?? "—") === group)
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);

    for (const s of rows) {
      if (y < 60) {
        page = doc.addPage([595, 842]);
        y = 800;
      }
      const values = [s.team.name, s.played, s.won, s.drawn, s.lost, s.goalsFor, s.goalsAgainst, s.goalDifference, s.points];
      values.forEach((v, i) =>
        page.drawText(String(v), { x: cols[i], y, size: 10, font, color: rgb(0.1, 0.1, 0.1) })
      );
      y -= 16;
    }
    y -= 20;
  }

  return doc.save();
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "standings";
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  if (type === "players") {
    const players = await prisma.player.findMany({
      where: { status: "approved" },
      orderBy: [{ team: { name: "asc" } }, { lastName: "asc" }],
      select: {
        firstName: true,
        lastName: true,
        jerseyNumber: true,
        position: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        matchesPlayed: true,
        team: { select: { name: true } },
      },
    });

    const rows = [
      ["Prénom", "Nom", "Équipe", "N°", "Poste", "Matchs", "Buts", "Passes D.", "Jaunes", "Rouges"],
      ...players.map((p) => [
        p.firstName,
        p.lastName,
        p.team.name,
        p.jerseyNumber,
        p.position,
        p.matchesPlayed,
        p.goals,
        p.assists,
        p.yellowCards,
        p.redCards,
      ]),
    ];

    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ucup2026-joueurs.csv"`,
      },
    });
  }

  const standings = await prisma.standing.findMany({
    orderBy: [{ group: "asc" }, { points: "desc" }, { goalDifference: "desc" }],
    select: {
      group: true,
      played: true,
      won: true,
      drawn: true,
      lost: true,
      goalsFor: true,
      goalsAgainst: true,
      goalDifference: true,
      points: true,
      team: { select: { name: true } },
    },
  });

  if (format === "pdf") {
    const pdfBytes = await buildStandingsPdf(standings);
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ucup2026-classement.pdf"`,
      },
    });
  }

  const rows = [
    ["Groupe", "Équipe", "J", "G", "N", "P", "BP", "BC", "Diff", "Pts"],
    ...standings.map((s) => [
      s.group ?? "-",
      s.team.name,
      s.played,
      s.won,
      s.drawn,
      s.lost,
      s.goalsFor,
      s.goalsAgainst,
      s.goalDifference,
      s.points,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ucup2026-classement.csv"`,
    },
  });
}
