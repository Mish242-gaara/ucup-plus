import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D, type Canvas } from "@napi-rs/canvas";

export const CARD_WIDTH = 900;
export const CARD_HEIGHT = 1260;

const NAVY = "#0B1B3D";
const RED = "#D51F2A";
const TEXT_DARK = "#1E293B";

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

// Enregistrement des polices pour le serveur
let fontsLoaded = false;
async function ensureFonts() {
  if (fontsLoaded) return;
  try {
    const [boldRes, regRes] = await Promise.all([
      fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf"),
      fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf"),
    ]);

    if (boldRes.ok && regRes.ok) {
      const [boldBuffer, regBuffer] = await Promise.all([
        boldRes.arrayBuffer(),
        regRes.arrayBuffer(),
      ]);
      GlobalFonts.register(Buffer.from(boldBuffer), "InterBold");
      GlobalFonts.register(Buffer.from(regBuffer), "InterRegular");
      fontsLoaded = true;
    }
  } catch (e) {
    console.error("Erreur de chargement des polices :", e);
  }
}

const font = (size: number, weight: "bold" | "regular" = "bold") =>
  `${weight === "bold" ? "700" : "400"} ${size}px ${fontsLoaded ? (weight === "bold" ? "InterBold" : "InterRegular") : "sans-serif"}`;

async function safeLoadImage(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await loadImage(Buffer.from(await res.arrayBuffer()));
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

// Dessin des icônes vectorielles des champs
function drawRowIcon(ctx: SKRSContext2D, type: string, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.lineWidth = 2;

  if (type === "user") {
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 10, Math.PI, 0);
    ctx.stroke();
  } else if (type === "run") {
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 1); ctx.lineTo(cx + 3, cy - 2); ctx.lineTo(cx + 7, cy + 4);
    ctx.moveTo(cx - 2, cy + 3); ctx.lineTo(cx - 6, cy + 10);
    ctx.moveTo(cx + 2, cy + 4); ctx.lineTo(cx + 5, cy + 11);
    ctx.stroke();
  } else if (type === "uni") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9); ctx.lineTo(cx - 10, cy - 3); ctx.lineTo(cx + 10, cy - 3); ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 8, cy - 1, 3, 7);
    ctx.fillRect(cx - 1.5, cy - 1, 3, 7);
    ctx.fillRect(cx + 5, cy - 1, 3, 7);
    ctx.fillRect(cx - 10, cy + 7, 20, 2);
  } else if (type === "card") {
    roundRect(ctx, cx - 9, cy - 6, 18, 12, 2);
    ctx.stroke();
    ctx.fillRect(cx - 6, cy - 2, 6, 2);
  } else if (type === "team") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 8, cy - 5); ctx.lineTo(cx + 6, cy + 5); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 6, cy + 5); ctx.lineTo(cx - 8, cy - 5); ctx.closePath();
    ctx.stroke();
  } else if (type === "cal") {
    roundRect(ctx, cx - 8, cy - 7, 16, 14, 2);
    ctx.stroke();
    ctx.fillRect(cx - 8, cy - 3, 16, 2);
  }
  ctx.restore();
}

// =========================================================
// RECTO DE LA LICENCE
// =========================================================
export async function renderLicenseFront(data: LicenseData): Promise<Canvas> {
  await ensureFonts();
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  // 1. Fond général clair
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 2. En-tête Bleu Nuit avec coupe en diagonale
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(CARD_WIDTH, 0);
  ctx.lineTo(CARD_WIDTH, 200);
  ctx.lineTo(0, 360);
  ctx.closePath();
  ctx.fill();

  // 3. Triangle Rouge en haut à gauche
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(160, 0);
  ctx.lineTo(0, 220);
  ctx.closePath();
  ctx.fill();

  // 4. Polygone Rouge milieu gauche (sous l'en-tête bleu)
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(140, 450);
  ctx.lineTo(0, 540);
  ctx.closePath();
  ctx.fill();

  // Logo UCUP (En-tête Gauche)
  const tournamentLogo = await safeLoadImage(data.tournamentLogo);
  if (tournamentLogo) {
    ctx.drawImage(tournamentLogo, 35, 25, 90, 90);
  } else {
    ctx.fillStyle = "white";
    ctx.font = font(22);
    ctx.fillText("UCUP", 55, 75);
  }
  ctx.fillStyle = "white";
  ctx.font = font(14);
  ctx.textAlign = "center";
  ctx.fillText("UCUP 2026", 80, 135);

  // Titres En-tête
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.font = font(32);
  ctx.fillText("LICENCE DE JOUEUR", 185, 75);
  ctx.font = font(14, "regular");
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText("CHAMPIONNAT UNIVERSITAIRE DE FOOTBALL", 185, 105);
  ctx.font = font(12, "regular");
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.fillText("POINTE-NOIRE & BRAZZAVILLE", 185, 125);

  // Logo Université (En-tête Droite)
  const uniLogo = await safeLoadImage(data.universityLogo);
  ctx.save();
  ctx.beginPath();
  ctx.arc(CARD_WIDTH - 85, 85, 50, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.clip();
  if (uniLogo) {
    ctx.drawImage(uniLogo, CARD_WIDTH - 135, 35, 100, 100);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = font(20);
    ctx.textAlign = "center";
    ctx.fillText(data.universityShortName.slice(0, 4), CARD_WIDTH - 85, 92);
  }
  ctx.restore();

  // Photo du joueur
  const photoBox = { x: (CARD_WIDTH - 420) / 2, y: 180, w: 420, h: 350 };
  ctx.fillStyle = "white";
  roundRect(ctx, photoBox.x - 4, photoBox.y - 4, photoBox.w + 8, photoBox.h + 8, 8);
  ctx.fill();
  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
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
    ctx.fillStyle = "#CBD5E1";
    ctx.fillRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h);
    ctx.fillStyle = "#475569";
    ctx.font = font(70);
    ctx.textAlign = "center";
    ctx.fillText(`${data.firstName[0] ?? ""}${data.lastName[0] ?? ""}`, photoBox.x + photoBox.w / 2, photoBox.y + photoBox.h / 2 + 25);
  }
  ctx.restore();

  // Lignes d'informations
  const rows = [
    { icon: "user", label: "NOM(S)", val: data.lastName.toUpperCase() },
    { icon: "user", label: "PRÉNOM(S)", val: data.firstName },
    { icon: "run", label: "POSITION", val: data.position },
    { icon: "uni", label: "UNIVERSITÉ", val: data.universityShortName },
    { icon: "card", label: "NUMÉRO LICENCE", val: data.licenseNumber },
    { icon: "team", label: "ÉQUIPE", val: data.teamName },
    { icon: "cal", label: "VALIDITÉ", val: "Saison 2026" },
  ];

  let startY = 580;
  const lineGap = 48;

  rows.forEach((r, idx) => {
    const y = startY + idx * lineGap;
    drawRowIcon(ctx, r.icon, 120, y);

    ctx.fillStyle = TEXT_DARK;
    ctx.font = font(20);
    ctx.textAlign = "left";
    ctx.fillText(r.label, 155, y + 7);
    ctx.fillText(":", 380, y + 7);

    ctx.fillStyle = RED;
    ctx.font = font(22);
    ctx.fillText(r.val, 405, y + 7);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, y + 22);
    ctx.lineTo(CARD_WIDTH - 100, y + 22);
    ctx.stroke();
  });

  // Bas de carte (Signature, QR Code, Tampon)
  const footerY = 960;

  ctx.fillStyle = TEXT_DARK;
  ctx.font = font(14);
  ctx.textAlign = "left";
  ctx.fillText("COMITÉ D'ORGANISATION", 100, footerY + 80);
  ctx.font = font(12, "regular");
  ctx.fillText("UCUP 2026", 100, footerY + 98);

  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, footerY + 45);
  ctx.bezierCurveTo(130, footerY + 10, 150, footerY + 60, 190, footerY + 30);
  ctx.stroke();

  // 💡 URL Dynamique : Utilise l'URL du domaine de prod Vercel si disponible
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://ucup-plus.vercel.app");

  const verifyUrl = `${baseUrl}/players/verify/${data.licenseNumber}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    verifyUrl
  )}`;
  const qrImage = await safeLoadImage(qrUrl);
  if (qrImage) {
    ctx.drawImage(qrImage, (CARD_WIDTH - 130) / 2, footerY, 130, 130);
  }

  ctx.save();
  ctx.translate(CARD_WIDTH - 160, footerY + 65);
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fillStyle = "#E0F2FE";
  ctx.fill();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = NAVY;
  ctx.font = font(12);
  ctx.textAlign = "center";
  ctx.fillText("UCUP", 0, -5);
  ctx.fillText("2026", 0, 15);
  ctx.restore();

  // Bandeau inférieur avec coins rouges
  const botY = CARD_HEIGHT - 50;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, botY, CARD_WIDTH, 50);

  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(0, CARD_HEIGHT); ctx.lineTo(90, CARD_HEIGHT); ctx.lineTo(0, botY); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH, CARD_HEIGHT); ctx.lineTo(CARD_WIDTH - 90, CARD_HEIGHT); ctx.lineTo(CARD_WIDTH, botY); ctx.closePath(); ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = font(16);
  ctx.textAlign = "center";
  ctx.fillText("LA PASSION UNIVERSITAIRE, NOTRE FORCE", CARD_WIDTH / 2, botY + 30);

  return canvas;
}

// =========================================================
// VERSO DE LA LICENCE
// =========================================================
export async function renderLicenseBack(data: LicenseData): Promise<Canvas> {
  await ensureFonts();
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  // 1. Fond clair
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 2. Grande bande Bleu Nuit en diagonale vers le bas à droite
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(CARD_WIDTH, 0);
  ctx.lineTo(CARD_WIDTH, 660);
  ctx.lineTo(0, 200);
  ctx.closePath();
  ctx.fill();

  // 3. Triangle Rouge haut gauche
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(160, 0);
  ctx.lineTo(0, 200);
  ctx.closePath();
  ctx.fill();

  // 4. Grand Triangle Rouge en bas à droite
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH, CARD_HEIGHT);
  ctx.lineTo(600, CARD_HEIGHT);
  ctx.lineTo(CARD_WIDTH, 800);
  ctx.closePath();
  ctx.fill();

  // Logo UCUP
  const tournamentLogo = await safeLoadImage(data.tournamentLogo);
  if (tournamentLogo) {
    ctx.drawImage(tournamentLogo, 35, 20, 80, 80);
  }
  ctx.fillStyle = "white";
  ctx.font = font(12);
  ctx.textAlign = "center";
  ctx.fillText("UCUP 2026", 75, 118);

  ctx.textAlign = "left";
  ctx.font = font(32);
  ctx.fillText("LICENCE DE JOUEUR", 170, 75);
  ctx.font = font(16, "regular");
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText("SAISON 2026", 170, 110);

  // Carte Conditions
  const cardX = 60;
  const cardY = 220;
  const cardW = CARD_WIDTH - 120;
  const cardH = 380;

  ctx.fillStyle = "white";
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();

  // Badge rouge "CONDITIONS D'UTILISATION"
  ctx.fillStyle = RED;
  roundRect(ctx, cardX + 30, cardY + 25, 280, 42, 21);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = font(14);
  ctx.textAlign = "center";
  ctx.fillText("CONDITIONS D'UTILISATION", cardX + 170, cardY + 51);

  // Conditions
  const conds = [
    "Cette licence est strictement personnelle et valable uniquement pour le Championnat Universitaire de Football UCUP 2026.",
    "Elle permet au joueur de participer aux rencontres officielles organisées dans le cadre du tournoi.",
    "Toute utilisation frauduleuse, falsification ou prêt de cette licence entraîne des sanctions disciplinaires.",
    "En cas de perte, veuillez contacter le comité d'organisation.",
  ];

  let cY = cardY + 105;
  conds.forEach((text) => {
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(cardX + 45, cY + 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = font(11);
    ctx.textAlign = "center";
    ctx.fillText("✓", cardX + 45, cY + 12);

    ctx.fillStyle = TEXT_DARK;
    ctx.font = font(15, "regular");
    ctx.textAlign = "left";

    const words = text.split(" ");
    let line = "";
    let lineY = cY + 12;
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > cardW - 100) {
        ctx.fillText(line, cardX + 75, lineY);
        line = w;
        lineY += 22;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line, cardX + 75, lineY);

    cY = lineY + 28;
  });

  // Section Organisé Par
  let orgY = cardY + cardH + 60;
  ctx.fillStyle = RED;
  ctx.font = font(16);
  ctx.textAlign = "center";
  ctx.fillText("ORGANISÉ PAR", CARD_WIDTH / 2, orgY);

  ctx.fillStyle = TEXT_DARK;
  ctx.font = font(18);
  ctx.fillText(data.organizerName, CARD_WIDTH / 2, orgY + 28);
  if (data.organizerSub) {
    ctx.font = font(14, "regular");
    ctx.fillStyle = "#64748B";
    ctx.fillText(data.organizerSub, CARD_WIDTH / 2, orgY + 50);
  }

  // Bloc d'infos bas (Bleu Nuit)
  const blockY = 820;
  const blockH = 180;
  ctx.fillStyle = NAVY;
  roundRect(ctx, cardX, blockY, cardW, blockH, 16);
  ctx.fill();

  const cols = [
    { label: "DATE D'ÉMISSION", val: data.issuedDate },
    { label: "ÉMIS PAR", val: "Comité d'organisation\nUCUP 2026" },
    { label: "VALIDITÉ", val: "Saison 2026" },
  ];

  const colW = cardW / 3;
  cols.forEach((col, i) => {
    const cx = cardX + i * colW + colW / 2;

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = font(13);
    ctx.textAlign = "center";
    ctx.fillText(col.label, cx, blockY + 55);

    ctx.fillStyle = "white";
    ctx.font = font(16);
    const lines = col.val.split("\n");
    if (lines.length > 1) {
      ctx.fillText(lines[0], cx, blockY + 90);
      ctx.fillText(lines[1], cx, blockY + 112);
    } else {
      ctx.fillText(col.val, cx, blockY + 100);
    }
  });

  // Pilule d'avertissement rouge
  const warnY = blockY + blockH + 35;
  ctx.fillStyle = RED;
  roundRect(ctx, cardX, warnY, cardW, 60, 12);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = font(16);
  ctx.textAlign = "center";
  ctx.fillText("⚠  NON TRANSFÉRABLE – DOCUMENT OFFICIEL DU TOURNOI", CARD_WIDTH / 2, warnY + 36);

  return canvas;
}

export async function canvasToBuffer(canvas: Canvas, format: "png" | "jpeg"): Promise<Buffer> {
  if (format === "jpeg") return canvas.encode("jpeg", 92);
  return canvas.encode("png");
}