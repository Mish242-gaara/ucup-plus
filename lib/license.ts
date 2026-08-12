import { createCanvas, loadImage, type SKRSContext2D, type Canvas } from "@napi-rs/canvas";

// Physical size target: 900x1260px @ ~300dpi ≈ 76x107mm — a standard
// badge/student-card format, printable directly.
export const CARD_WIDTH = 900;
export const CARD_HEIGHT = 1260;

const NAVY = "#0b1f3f";
const RED = "#d51f2a";
const RED_DARK = "#94121d";

export type LicenseData = {
  firstName: string;
  lastName: string;
  position: string;
  nationality: string;
  jerseyNumber: number;
  licenseNumber: string;
  teamName: string;
  universityName: string;
  universityShortName: string;
  photo: string | null;
  universityLogo: string | null;
  tournamentLogo: string | null;
  organizerName: string;
  organizerSub: string | null;
  issuedDate: string;
};

async function safeLoadImage(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return await loadImage(buffer);
  } catch {
    return null;
  }
}

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDiagonalAccent(ctx: SKRSContext2D, headerHeight: number) {
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(160, headerHeight);
  ctx.lineTo(0, headerHeight - 90);
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function drawFallbackTournamentLogo(ctx: SKRSContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UCUP", cx, cy + 2);
  ctx.restore();
}

async function drawInfoRow(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  labelColor: string
) {
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.arc(x + 18, y, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = labelColor;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x + 50, y + 6);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(value, x + 300, y + 7);

  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 26);
  ctx.lineTo(x + CARD_WIDTH - 2 * x, y + 26);
  ctx.stroke();
}

export async function renderLicenseFront(data: LicenseData): Promise<Canvas> {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f4f5f7";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const headerHeight = 230;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, CARD_WIDTH, headerHeight);
  drawDiagonalAccent(ctx, headerHeight);

  const tournamentLogo = await safeLoadImage(data.tournamentLogo);
  if (tournamentLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(110, 115, 70, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(tournamentLogo, 40, 45, 140, 140);
    ctx.restore();
  } else {
    drawFallbackTournamentLogo(ctx, 110, 115, 70);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 55);
  ctx.lineTo(200, 175);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("LICENCE DE JOUEUR", 225, 90);
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("CHAMPIONNAT UNIVERSITAIRE DE FOOTBALL", 225, 118);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("POINTE-NOIRE & BRAZZAVILLE", 225, 140);

  const uniLogo = await safeLoadImage(data.universityLogo);
  ctx.save();
  ctx.beginPath();
  ctx.arc(CARD_WIDTH - 90, 90, 55, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.clip();
  if (uniLogo) {
    ctx.drawImage(uniLogo, CARD_WIDTH - 145, 35, 110, 110);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.universityShortName.slice(0, 3), CARD_WIDTH - 90, 96);
  }
  ctx.restore();

  const photoBox = { x: 225, y: 260, w: 450, h: 380 };
  ctx.fillStyle = "white";
  roundRect(ctx, photoBox.x - 6, photoBox.y - 6, photoBox.w + 12, photoBox.h + 12, 10);
  ctx.fill();
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  roundRect(ctx, photoBox.x, photoBox.y, photoBox.w, photoBox.h, 6);
  ctx.stroke();

  const photo = await safeLoadImage(data.photo);
  ctx.save();
  roundRect(ctx, photoBox.x, photoBox.y, photoBox.w, photoBox.h, 6);
  ctx.clip();
  if (photo) {
    const scale = Math.max(photoBox.w / photo.width, photoBox.h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, photoBox.x + (photoBox.w - dw) / 2, photoBox.y + (photoBox.h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h);
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${data.firstName[0]}${data.lastName[0]}`, photoBox.x + photoBox.w / 2, photoBox.y + photoBox.h / 2);
  }
  ctx.restore();

  const rows: [string, string][] = [
    ["NOM(S)", data.lastName.toUpperCase()],
    ["PRÉNOM(S)", data.firstName],
    ["POSITION", data.position],
    ["UNIVERSITÉ", data.universityShortName],
    ["NUMÉRO LICENCE", data.licenseNumber],
    ["ÉQUIPE", data.teamName],
    ["VALIDITÉ", "Saison 2026"],
  ];
  let rowY = 700;
  for (const [label, value] of rows) {
    await drawInfoRow(ctx, 60, rowY, label, value, RED_DARK);
    rowY += 48;
  }

  const footerY = rowY + 40;
  ctx.fillStyle = "#111111";
  ctx.font = "italic 22px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Comité d'organisation", 60, footerY);
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText("COMITÉ D'ORGANISATION", 60, footerY + 26);
  ctx.fillText("UCUP 2026", 60, footerY + 44);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/players/verify/${data.licenseNumber}`
  )}`;
  const qrImage = await safeLoadImage(qrUrl);
  if (qrImage) {
    ctx.drawImage(qrImage, 370, footerY - 65, 130, 130);
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(770, footerY, 65, 0, Math.PI * 2);
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("UCUP", 770, footerY - 6);
  ctx.fillText("2026", 770, footerY + 12);

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, CARD_HEIGHT - 40, CARD_WIDTH, 40);
  ctx.fillStyle = "white";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LA PASSION UNIVERSITAIRE, NOTRE FORCE", CARD_WIDTH / 2, CARD_HEIGHT - 15);

  return canvas;
}

export async function renderLicenseBack(data: LicenseData): Promise<Canvas> {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f4f5f7";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const headerHeight = 180;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, CARD_WIDTH, headerHeight);
  drawDiagonalAccent(ctx, headerHeight);

  const tournamentLogo = await safeLoadImage(data.tournamentLogo);
  if (tournamentLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, 90, 55, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(tournamentLogo, 45, 35, 110, 110);
    ctx.restore();
  } else {
    drawFallbackTournamentLogo(ctx, 100, 90, 55);
  }

  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("LICENCE DE JOUEUR", 180, 90);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("SAISON 2026", 180, 120);

  const panelX = 60;
  const panelY = 220;
  const panelW = CARD_WIDTH - 120;
  const panelH = 300;
  ctx.fillStyle = "white";
  roundRect(ctx, panelX, panelY, panelW, panelH, 12);
  ctx.fill();

  ctx.fillStyle = RED;
  roundRect(ctx, panelX + 24, panelY - 18, 300, 44, 22);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CONDITIONS D'UTILISATION", panelX + 44, panelY + 10);

  const conditions = [
    "Cette licence est strictement personnelle et valable uniquement pour le Championnat Universitaire de Football UCUP 2026.",
    "Elle permet au joueur de participer aux rencontres officielles organisées dans le cadre du tournoi.",
    "Toute utilisation frauduleuse, falsification ou prêt de cette licence entraîne des sanctions disciplinaires.",
    "En cas de perte, veuillez contacter le comité d'organisation.",
  ];

  let condY = panelY + 60;
  for (const cond of conditions) {
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(panelX + 45, condY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OK", panelX + 45, condY + 5);

    ctx.fillStyle = "#1f2937";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    condY = wrapText(ctx, cond, panelX + 75, condY - 6, panelW - 110, 22) + 12;
  }

  let y = panelY + panelH + 60;
  ctx.fillStyle = RED;
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ORGANISÉ PAR", CARD_WIDTH / 2, y);
  y += 26;
  ctx.fillStyle = "#111111";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(data.organizerName, CARD_WIDTH / 2, y);
  if (data.organizerSub) {
    y += 24;
    ctx.fillStyle = "#6b7280";
    ctx.font = "15px sans-serif";
    ctx.fillText(data.organizerSub, CARD_WIDTH / 2, y);
  }

  y += 40;
  const blockH = 130;
  ctx.fillStyle = NAVY;
  roundRect(ctx, panelX, y, panelW, blockH, 12);
  ctx.fill();

  const cols: [string, string][] = [
    ["DATE D'ÉMISSION", data.issuedDate],
    ["ÉMIS PAR", "Comité d'organisation"],
    ["VALIDITÉ", "Saison 2026"],
  ];
  const colW = panelW / 3;
  cols.forEach(([label, value], i) => {
    const cx = panelX + colW * i + colW / 2;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, y + 50);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(value, cx, y + 78);
  });

  y += blockH + 30;
  ctx.fillStyle = RED;
  roundRect(ctx, panelX, y, panelW, 56, 10);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NON TRANSFÉRABLE – DOCUMENT OFFICIEL DU TOURNOI", CARD_WIDTH / 2, y + 35);

  return canvas;
}

export async function canvasToBuffer(canvas: Canvas, format: "png" | "jpeg"): Promise<Buffer> {
  if (format === "jpeg") return canvas.encode("jpeg", 92);
  return canvas.encode("png");
}
