// lib/wrap.ts
// Универсальный перенос + подбор размера шрифта так, чтобы текст точно влезал в box (W×H)

const AVG_CHAR_FACTOR = 0.55;     // средняя ширина символа ≈ fontPx * 0.55 (под sans-serif)
const LINE_HEIGHT_EM  = 1.25;     // межстрочный интервал
const MIN_FONT_PX     = 10;       // «пол» шрифта чтобы не превратился в 0

function hardSplit(token: string, maxChars: number) {
  if (token.length <= maxChars) return [token];
  const out: string[] = [];
  for (let i = 0; i < token.length; i += maxChars) {
    out.push(token.slice(i, i + maxChars));
  }
  return out;
}

function layoutWithFontPx(text: string, boxW: number, boxH: number, fontPx: number) {
  const maxCharsPerLine = Math.max(1, Math.floor(boxW / (fontPx * AVG_CHAR_FACTOR)));
  const tokens: string[] = [];
  for (const w of text.split(/\s+/)) {
    if (w.length > maxCharsPerLine) tokens.push(...hardSplit(w, maxCharsPerLine));
    else tokens.push(w);
  }

  const lines: string[] = [];
  let line = "";
  for (const t of tokens) {
    if (!line) { line = t; continue; }
    if (line.length + 1 + t.length <= maxCharsPerLine) line += " " + t;
    else { lines.push(line); line = t; }
  }
  if (line) lines.push(line);

  const totalH = Math.ceil(lines.length * fontPx * LINE_HEIGHT_EM);
  const fitsHeight = totalH <= boxH;
  return { lines, totalH, fitsHeight, fontPx, maxCharsPerLine };
}

/**
 * Подбирает максимально возможный fontPx (не выше baseMaxFontPx), при котором
 * текст с переносами помещается И по ширине (через maxCharsPerLine), И по высоте.
 */
export function wrapToBox(
  text: string,
  boxW: number,
  boxH: number,
  baseMaxFontPx: number,
  minFontPx: number = MIN_FONT_PX
) {
  let lo = minFontPx, hi = Math.max(minFontPx, baseMaxFontPx);
  let best = layoutWithFontPx(text, boxW, boxH, minFontPx);

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cur = layoutWithFontPx(text, boxW, boxH, mid);
    if (cur.fitsHeight) {
      best = cur;            
      lo = mid + 1;
    } else {
      hi = mid - 1;        
    }
  }
  return best; 
}
