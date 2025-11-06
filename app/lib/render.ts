import sharp from "sharp";
import { wrapToBox } from "./wrap";
import { slugify } from "./slug";
import '@fontsource-variable/noto-sans';

export type FieldName = "fio" | "course" | "id";
export type Align = "left" | "center" | "right";
export type FieldBox = { name: FieldName; x: number; y: number; w: number; h: number; align: Align };

const DEFAULT_FONT_FAMILY = "Inter, Arial, sans-serif";

const FIELD_FONT_MULTIPLIER: Record<FieldName, number> = {
  fio: 1.0,
  course: 1.0,
  id: 0.75, 
};

function escapeXml(s: string){ return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"}[c]!)); }

function svgTextBlock(lines: string[], fontPx: number, align: Align, x: number, y: number, w: number, h: number, color = "#111") {
  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const xPos   = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
  const lineGap = Math.round(fontPx * 1.25);
  const startY = y + Math.max(fontPx, Math.min(h, Math.round((h - (lines.length - 1) * lineGap) / 2)));
  const tspans = lines.map((ln, i) => `<tspan x="${xPos}" dy="${i===0?0:lineGap}">${escapeXml(ln)}</tspan>`).join("");
  return `<text x="${xPos}" y="${startY}" text-anchor="${anchor}" font-family="'Noto Sans Variable', sans-serif;" font-size="${fontPx}" fill="${color}">${tspans}</text>`;
}

export async function renderCertificate(opts: {
  templateBuffer: Buffer;
  mime: "image/png" | "image/jpeg";
  fields: FieldBox[];
  data: { fio: string; course: string; id: string };
  outFormat?: "png" | "jpg";
}) {
  const { templateBuffer, mime, fields, data, outFormat = "png" } = opts;
  const img = sharp(templateBuffer);
  const meta = await img.metadata();
  const W = meta.width || 0, H = meta.height || 0;
  if (!W || !H) throw new Error("Bad template dimensions");

  const svgParts: string[] = [];
  const baseFont = Math.round(Math.min(W, H) / 18);

  for (const f of fields) {
    const text = f.name === "fio" ? data.fio : f.name === "course" ? data.course : data.id;

    const maxFontForField = Math.max(10, Math.round(baseFont * (FIELD_FONT_MULTIPLIER[f.name] ?? 1)));

    const fit = wrapToBox(text, f.w, f.h, maxFontForField);

    svgParts.push(svgTextBlock(fit.lines, fit.fontPx, f.align, f.x, f.y, f.w, f.h));
  }

  const svg = Buffer.from(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svgParts.join("")}</svg>`);
  const out = await img.composite([{ input: svg, top: 0, left: 0 }])[(outFormat === "jpg" ? "jpeg" : "png")]().toBuffer();
  return out;
}

export function buildFilename(id: string, course: string, fio: string, ext: "png" | "jpg") {
  return `CERT-${id}-${slugify(course)}-${slugify(fio)}.${ext}`;
}
