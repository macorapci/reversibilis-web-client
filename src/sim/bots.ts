import { BALANCE, type UpgradeId } from "../config/balance";
import type { Sim } from "./sim";

const B = BALANCE;
const ALL: UpgradeId[] = [
  "hastane",
  "ekipman",
  "destek",
  "bilinclendirme",
  "malzeme",
  "yapayZeka",
];

export interface Bot {
  name: string;
  /** her ay, adım atılmadan önce çağrılır */
  step(s: Sim): void;
}

/** Her zaman en ucuz yükseltmeyi alır; triyaj "Sırayla"; koruyucu kapalı. */
export const botGreedy: Bot = {
  name: "Açgözlü",
  step(s) {
    let best: UpgradeId | null = null;
    let bestCost = Infinity;
    for (const id of ALL) {
      if (!s.upgradeUnlocked(id)) continue;
      const c = s.upgradeCost(id);
      if (c < bestCost) {
        bestCost = c;
        best = id;
      }
    }
    if (best && s.canBuy(best)) s.buyUpgrade(best, false);
  },
};

/** Hıza yüklenir; hastaneyi yalnızca koltuk yetmeyince alır. */
export const botFast: Bot = {
  name: "Hızcı",
  step(s) {
    s.setTriage("light", false);
    if (s.seatCount < s.dentistCount && s.canBuy("hastane")) {
      s.buyUpgrade("hastane", false);
      return;
    }
    // yalnızca hıza yüklenir: bilinçlendirme ve yerli malzemeye bakmaz
    for (const id of ["destek", "ekipman", "yapayZeka"] as UpgradeId[]) {
      if (s.canBuy(id)) {
        s.buyUpgrade(id, false);
        return;
      }
    }
  },
};

/**
 * Koltuk ihtiyacını takip eder, 1980'den itibaren koruyucu %20,
 * bekleme 3 ayı geçince ağır vakaya döner, kısa randevuyu son çare olarak kullanır.
 */
/**
 * Koltuğu hekime göre açar (fazlası işletme gideri), bilinçlendirmeyi erken
 * alır, koruyucu programı yalnızca sistemde boşluk varken açar ve kriz
 * geldiğinde kapatır.
 */
export const botSmart: Bot = {
  name: "Akıllı",
  step(s) {
    const load = s.queueTotal / Math.max(1, s.queueLimit);

    // koruyucu: rahatken aç, kriz gelince tüm kapasiteyi tedaviye ver
    if (s.year >= 1960) {
      const want = load < 0.25 ? 0.2 : load > 0.5 ? 0 : s.preventive;
      s.setPreventive(Math.min(want, s.maxPreventive), false);
    }
    // hafif vaka önce: evre 4'ü evre 5'ten önce tedavi eder, diş kurtarır
    s.setTriage(load > 0.75 ? "severe" : "light", false);

    if (s.seatCount < s.dentistCount && s.canBuy("hastane")) {
      s.buyUpgrade("hastane", false);
      return;
    }
    if (s.canBuy("bilinclendirme") && s.upgrades.bilinclendirme < 5) {
      s.buyUpgrade("bilinclendirme", false);
      return;
    }
    if (s.materialMult > 1.5 && s.canBuy("malzeme")) {
      s.buyUpgrade("malzeme", false);
      return;
    }
    for (const id of ["destek", "ekipman", "yapayZeka"] as UpgradeId[]) {
      if (s.canBuy(id)) {
        s.buyUpgrade(id, false);
        return;
      }
    }
  },
};

export const ALL_BOTS: Bot[] = [botGreedy, botFast, botSmart];

export interface RunResult {
  collapseYear: number;
  lostTeeth: number;
  savedTeeth: number;
  treated: number;
  rescueRate: number;
  score: number;
  maxWaitWeeks: number;
  freeSeats: number;
  /** aynı kararlarla +10 bin atama yapılsaydı */
  ghostCollapseYear: number | null;
}

/** Tek bir botu baştan sona oynatır; ardından "+10 bin atama" sürümünü koşar. */
export function playBot(
  bot: Bot,
  seed: number,
  SimCtor: typeof Sim,
  withGhost = true
): RunResult {
  const s = new SimCtor({ seed, notices: false });
  s.runUntilCollapse(B.SIM_HORIZON_YEAR, (sim) => bot.step(sim));

  let ghostCollapseYear: number | null = null;
  if (withGhost) {
    const g = new SimCtor({
      seed,
      notices: false,
      ghost: {
        year: B.GHOST_YEAR,
        extraDentists: B.GHOST_EXTRA_DENTISTS,
        extraSeats: B.GHOST_EXTRA_SEATS,
      },
    });
    g.runUntilCollapse(B.SIM_HORIZON_YEAR, (sim) => bot.step(sim));
    ghostCollapseYear = g.collapseYear;
  }

  const snap = s.snapshot();
  return {
    collapseYear: s.collapseYear ?? B.SIM_HORIZON_YEAR,
    lostTeeth: s.stats.lostTeeth,
    savedTeeth: s.stats.savedTeeth,
    treated: s.stats.treated,
    rescueRate: s.rescueRate,
    score: s.score,
    maxWaitWeeks: (s.stats.maxAvgWaitMonths * 52) / 12,
    freeSeats: snap.freeSeats,
    ghostCollapseYear,
  };
}
