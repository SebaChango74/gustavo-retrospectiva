// Renderer de placas de PERÓN 365 (regla 70/30: marco y paleta de la app,
// superficie crema y serif editorial del almanaque). Genera siempre la misma
// placa para la misma fecha y versión.

export type P365Day = {
  dayKey: string;
  theme: string;
  quote: {
    text: string;
    shortText: string;
    author: string;
    sourceTitle: string;
    sourceDate: string;
  };
};

const COLORS = {
  navy: "#0b1626",
  navySoft: "#12294a",
  cream: "#f1e7d1",
  ink: "#22201d",
  cobalt: "#234d82",
  coral: "#df5537",
  mustard: "#d2a52f",
  green: "#2ede7f",
  skyBar: "#19baf3",
  muted: "#5c564c",
};

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const MONTHS_FULL = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

export const P365_URL = "gustavobarrera.com/peronismogeselino/peron365";

const photos = new Map<string, Promise<HTMLImageElement>>();
function loadPhoto(src: string): Promise<HTMLImageElement> {
  if (!photos.has(src)) {
    const img = new Image();
    img.src = src;
    photos.set(
      src,
      img.decode().then(() => img),
    );
  }
  return photos.get(src)!;
}

export function photoForTheme(theme: string): string {
  const vertical = ["postal", "sobremesa"];
  return vertical.includes(theme)
    ? "/peronismogeselino/images/peron365/sonrisa-v.jpg"
    : "/peronismogeselino/images/peron365/sonrisa-h.jpg";
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  focusY = 0.32,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = Math.min(Math.max((img.naturalHeight - sh) * focusY, 0), img.naturalHeight - sh);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const serif = (size: number, weight = 700) => `${weight} ${size}px Lora, Georgia, serif`;
const sans = (size: number, weight = 700) => `${weight} ${size}px Manrope, Arial, sans-serif`;
const condensed = (size: number, weight = 900) =>
  `${weight} ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;

export async function renderPeron365Card(
  day: P365Day,
  format: "feed" | "story" = "feed",
): Promise<HTMLCanvasElement> {
  const W = 1080;
  const H = format === "feed" ? 1350 : 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts.ready;
  let photo: HTMLImageElement | null = null;
  try {
    photo = await loadPhoto(photoForTheme(day.theme));
  } catch {
    photo = null;
  }

  const [year, month, dayNum] = day.dayKey.split("-").map(Number);

  // marco azul tinta de la app
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, W, H);

  // encabezado
  const headerY = format === "feed" ? 96 : 180;
  ctx.fillStyle = COLORS.cream;
  ctx.font = condensed(78);
  ctx.fillText("PERÓN", 64, headerY);
  const peronW = ctx.measureText("PERÓN").width;
  // pestaña naranja "365"
  ctx.save();
  ctx.translate(64 + peronW + 26, headerY - 56);
  ctx.rotate(-0.03);
  ctx.fillStyle = COLORS.coral;
  roundedPath(ctx, 0, 0, 150, 72, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.font = condensed(56);
  ctx.fillText("365", 34, 56);
  ctx.restore();
  ctx.fillStyle = COLORS.green;
  ctx.font = sans(26, 800);
  ctx.save();
  // @ts-ignore
  ctx.letterSpacing = "6px";
  ctx.fillText("UNA IDEA POR DÍA", 64 + peronW + 210, headerY - 16);
  ctx.restore();
  // círculo decorativo
  ctx.fillStyle = COLORS.navySoft;
  ctx.beginPath();
  ctx.arc(W - 110, headerY - 24, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.green;
  ctx.beginPath();
  ctx.arc(W - 80, headerY - 52, 14, 0, Math.PI * 2);
  ctx.fill();

  // tarjeta crema con barra celeste
  const cardX = 56;
  const cardW = W - 112;
  const cardY = format === "feed" ? 160 : 300;
  const cardH = format === "feed" ? 1010 : 1330;
  ctx.fillStyle = COLORS.skyBar;
  roundedPath(ctx, cardX, cardY - 14, cardW, 28, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  roundedPath(ctx, cardX, cardY, cardW, cardH, 26);
  ctx.fill();

  // fotografía
  const photoX = cardX + 36;
  const photoW = cardW - 72;
  const photoY = cardY + 44;
  const photoH = format === "feed" ? 420 : 560;
  if (photo) {
    ctx.save();
    roundedPath(ctx, photoX, photoY, photoW, photoH, 18);
    ctx.clip();
    drawCover(ctx, photo, photoX, photoY, photoW, photoH, 0.25);
    ctx.restore();
  }

  // bloque de fecha estilo almanaque
  const dateW = 220;
  const dateH = 212;
  const dateX = photoX;
  const dateY = photoY + photoH - 118;
  ctx.save();
  ctx.shadowColor = "rgba(34,32,29,.25)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = COLORS.coral;
  roundedPath(ctx, dateX, dateY, dateW, dateH, 16);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.navy;
  ctx.font = condensed(120);
  const dayText = String(dayNum);
  const dayW = ctx.measureText(dayText).width;
  ctx.fillText(dayText, dateX + (dateW - dayW) / 2, dateY + 122);
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(dateX + 46, dateY + 142);
  ctx.lineTo(dateX + dateW - 46, dateY + 142);
  ctx.stroke();
  ctx.font = sans(24, 800);
  const monthText = `${MONTHS[month - 1]} · ${year}`;
  const monthW = ctx.measureText(monthText).width;
  ctx.fillText(monthText, dateX + (dateW - monthW) / 2, dateY + 182);

  // cita en serif con comillas mostaza. El tamaño baja hasta que la frase,
  // el autor y la fuente entren sin pisarse con la etiqueta ni el pie.
  const quoteX = dateX + dateW + 44;
  const quoteMaxW = cardX + cardW - 64 - quoteX;
  const quoteTop = photoY + photoH + 62;
  const tagY = cardY + cardH - 214;
  const sizes = [64, 56, 50, 44, 40, 36];

  type Layout = { size: number; lines: string[]; dividerY: number; sourceLines: string[] };
  const tryLayout = (text: string): Layout | null => {
    for (const size of sizes) {
      ctx.font = serif(size);
      const lines = wrapLines(ctx, text, quoteMaxW);
      const lineHeight = Math.round(size * 1.18);
      const quoteEnd = quoteTop + 10 + (lines.length - 1) * lineHeight;
      const dividerY = Math.max(quoteEnd + 44, dateY + dateH + 44);
      ctx.font = sans(27, 500);
      const sourceLines = wrapLines(ctx, day.quote.sourceTitle, quoteMaxW).slice(0, 2);
      const sourceEnd =
        dividerY + 112 + sourceLines.length * 38 + (day.quote.sourceDate ? 38 : 0);
      if (sourceEnd <= tagY - 28) return { size, lines, dividerY, sourceLines };
    }
    return null;
  };

  let textToUse = day.quote.text;
  let layout = tryLayout(textToUse);
  if (!layout && day.quote.shortText && day.quote.shortText !== textToUse) {
    textToUse = day.quote.shortText;
    layout = tryLayout(textToUse);
  }
  if (!layout) {
    ctx.font = serif(36);
    layout = {
      size: 36,
      lines: wrapLines(ctx, textToUse, quoteMaxW).slice(0, 5),
      dividerY: tagY - 200,
      sourceLines: [day.quote.sourceTitle.slice(0, 60)],
    };
  }

  ctx.fillStyle = COLORS.mustard;
  ctx.font = serif(84);
  ctx.fillText("“", quoteX - 8, quoteTop + 14);
  ctx.fillStyle = COLORS.ink;
  ctx.font = serif(layout.size);
  let cursorY = quoteTop + 10;
  const lineHeight = Math.round(layout.size * 1.18);
  for (const [index, line] of layout.lines.entries()) {
    ctx.fillText(line, index === 0 ? quoteX + 64 : quoteX, cursorY);
    cursorY += lineHeight;
  }

  // divisor celeste
  const dividerY = layout.dividerY;
  ctx.fillStyle = COLORS.skyBar;
  ctx.fillRect(quoteX, dividerY, quoteMaxW, 6);

  // autor y fuente
  ctx.fillStyle = COLORS.cobalt;
  ctx.font = sans(30, 800);
  ctx.save();
  // @ts-ignore
  ctx.letterSpacing = "3px";
  ctx.fillText(day.quote.author.toUpperCase(), quoteX, dividerY + 62);
  ctx.restore();
  ctx.fillStyle = COLORS.muted;
  ctx.font = sans(27, 500);
  let sourceY = dividerY + 112;
  for (const line of layout.sourceLines) {
    ctx.fillText(line, quoteX, sourceY);
    sourceY += 38;
  }
  if (day.quote.sourceDate) {
    ctx.fillText(day.quote.sourceDate, quoteX, sourceY);
    sourceY += 38;
  }

  // etiqueta verde
  ctx.save();
  ctx.translate(cardX + 36, tagY);
  ctx.rotate(-0.012);
  ctx.fillStyle = COLORS.green;
  roundedPath(ctx, 0, 0, 428, 62, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.navy;
  ctx.font = sans(23, 800);
  ctx.save();
  // @ts-ignore
  ctx.letterSpacing = "3px";
  ctx.fillText("UNA IDEA PARA COMPARTIR", 28, 41);
  ctx.restore();
  ctx.restore();

  // pie de la tarjeta
  ctx.strokeStyle = "rgba(34,32,29,.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 36, cardY + cardH - 108);
  ctx.lineTo(cardX + cardW - 36, cardY + cardH - 108);
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.font = sans(23, 800);
  ctx.save();
  // @ts-ignore
  ctx.letterSpacing = "2px";
  ctx.fillText("PERONISMO GESELINO", cardX + 36, cardY + cardH - 52);
  ctx.restore();
  ctx.fillStyle = COLORS.cobalt;
  ctx.font = sans(20, 600);
  const urlW = ctx.measureText(P365_URL).width;
  ctx.fillText(P365_URL, cardX + cardW - 36 - urlW, cardY + cardH - 52);

  // leyendas fuera de la tarjeta
  const footY = H - (format === "feed" ? 52 : 96);
  ctx.fillStyle = COLORS.cream;
  ctx.font = sans(24, 800);
  ctx.save();
  // @ts-ignore
  ctx.letterSpacing = "4px";
  ctx.fillText("LA FRASE DE HOY", 64, footY);
  ctx.restore();
  ctx.fillStyle = COLORS.green;
  const dateDots = `${String(dayNum).padStart(2, "0")} · ${String(month).padStart(2, "0")} · ${year}`;
  ctx.font = sans(24, 800);
  const dotsW = ctx.measureText(dateDots).width;
  ctx.fillText(dateDots, W - 64 - dotsW, footY);

  return canvas;
}

export function longDate(dayKey: string): string {
  const [year, month, dayNum] = dayKey.split("-").map(Number);
  return `${dayNum} DE ${MONTHS_FULL[month - 1]} DE ${year}`;
}

export function shortDateParts(dayKey: string): { day: string; monthYear: string } {
  const [year, month, dayNum] = dayKey.split("-").map(Number);
  return { day: String(dayNum), monthYear: `${MONTHS[month - 1]} · ${year}` };
}
