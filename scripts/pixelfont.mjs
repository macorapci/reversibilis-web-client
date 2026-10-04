/**
 * Minik 5×7 piksel font. Yalnızca önizleme görsellerindeki sabit metinler
 * için gerekir, bu yüzden sadece kullanılan harfler tanımlıdır.
 *
 * Satırlar "/" ile ayrılır; X dolu, . boştur. Türkçe harfler temel harfin
 * üstüne/altına işaret eklenerek üretilir — ayrı glif tutulmaz.
 */
const G = {
  A: ".XXX./X...X/X...X/XXXXX/X...X/X...X/X...X",
  B: "XXXX./X...X/X...X/XXXX./X...X/X...X/XXXX.",
  C: ".XXXX/X..../X..../X..../X..../X..../.XXXX",
  D: "XXXX./X...X/X...X/X...X/X...X/X...X/XXXX.",
  E: "XXXXX/X..../X..../XXXX./X..../X..../XXXXX",
  G: ".XXXX/X..../X..../X..XX/X...X/X...X/.XXXX",
  I: "XXXXX/..X../..X../..X../..X../..X../XXXXX",
  K: "X...X/X..X./X.X../XX.../X.X../X..X./X...X",
  L: "X..../X..../X..../X..../X..../X..../XXXXX",
  M: "X...X/XX.XX/X.X.X/X.X.X/X...X/X...X/X...X",
  N: "X...X/XX..X/X.X.X/X.X.X/X..XX/X...X/X...X",
  O: ".XXX./X...X/X...X/X...X/X...X/X...X/.XXX.",
  R: "XXXX./X...X/X...X/XXXX./X.X../X..X./X...X",
  S: ".XXXX/X..../X..../.XXX./....X/....X/XXXX.",
  U: "X...X/X...X/X...X/X...X/X...X/X...X/.XXX.",
  V: "X...X/X...X/X...X/X...X/X...X/.X.X./..X..",
  Y: "X...X/X...X/.X.X./..X../..X../..X../..X..",
  F: "XXXXX/X..../X..../XXXX./X..../X..../X....",
  H: "X...X/X...X/X...X/XXXXX/X...X/X...X/X...X",
  P: "XXXX./X...X/X...X/XXXX./X..../X..../X....",
  T: "XXXXX/..X../..X../..X../..X../..X../..X..",
  Z: "XXXXX/....X/...X./..X../.X.../X..../XXXXX",
  ":": "...../..X../...../...../..X../...../.....",
  "0": ".XXX./X...X/X..XX/X.X.X/XX..X/X...X/.XXX.",
  "1": "..X../.XX../..X../..X../..X../..X../XXXXX",
  "2": ".XXX./X...X/....X/...X./..X../.X.../XXXXX",
  "3": "XXXXX/...X./..XX./....X/....X/X...X/.XXX.",
  "4": "...X./..XX./.X.X./X..X./XXXXX/...X./...X.",
  "5": "XXXXX/X..../XXXX./....X/....X/X...X/.XXX.",
  "6": "..XX./.X.../X..../XXXX./X...X/X...X/.XXX.",
  "7": "XXXXX/....X/...X./..X../.X.../.X.../.X...",
  "8": ".XXX./X...X/X...X/.XXX./X...X/X...X/.XXX.",
  "9": ".XXX./X...X/X...X/.XXXX/....X/...X./.XX..",
  "'": "..X../..X../..X../...../...../...../.....",
  "-": "...../...../...../.XXX./...../...../.....",
  ".": "...../...../...../...../...../...../..X..",
  "?": ".XXX./X...X/....X/...X./..X../...../..X..",
  " ": "...../...../...../...../...../...../.....",
};

/** Türkçe harfler: temel harf + üstte/altta işaret. */
const DECO = {
  Ç: ["C", "cedilla"],
  Ş: ["S", "cedilla"],
  İ: ["I", "dot"],
  Ö: ["O", "umlaut"],
  Ü: ["U", "umlaut"],
  Ğ: ["G", "breve"],
};

const GLYPH_W = 5;
const GLYPH_H = 7;

/** Bir karakterin piksel listesini döndürür: [sütun, satır] çiftleri. */
function glyphPixels(ch) {
  const deco = DECO[ch];
  const base = deco ? deco[0] : ch;
  const rows = (G[base] ?? G["?"]).split("/");
  const out = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === "X") out.push([c, r]);
  });
  if (!deco) return out;
  switch (deco[1]) {
    case "dot":
      out.push([2, -2]);
      break;
    case "umlaut":
      out.push([1, -2], [3, -2]);
      break;
    case "breve":
      out.push([1, -2], [2, -2], [3, -2]);
      break;
    case "cedilla":
      out.push([2, GLYPH_H], [1, GLYPH_H + 1], [2, GLYPH_H + 1]);
      break;
  }
  return out;
}

export function textWidth(text, scale, tracking = 1) {
  return text.length * (GLYPH_W + tracking) * scale - tracking * scale;
}

/**
 * Metni dikdörtgenler listesi olarak döndürür (SVG/canvas'tan bağımsız).
 * align: "left" | "center" | "right"
 */
export function textRects(text, x, y, scale, align = "left", tracking = 1) {
  const w = textWidth(text, scale, tracking);
  const ox = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  const rects = [];
  const chars = [...text.toUpperCase()];
  chars.forEach((ch, i) => {
    const gx = ox + i * (GLYPH_W + tracking) * scale;
    for (const [c, r] of glyphPixels(ch)) {
      rects.push([Math.round(gx + c * scale), Math.round(y + r * scale), scale, scale]);
    }
  });
  return rects;
}

export const FONT_H = GLYPH_H;
