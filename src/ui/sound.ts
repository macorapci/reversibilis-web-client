/**
 * Dosyasız ses katmanı (WebAudio osilatörü). Varsayılan kapalı,
 * tercih localStorage'da saklanır.
 */
const KEY = "reversibilis.sound";
let on = false;
let ctx: AudioContext | null = null;

try {
  on = localStorage.getItem(KEY) === "1";
} catch {
  /* sessizce atla */
}

export function isSoundOn(): boolean {
  return on;
}

export function setSoundOn(v: boolean) {
  on = v;
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* sessizce atla */
  }
}

type Cue = "tap" | "buy" | "bad" | "collapse";

const CUES: Record<Cue, { from: number; to: number; dur: number; type: OscillatorType; gain: number }> = {
  tap: { from: 620, to: 760, dur: 0.05, type: "square", gain: 0.03 },
  buy: { from: 520, to: 980, dur: 0.12, type: "square", gain: 0.05 },
  bad: { from: 240, to: 120, dur: 0.2, type: "sawtooth", gain: 0.05 },
  collapse: { from: 180, to: 46, dur: 1.2, type: "sawtooth", gain: 0.1 },
};

export function play(cue: Cue) {
  if (!on) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const c = CUES[cue];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = c.type;
    osc.frequency.setValueAtTime(c.from, now);
    osc.frequency.exponentialRampToValueAtTime(c.to, now + c.dur);
    gain.gain.setValueAtTime(c.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + c.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + c.dur + 0.02);
  } catch {
    /* ses opsiyonel */
  }
}
