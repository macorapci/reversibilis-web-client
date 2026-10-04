/**
 * Önizleme görsellerini üretir:  npm run og
 *   public/og.png               1200×630  (Open Graph / Twitter kartı)
 *   public/apple-touch-icon.png  180×180
 *
 * Her şey piksel dikdörtgenlerden çizilir: harici görsel de, harici font da
 * yoktur. Yazılar scripts/pixelfont.mjs içindeki 5×7 fontla basılır.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { textRects } from "./pixelfont.mjs";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// NES Super Mario Bros. 1-1 paleti — oyunla birebir aynı
const BLACK = "#000000";
const WHITE = "#fcfcfc";
const SKY = "#5c94fc";
const BLUE = "#0058f8";
const BRICK = "#c84c0c";
const BRICK_LO = "#883000";
const GREEN_LO = "#006800";
const COIN = "#fcd800";

/** 16×16 diş — src/ui/sprites.ts içindeki TOOTH_BIG ile aynı. */
const TOOTH = [
  "..TTTTTTTTTTTT..",
  ".TTTTTTTTTTTTTT.",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTT",
  "TTTTT......TTTTT",
  "TTTT........TTTT",
  "TTT..........TTT",
  "TTT..........TTT",
  "TTT..........TTT",
  ".TT..........TT.",
  ".TT..........TT.",
];

const CLOUD = [
  "....CC........",
  "...CCCC...CC..",
  "..CCCCCC.CCCC.",
  ".CCCCCCCCCCCCC",
  "CCCCCCCCCCCCCC",
  ".CCCCCCCCCCCC.",
];

const HILL = [
  ".......HH.......",
  "......HHHH......",
  ".....HHHHHH.....",
  "...HHHHHHHHHH...",
  "..HHHHHHHHHHHH..",
  ".HHHHHHHHHHHHHH.",
  "HHHHHHHHHHHHHHHH",
  "HHHHHHHHHHHHHHHH",
];

const r = (x, y, w, h, fill) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

const text = (s, x, y, scale, color, align = "center") =>
  textRects(s, x, y, scale, align)
    .map(([rx, ry, rw, rh]) => r(rx, ry, rw, rh, color))
    .join("");

function spriteSvg(art, x, y, scale, color) {
  const palette = { T: color ?? WHITE, C: WHITE, H: GREEN_LO };
  let s = "";
  for (let row = 0; row < art.length; row++) {
    for (let col = 0; col < art[row].length; col++) {
      const ch = art[row][col];
      if (ch === ".") continue;
      s += r(x + col * scale, y + row * scale, scale, scale, palette[ch] ?? color ?? WHITE);
    }
  }
  return s;
}

/** Tuğla zemin şeridi. */
function groundSvg(y, h) {
  let s = r(0, y, 1200, h, BRICK);
  for (let x = 0; x < 1200; x += 48) s += r(x, y, 6, h, BRICK_LO);
  for (let yy = y; yy < y + h; yy += 48) s += r(0, yy, 1200, 6, BRICK_LO);
  return s;
}

/** Kenarlıklı çerçeve. */
const frame = (x, y, w, h, lw, color) =>
  r(x, y, w, lw, color) +
  r(x, y + h - lw, w, lw, color) +
  r(x, y, lw, h, color) +
  r(x + w - lw, y, lw, h, color);

// --- gökyüzü süsleri ---
let scenery = "";
for (const [x, y, sc] of [
  [60, 70, 5],
  [860, 110, 4],
  [300, 60, 3],
  [640, 150, 3],
]) scenery += spriteSvg(CLOUD, x, y, sc, WHITE);
scenery += spriteSvg(HILL, 40, 430, 6);
scenery += spriteSvg(HILL, 980, 462, 5);

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" shape-rendering="crispEdges">
  ${r(0, 0, 1200, 630, SKY)}
  ${scenery}
  ${groundSvg(534, 96)}
  ${r(486, 54, 228, 228, BLACK)}
  ${r(498, 66, 204, 204, BLUE)}
  ${spriteSvg(TOOTH, 522, 90, 9, WHITE)}
  ${r(96, 310, 1008, 104, BLACK)}
  ${text("REVERSIBILIS", 600, 336, 9, WHITE)}
  ${r(180, 432, 840, 108, BLACK)}
  ${text("1940'TAN BAŞLA.", 600, 448, 4, COIN)}
  ${text("KAÇA KADAR DAYANABİLİRSİN?", 600, 490, 4, COIN)}
  ${text("REVERSIBILIS.COM", 600, 574, 4, WHITE)}
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" shape-rendering="crispEdges">
  ${r(0, 0, 180, 180, SKY)}
  ${frame(0, 0, 180, 180, 10, BLACK)}
  ${spriteSvg(TOOTH, 26, 26, 8, BLUE)}
</svg>`;

for (const [name, svg] of [
  ["og.png", og],
  ["apple-touch-icon.png", icon],
]) {
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(join(out, name), buf);
  console.log(`${name}  ${(buf.length / 1024).toFixed(1)} KB`);
}
