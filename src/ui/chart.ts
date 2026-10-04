import { TEXTS } from "../config/texts";
import type { Trace } from "../sim/types";

const W = 440;
const H = 180;
const PAD_L = 30;
const PAD_B = 22;
const PAD_T = 10;
const PAD_R = 8;

/**
 * Memnuniyet grafiği: düz çizgi oyuncunun oyunu, kesikli çizgi
 * "2026'da 10 bin atama yapılsaydı" yeniden oynatması.
 */
export function drawChart(canvas: HTMLCanvasElement, mine: Trace, ghost: Trace) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const c = canvas.getContext("2d")!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#fcfcfc";
  c.fillRect(0, 0, W, H);

  const years = [...mine.year, ...ghost.year];
  const x0 = Math.min(...years);
  const x1 = Math.max(...years);
  const px = (y: number) => PAD_L + ((y - x0) / Math.max(1, x1 - x0)) * (W - PAD_L - PAD_R);
  const py = (v: number) => PAD_T + (1 - v / 100) * (H - PAD_T - PAD_B);

  // ızgara ve eksenler
  c.strokeStyle = "#bcbcbc";
  c.lineWidth = 1;
  c.font = '7px "Press Start 2P", monospace';
  c.fillStyle = "#7c7c7c";
  for (const v of [0, 50, 100]) {
    const y = Math.round(py(v)) + 0.5;
    c.beginPath();
    c.moveTo(PAD_L, y);
    c.lineTo(W - PAD_R, y);
    c.stroke();
    c.fillText(String(v), 4, y + 3);
  }
  const step = x1 - x0 > 90 ? 40 : 20;
  for (let y = Math.ceil(x0 / step) * step; y <= x1; y += step) {
    c.fillText(String(y), px(y) - 14, H - 6);
  }

  const line = (tr: Trace, color: string, dashed: boolean) => {
    if (tr.year.length === 0) return;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 3;
    if (dashed) c.setLineDash([6, 5]);
    c.beginPath();
    for (let i = 0; i < tr.year.length; i += 2) {
      const x = px(tr.year[i]);
      const y = py(tr.satisfaction[i]);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.restore();
  };

  line(ghost, "#006800", true);
  line(mine, "#0058f8", false);

  // çöküş işareti
  if (mine.collapseYear !== null && mine.year.length) {
    const x = px(mine.year[mine.year.length - 1]);
    const y = py(mine.satisfaction[mine.satisfaction.length - 1]);
    c.strokeStyle = "#d82800";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 6, y - 6);
    c.lineTo(x + 6, y + 6);
    c.moveTo(x + 6, y - 6);
    c.lineTo(x - 6, y + 6);
    c.stroke();
    c.font = '7px "Press Start 2P", monospace';
    c.fillStyle = "#d82800";
    const label = TEXTS.irreversibilis;
    const tw = c.measureText(label).width;
    c.fillText(label, Math.min(W - tw - 4, Math.max(2, x - tw / 2)), Math.max(14, y - 12));
  }
}
