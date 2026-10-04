const KEY = "reversibilis.best";

/** localStorage erişilemezse (gizli sekme, kapalı çerez) sessizce atlar. */
export function readBestScore(): number {
  try {
    const v = localStorage.getItem(KEY);
    const n = v === null ? 0 : Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(score: number): number {
  const best = Math.max(score, readBestScore());
  try {
    localStorage.setItem(KEY, String(best));
  } catch {
    /* sessizce atla */
  }
  return best;
}
