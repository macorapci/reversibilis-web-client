import { TEXTS } from "../config/texts";

/** Evre renkleri — CSS değişkenleriyle aynı. */
export const STAGE_COLORS = ["#58d854", "#00a800", "#fcd800", "#e45c10", "#d82800"];

/** 6×7 diş sprite'ı. */
const TOOTH = [
  ".TTTT.",
  "TTTTTT",
  "TTTTTT",
  "TTTTTT",
  "TT..TT",
  "T....T",
  "T....T",
];

const COLS = 10;
const ROWS = 3;
const ICONS = COLS * ROWS;
const W = 440;
const H = 108;

/**
 * Kuyruğun temsili örneklemi: ~40 ikon, evre kovalarının oranlarını gösterir.
 * Milyonlarca hasta tek tek çizilmez.
 */
export function drawQueue(canvas: HTMLCanvasElement, queue: number[], total: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== W * dpr) {
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  const c = canvas.getContext("2d")!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, W, H);

  // zemin: tuğla şerit
  c.fillStyle = "#c84c0c";
  c.fillRect(0, H - 10, W, 10);
  c.fillStyle = "#883000";
  for (let x = 0; x < W; x += 20) c.fillRect(x, H - 10, 3, 10);

  // kuyruk boşken mavi bir boşluk bırakma: durumu söyle
  if (total <= 0) {
    c.font = '8px "Press Start 2P", monospace';
    const label = TEXTS.queueEmpty;
    const tw = c.measureText(label).width;
    c.fillStyle = "#000000";
    c.fillRect((W - tw) / 2 - 8, H / 2 - 18, tw + 16, 20);
    c.fillStyle = "#58d854";
    c.fillText(label, (W - tw) / 2, H / 2 - 4);
    return;
  }

  // kovalara orantılı ikon sayısı (toplam ICONS olacak şekilde)
  const raw = queue.map((q) => (q / total) * ICONS);
  const counts = raw.map((v) => Math.floor(v));
  let left = ICONS - counts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (const o of order) {
    if (left <= 0) break;
    counts[o.i]++;
    left--;
  }

  const cellW = W / COLS;
  const cellH = (H - 14) / ROWS;
  const scale = 4;
  let idx = 0;
  let firstStage4: [number, number] | null = null;

  for (let stage = 0; stage < counts.length; stage++) {
    for (let k = 0; k < counts[stage]; k++, idx++) {
      if (idx >= ICONS) break;
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = Math.round(col * cellW + (cellW - 6 * scale) / 2);
      const y = Math.round(row * cellH + 6);
      c.fillStyle = STAGE_COLORS[stage];
      for (let r = 0; r < TOOTH.length; r++) {
        const line = TOOTH[r];
        for (let q = 0; q < line.length; q++) {
          if (line[q] !== ".") c.fillRect(x + q * scale, y + r * scale, scale, scale);
        }
      }
      if (stage === 3 && !firstStage4) firstStage4 = [x, y];
    }
  }

  // Evre 4'e geçen hastanın üstünde IRREVERSIBILIS etiketi
  if (firstStage4) {
    const [x, y] = firstStage4;
    c.font = '8px "Press Start 2P", monospace';
    const label = TEXTS.irreversibilis;
    const tw = c.measureText(label).width;
    const bx = Math.max(2, Math.min(W - tw - 10, x - tw / 2 + 12));
    c.fillStyle = "#000000";
    c.fillRect(bx - 4, y - 14, tw + 8, 13);
    c.fillStyle = "#d82800";
    c.fillText(label, bx, y - 4);
  }
}
