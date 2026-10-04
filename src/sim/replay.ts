import { BALANCE } from "../config/balance";
import { Sim } from "./sim";
import type { Decision } from "./types";

const B = BALANCE;

/**
 * Oyuncunun karar kaydını aynı tohumla yeniden oynatır.
 * Tek fark: `ghost` verilirse 2026 Ocak'ta +10 bin hekim ve +10 bin koltuk eklenir.
 *
 * Kayıt bittikten sonra simülasyon son ayarlarla devam eder ve yeni
 * yükseltme almaz — temkinli varsayım.
 */
export function replay(
  seed: number,
  decisions: Decision[],
  opts: { ghost?: boolean; horizonYear?: number } = {}
): Sim {
  const sim = new Sim({
    seed,
    notices: false,
    ghost: opts.ghost
      ? {
          year: B.GHOST_YEAR,
          extraDentists: B.GHOST_EXTRA_DENTISTS,
          extraSeats: B.GHOST_EXTRA_SEATS,
        }
      : undefined,
  });

  const byMonth = new Map<number, Decision[]>();
  for (const d of decisions) {
    const list = byMonth.get(d.month) ?? [];
    list.push(d);
    byMonth.set(d.month, list);
  }

  const horizon = opts.horizonYear ?? B.SIM_HORIZON_YEAR;
  while (!sim.collapsed && sim.year < horizon) {
    for (const d of byMonth.get(sim.month) ?? []) {
      if (d.kind === "upgrade") sim.buyUpgrade(d.id, false);
      else if (d.kind === "triage") sim.setTriage(d.value, false);
      else sim.setPreventive(d.value, false);
    }
    sim.step();
  }
  return sim;
}
