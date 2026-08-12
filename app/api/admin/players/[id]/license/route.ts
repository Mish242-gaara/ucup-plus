import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { renderLicenseFront, renderLicenseBack, canvasToBuffer, CARD_WIDTH, CARD_HEIGHT, type LicenseData } from "@/lib/license";
import { ensureLicenseNumber, getTournamentSettings } from "@/lib/actions/settings";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const playerId = Number(id);

  const format = (req.nextUrl.searchParams.get("format") ?? "png") as "png" | "jpg" | "pdf";
  const side = (req.nextUrl.searchParams.get("side") ?? "front") as "front" | "back";

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: { include: { university: true } } },
  });
  if (!player) return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });

  const licenseNumber = await ensureLicenseNumber(playerId);
  const settings = await getTournamentSettings();

  const data: LicenseData = {
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    nationality: player.nationality,
    jerseyNumber: player.jerseyNumber,
    licenseNumber,
    teamName: player.team.name,
    universityName: player.team.university.name,
    universityShortName: player.team.university.shortName,
    photo: player.photo,
    universityLogo: player.team.university.logo,
    tournamentLogo: settings.logo,
    organizerName: settings.organizerName ?? "Comité d'organisation UCUP 2026",
    organizerSub: settings.organizerSub,
    issuedDate: new Date().toLocaleDateString("fr-FR"),
  };

  const fileBase = `licence-${player.firstName}-${player.lastName}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  if (format === "pdf") {
    const [frontCanvas, backCanvas] = await Promise.all([renderLicenseFront(data), renderLicenseBack(data)]);
    const [frontPng, backPng] = await Promise.all([
      canvasToBuffer(frontCanvas, "png"),
      canvasToBuffer(backCanvas, "png"),
    ]);

    const pdf = await PDFDocument.create();
    const pageW = (CARD_WIDTH * 72) / 300;
    const pageH = (CARD_HEIGHT * 72) / 300;

    for (const png of [frontPng, backPng]) {
      const page = pdf.addPage([pageW, pageH]);
      const embedded = await pdf.embedPng(png);
      page.drawImage(embedded, { x: 0, y: 0, width: pageW, height: pageH });
    }

    const bytes = await pdf.save();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
      },
    });
  }

  const canvas = side === "back" ? await renderLicenseBack(data) : await renderLicenseFront(data);
  const buffer = await canvasToBuffer(canvas, format === "jpg" ? "jpeg" : "png");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": format === "jpg" ? "image/jpeg" : "image/png",
      "Content-Disposition": `attachment; filename="${fileBase}-${side}.${format}"`,
    },
  });
}