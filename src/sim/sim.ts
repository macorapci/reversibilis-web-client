import { BALANCE, type UpgradeId } from "../config/balance";
import {
  EQUIPMENT_GENERIC_YEAR,
  EQUIPMENT_LEVELS,
  HISTORY_EVENTS,
  TEXTS,
  t,
} from "../config/texts";
import { mulberry32 } from "./rng";
import { dentists, population, yearlyDemandSessions } from "./model";
import type {
  CollapseReason,
  Decision,
  Notice,
  SimStats,
  Snapshot,
  Trace,
  TriageMode,
} from "./types";

const B = BALANCE;
const STAGES = 5;

export interface SimOptions {
  seed?: number;
  /** Sonuç ekranındaki "atama yapılsaydı" yeniden oynatması için. */
  ghost?: { year: number; extraDentists: number; extraSeats: number };
  /** Tarihsel bildirimler ve yorumlar üretilsin mi (bot koşularında gereksiz). */
  notices?: boolean;
}

/**
 * Oyunun tamamı. Arayüze hiç bağlı değildir ve aylık adımlarla ilerler.
 * Aynı modül üç yerde kullanılır: oyun, `npm run sim` botları ve sonuç
 * ekranındaki yeniden oynatma.
 */
export class Sim {
  readonly rng: () => number;
  /** Yeniden oynatmanın aynı rastgeleliği kullanabilmesi için saklanır. */
  readonly seed: number;
  private readonly opts: SimOptions;

  /** START_YEAR Ocak'tan beri geçen ay sayısı. */
  month = 0;

  budget = B.BUDGET_START;
  hospitals = B.HOSPITALS_START;
  satisfaction = 100;
  avgWaitMonths = 0;
  materialPriceMult = 1;
  materialShort = false;

  upgrades: Record<UpgradeId, number> = {
    hastane: 0,
    ekipman: 0,
    destek: 0,
    bilinclendirme: 0,
    malzeme: 0,
    yapayZeka: 0,
  };

  /**
   * Bakanlığın dayattığı kısa randevu seviyesi. Oyuncu bunu seçmez:
   * kuyruk şişince yükselir, rahatlayınca yavaşça düşer.
   */
  shortLevel = 0;
  private shortPressureMonths = 0;
  private shortCalmMonths = 0;
  /** ödenek kesilen yıl sayısı ve son ödenek */
  lastGrant = 0;
  grantCutThisYear = false;
  /** son ayın hastane işletme gideri */
  lastUpkeep = 0;
  triage: TriageMode = "order";
  preventive = 0;

  /** Evre kovaları: kaç hasta hangi evrede bekliyor. */
  queue: number[] = new Array(STAGES).fill(0);

  collapsed = false;
  collapseYear: number | null = null;
  collapseReason: CollapseReason | null = null;

  decisions: Decision[] = [];
  notices: Notice[] = [];
  trace: Trace = { year: [], satisfaction: [], collapseYear: null };

  stats: SimStats = {
    arrived: 0,
    treated: 0,
    treatedLate: 0,
    savedTeeth: 0,
    lostTeeth: 0,
    importSpend: 0,
    maxAvgWaitMonths: 0,
    complications: 0,
    monthsPreventiveOn: 0,
    months: 0,
    worsened: 0,
    maxShortLevel: 0,
    budgetCutYears: 0,
  };

  private extraDentists = 0;
  private extraSeats = 0;
  private preventiveHistory: number[] = [];
  private pendingComplications: { month: number; stage: number; count: number }[] = [];
  private lostWindow: number[] = [];
  private treatedWindow: number[] = [];
  private arrivalsWindow: number[] = [];
  private worsenedWindow: number[] = [];
  private returnedWindow: number[] = [];
  private firedHistory = new Set<string>();
  private lastCapacity = 1;
  /** Son ayın malzeme gideri — botların rezerv hesabı ve arayüz için. */
  lastMaterialSpend = 0;

  constructor(opts: SimOptions = {}) {
    this.opts = opts;
    this.seed = opts.seed ?? ((Math.random() * 2 ** 32) >>> 0);
    this.rng = mulberry32(this.seed);
  }

  // ------------------------------------------------------------- türetilmiş

  get year(): number {
    return B.START_YEAR + Math.floor(this.month / 12);
  }

  get monthOfYear(): number {
    return (this.month % 12) + 1;
  }

  /** Kesirli yıl — nüfus ve talep eğrileri için. */
  get yearFloat(): number {
    return B.START_YEAR + this.month / 12;
  }

  get dentistCount(): number {
    return dentists(this.yearFloat) + this.extraDentists;
  }

  get seatCount(): number {
    return this.hospitals * B.SEATS_PER_HOSPITAL + this.extraSeats;
  }

  get queueLimit(): number {
    return this.hospitals * B.QUEUE_PER_HOSPITAL;
  }

  get queueTotal(): number {
    let n = 0;
    for (const q of this.queue) n += q;
    return n;
  }

  /** Kuyruktaki toplam seans ihtiyacı. */
  get queueSessions(): number {
    let n = 0;
    for (let i = 0; i < STAGES; i++) n += this.queue[i] * B.STAGE_SESSIONS[i];
    return n;
  }

  get speedMult(): number {
    const u = B.UPGRADES;
    return (
      Math.pow(u.ekipman.speedMult, this.upgrades.ekipman) *
      Math.pow(u.destek.speedMult, this.upgrades.destek) *
      Math.pow(u.yapayZeka.speedMult, this.upgrades.yapayZeka) *
      Math.pow(B.SHORT_FORCED.speedMult, this.shortLevel)
    );
  }

  get progressMult(): number {
    return Math.pow(B.UPGRADES.yapayZeka.progressMult, this.upgrades.yapayZeka);
  }

  get complicationRate(): number {
    const f = B.SHORT_FORCED;
    return Math.min(f.complicationMax, f.complicationAdd * this.shortLevel);
  }

  /** Yerli malzeme üretimi ithal faturayı düşürür. */
  get materialMult(): number {
    return (
      this.materialPriceMult * Math.pow(B.UPGRADES.malzeme.materialMult, this.upgrades.malzeme)
    );
  }

  /** Koruyucu programın 5 yıllık hareketli ortalaması — etkisi gecikmelidir. */
  get preventiveAverage(): number {
    if (this.preventiveHistory.length === 0) return 0;
    let s = 0;
    for (const v of this.preventiveHistory) s += v;
    return s / this.preventiveHistory.length;
  }

  /** Geliş karışımı: koruyucu program oranında erken evrelere kayar. */
  /** Bilinçlendirme kampanyalarının karışımı erkene kaydırma gücü (0..1). */
  get awarenessShift(): number {
    return 1 - Math.pow(1 - B.UPGRADES.bilinclendirme.mixShift, this.upgrades.bilinclendirme);
  }

  arrivalMix(): number[] {
    const maxOpt = B.PREVENTIVE_OPTIONS[B.PREVENTIVE_OPTIONS.length - 1];
    const kPrev = maxOpt > 0 ? Math.min(1, this.preventiveAverage / maxOpt) : 0;
    // iki politika birbirini tamamlar, toplamı 1'i geçmez
    const k = 1 - (1 - kPrev) * (1 - this.awarenessShift);
    const out: number[] = [];
    for (let i = 0; i < STAGES; i++) {
      out.push(
        B.ARRIVAL_MIX_BASE[i] + (B.ARRIVAL_MIX_PREVENTIVE[i] - B.ARRIVAL_MIX_BASE[i]) * k
      );
    }
    return out;
  }

  get monthlyCapacity(): number {
    const workers = Math.min(this.dentistCount, this.seatCount);
    return (
      (workers * B.SESSIONS_PER_DENTIST_YEAR) / 12 *
      B.BASE_SPEED *
      this.speedMult *
      (1 - this.preventive) *
      this.eventCapacityMult()
    );
  }

  /**
   * Koruyucu programın talebi düşürme oranı (0..1).
   * Erken yakalanan çürük tedaviye hiç gelmez: hasta tekrar gelmez.
   * 5 yıllık hareketli ortalamaya bağlıdır, yani etkisi gecikmelidir.
   */
  get demandCut(): number {
    const maxOpt = B.PREVENTIVE_OPTIONS[B.PREVENTIVE_OPTIONS.length - 1];
    if (maxOpt <= 0) return 0;
    return B.PREVENTIVE_DEMAND_CUT * Math.min(1, this.preventiveAverage / maxOpt);
  }

  get monthlyDemandSessions(): number {
    return (yearlyDemandSessions(this.yearFloat) / 12) * (1 - this.demandCut);
  }

  private eventCapacityMult(): number {
    const p = B.PANDEMIC;
    const [sy, sm] = p.start.split("-").map(Number);
    const [ey, em] = p.end.split("-").map(Number);
    const cur = this.year * 12 + this.monthOfYear;
    if (cur >= sy * 12 + sm && cur <= ey * 12 + em) return p.capacityMult;
    return 1;
  }

  // ---------------------------------------------------------------- eylemler

  upgradeCost(id: UpgradeId): number {
    return B.UPGRADES[id].base * Math.pow(B.COST_MULT, this.upgrades[id]);
  }


  /**
   * Bir sonraki seviyenin açılış yılı. Ekipmanda her seviyenin kendi yılı
   * vardır (panoramik röntgen 1975'ten önce alınamaz).
   */
  nextLevelUnlockYear(id: UpgradeId): number {
    if (id === "ekipman") {
      return EQUIPMENT_LEVELS[this.upgrades.ekipman]?.year ?? EQUIPMENT_GENERIC_YEAR;
    }
    return B.UPGRADES[id].unlock;
  }

  /** Yılı gelmemiş yükseltme alınamaz. */
  upgradeUnlocked(id: UpgradeId): boolean {
    return this.year >= this.nextLevelUnlockYear(id);
  }

  canBuy(id: UpgradeId): boolean {
    return (
      !this.collapsed && this.upgradeUnlocked(id) && this.budget >= this.upgradeCost(id)
    );
  }

  buyUpgrade(id: UpgradeId, record = true): boolean {
    if (!this.canBuy(id)) return false;
    this.budget -= this.upgradeCost(id);
    this.upgrades[id]++;
    if (id === "hastane") this.hospitals *= B.UPGRADES.hastane.hospitalMult;
    if (record) this.decisions.push({ month: this.month, kind: "upgrade", id });
    return true;
  }

  setTriage(value: TriageMode, record = true) {
    if (this.triage === value) return;
    this.triage = value;
    if (record) this.decisions.push({ month: this.month, kind: "triage", value });
  }

  /**
   * Seçilebilen en yüksek koruyucu oranı. Her kısa randevu seviyesi bunu bir
   * kademe düşürür: hekim zamanı hasta döndürmeye gidince taramaya kalmaz.
   */
  get maxPreventive(): number {
    const opts = B.PREVENTIVE_OPTIONS;
    const idx = Math.max(0, opts.length - 1 - this.shortLevel);
    return opts[idx];
  }

  setPreventive(value: number, record = true) {
    value = Math.min(value, this.maxPreventive);
    if (this.preventive === value) return;
    this.preventive = value;
    if (record) this.decisions.push({ month: this.month, kind: "preventive", value });
  }

  /** Erken oyunun dokunuşu: küçük bir ek tedavi ve bütçe. */
  tap(): number {
    if (this.collapsed) return 0;
    // Dokunuş gelir getirmez: kamu hizmeti hastadan para kazanmaz.
    return this.treat(B.TAP_SESSIONS).treated;
  }

  // ------------------------------------------------------------- aylık adım

  step() {
    if (this.collapsed) return;

    // 1 — takvim olayları
    if (this.opts.ghost && this.year === this.opts.ghost.year && this.monthOfYear === 1) {
      this.extraDentists = this.opts.ghost.extraDentists;
      this.extraSeats = this.opts.ghost.extraSeats;
    }
    this.fireHistory();
    this.grantBudget();
    this.maybeMaterialEvent();
    this.maybeSchoolScreening();
    this.updateForcedShort();

    // 2 — koruyucu program geçmişi (5 yıllık pencere)
    this.preventiveHistory.push(this.preventive);
    const lag = B.PREVENTIVE_LAG_YEARS * 12;
    if (this.preventiveHistory.length > lag) this.preventiveHistory.shift();
    if (this.preventive > 0) this.stats.monthsPreventiveOn++;

    // 3 — gelen hastalar ve komplikasyonla dönenler
    const mix = this.arrivalMix();
    let avgSessions = 0;
    for (let i = 0; i < STAGES; i++) avgSessions += mix[i] * B.STAGE_SESSIONS[i];
    const arrivals = this.monthlyDemandSessions / avgSessions;
    for (let i = 0; i < STAGES; i++) this.queue[i] += arrivals * mix[i];
    this.stats.arrived += arrivals;

    this.pendingComplications = this.pendingComplications.filter((c) => {
      if (c.month <= this.month) {
        this.queue[c.stage] += c.count;
        return false;
      }
      return true;
    });

    // 4 — kapasite ve tedavi
    const capacity = this.monthlyCapacity;
    this.lastCapacity = Math.max(1, capacity);
    this.materialShort = false;
    this.lastMaterialSpend = 0;
    this.monthReturned = 0;
    const done = this.treat(capacity);

    // 5 — bekleyenlerde evre ilerlemesi (yukarıdan aşağı: aynı ay zincirlenmesin)
    const rate = Math.min(1, (1 / B.STAGE_PROGRESS_MONTHS) * this.progressMult);
    this.monthLost = 0;
    let monthWorsened = 0;
    for (let i = STAGES - 2; i >= 0; i--) {
      const move = this.queue[i] * rate;
      this.queue[i] -= move;
      this.queue[i + 1] += move;
      monthWorsened += move;
      if (i === STAGES - 2) {
        // evre 4 → 5: bekleme yüzünden kaybedilen diş
        this.stats.lostTeeth += move;
        this.monthLost = move;
      }
    }

    // 6 — işletme gideri: her hastane her ay para yer
    this.lastUpkeep =
      (this.hospitals *
        B.HOSPITAL_UPKEEP *
        Math.pow(1 + B.GRANT_GROWTH, this.year - B.START_YEAR)) /
      12;
    this.budget = Math.max(0, this.budget - this.lastUpkeep);

    // memnuniyet ve bekleme (gelir hastadan değil, yıllık ödenekten gelir)

    this.avgWaitMonths = this.queueSessions / this.lastCapacity;
    this.stats.maxAvgWaitMonths = Math.max(this.stats.maxAvgWaitMonths, this.avgWaitMonths);

    this.stats.worsened += monthWorsened;
    this.lostWindow.push(this.monthLost);
    this.treatedWindow.push(done.treated);
    this.arrivalsWindow.push(arrivals);
    this.worsenedWindow.push(monthWorsened);
    this.returnedWindow.push(this.monthReturned);
    for (const w of [
      this.lostWindow,
      this.treatedWindow,
      this.arrivalsWindow,
      this.worsenedWindow,
      this.returnedWindow,
    ]) {
      if (w.length > 12) w.shift();
    }
    const lost12 = this.lostWindow.reduce((a, b) => a + b, 0);
    const treated12 = this.treatedWindow.reduce((a, b) => a + b, 0);

    const target = Math.max(
      0,
      Math.min(
        100,
        100 -
          B.WAIT_PENALTY * this.avgWaitMonths -
          B.LOSS_PENALTY * (lost12 / Math.max(1, treated12)) -
          B.SHORT_PENALTY * this.shortLevel
      )
    );
    this.satisfaction += (target - this.satisfaction) * B.SATISFACTION_LERP;

    this.stats.months++;
    this.trace.year.push(this.yearFloat);
    this.trace.satisfaction.push(this.satisfaction);

    // 7 — çöküş
    // Çöküş iki yoldan gelir: kuyruk taşar ya da kaybedilen diş sınırı aşılır.
    const reason: CollapseReason | null =
      this.queueTotal > this.queueLimit
        ? "kuyruk"
        : this.stats.lostTeeth > B.LOST_TEETH_LIMIT
          ? "dis"
          : null;
    if (reason) {
      this.collapsed = true;
      this.collapseReason = reason;
      this.collapseYear = this.year;
      this.trace.collapseYear = this.year;
    }

    // 8 — takvimi ilerlet
    this.month++;
  }

  /** Bu ay bekleme yüzünden kaybedilen diş (pencere hesabı için). */
  private monthLost = 0;

  /**
   * Verilen seans kapasitesini triyaj sırasına göre kuyruğa uygular.
   * Evre 5 ayrıca ithal malzeme parası ister; bütçe yetmezse beklemeye devam eder.
   */
  private treat(capacity: number): { treated: number; completedSessions: number } {
    let monthReturned = 0;
    let remaining = capacity;
    let treated = 0;
    let completedSessions = 0;
    const compRate = this.complicationRate;

    const takeFrom = (stage: number, limit: number) => {
      if (remaining <= 0 || this.queue[stage] <= 0) return;
      const sess = B.STAGE_SESSIONS[stage];
      let n = Math.min(this.queue[stage], limit, remaining / sess);

      const matPer =
        B.STAGE_MATERIAL_REL[stage] * B.MATERIAL_UNIT * this.materialMult;

      // Yalnızca evre 5 bütçeye takılır: ithal malzeme alınamazsa hasta bekler.
      if (stage === STAGES - 1 && matPer > 0) {
        const affordable = this.budget / matPer;
        if (n > affordable) {
          n = Math.max(0, affordable);
          this.materialShort = true;
        }
      }
      if (n <= 0) return;

      this.queue[stage] -= n;
      remaining -= n * sess;
      this.budget = Math.max(0, this.budget - n * matPer);
      this.lastMaterialSpend += n * matPer;
      if (stage === STAGES - 1) this.stats.importSpend += n * matPer;

      const failed = compRate > 0 ? n * compRate : 0;
      const ok = n - failed;
      treated += ok;
      completedSessions += ok * sess;
      this.stats.treated += ok;
      if (stage === STAGES - 1) this.stats.treatedLate += ok;
      else this.stats.savedTeeth += ok;

      if (failed > 0) {
        this.stats.complications += failed;
        monthReturned += failed;
        this.pendingComplications.push({
          month: this.month + B.KOMPLIKASYON_DONUS_AY,
          stage: Math.min(STAGES - 1, stage + 1),
          count: failed,
        });
      }
    };

    if (this.triage === "order") {
      // kovalara büyüklükleriyle orantılı
      const need = this.queueSessions;
      const share = need > 0 ? Math.min(1, capacity / need) : 0;
      for (let i = 0; i < STAGES; i++) takeFrom(i, this.queue[i] * share);
    } else {
      const order = this.triage === "severe" ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
      for (const i of order) takeFrom(i, Infinity);
    }

    this.monthReturned += monthReturned;
    return { treated, completedSessions };
  }

  /** Bu ay komplikasyon yüzünden geri dönecek hasta (pencere hesabı için). */
  private monthReturned = 0;

  // ---------------------------------------------------------------- olaylar

  private notify(kind: Notice["kind"], text: string) {
    if (this.opts.notices === false) return;
    this.notices.push({ kind, text });
  }

  drainNotices(): Notice[] {
    const n = this.notices;
    this.notices = [];
    return n;
  }

  private fireHistory() {
    for (const e of HISTORY_EVENTS) {
      const key = `${e.year}-${e.month ?? 1}`;
      if (this.firedHistory.has(key)) continue;
      if (this.year === e.year && this.monthOfYear === (e.month ?? 1)) {
        this.firedHistory.add(key);
        this.notify("history", e.text);
      }
    }
  }

  /**
   * Yıllık devlet ödeneği. Hizmet hastadan para kazanmaz; her Ocak'ta
   * nüfusa bağlı bir ödenek gelir ve bazı yıllar kısılır.
   */
  private grantBudget() {
    if (this.monthOfYear !== 1) return;
    const base =
      population(this.yearFloat) *
      B.GRANT_PER_CAPITA *
      Math.pow(1 + B.GRANT_GROWTH, this.year - B.START_YEAR);
    // siyasi destek: memnuniyet düşükse ödenek de düşer
    const w = B.GRANT_SATISFACTION_WEIGHT;
    const support = 1 - w + (w * this.satisfaction) / 100;
    const cut =
      this.year >= B.BUDGET_CUT_FROM_YEAR && this.rng() < B.BUDGET_CUT_CHANCE;
    this.grantCutThisYear = cut;
    this.lastGrant = base * support * (cut ? B.BUDGET_CUT_MULT : 1);
    this.budget += this.lastGrant;
    if (cut) {
      this.stats.budgetCutYears++;
      this.notify("event", TEXTS.notifBudgetCut);
    }
  }

  /**
   * Kısa randevu dayatması. Kuyruk limitin belli bir oranını aşıp orada
   * kalırsa Bakanlık randevu sürelerini kısaltır; kuyruk uzun süre rahatsa
   * baskı gevşer. Oyuncunun bu kaldıraca erişimi yoktur.
   */
  private updateForcedShort() {
    const f = B.SHORT_FORCED;
    const ratio = this.queueTotal / Math.max(1, this.queueLimit);
    if (ratio > f.queueRatio) {
      this.shortCalmMonths = 0;
      this.shortPressureMonths++;
      if (this.shortPressureMonths >= f.monthsToRaise && this.shortLevel < f.maxLevel) {
        this.shortPressureMonths = 0;
        this.shortLevel++;
        this.stats.maxShortLevel = Math.max(this.stats.maxShortLevel, this.shortLevel);
        this.notify("event", t(TEXTS.notifShortForced, { n: this.shortLevel }));
        if (this.preventive > this.maxPreventive) {
          this.preventive = this.maxPreventive;
          this.notify("event", TEXTS.notifPreventiveCut);
        }
      }
    } else {
      this.shortPressureMonths = 0;
      this.shortCalmMonths++;
      if (this.shortCalmMonths >= f.monthsToDrop && this.shortLevel > 0) {
        this.shortCalmMonths = 0;
        this.shortLevel--;
        this.notify("event", t(TEXTS.notifShortEased, { n: this.shortLevel }));
      }
    }
  }

  private maybeMaterialEvent() {
    if (this.year < B.MATERIAL_EVENT_FROM_YEAR) return;
    const monthly = 1 / (B.MATERIAL_EVENT_AVG_YEARS * 12);
    if (this.rng() < monthly) {
      this.materialPriceMult *= B.MATERIAL_PRICE_EVENT_MULT;
      this.notify("event", "Malzeme fiyatları arttı.");
    }
  }

  private maybeSchoolScreening() {
    if (this.preventive <= 0 || this.monthOfYear !== 9) return;
    if (this.rng() >= B.SCHOOL_SCREEN_CHANCE) return;
    const share = B.SCHOOL_SCREEN_SHARE;
    const n = (this.queue[0] + this.queue[1]) * share;
    this.queue[0] *= 1 - share;
    this.queue[1] *= 1 - share;
    this.stats.treated += n;
    this.stats.savedTeeth += n;
    this.notify("event", "Okul tarama haftası: erken evredeki hastalar tedavi edildi.");
  }

  // ---------------------------------------------------------------- çıktılar

  snapshot(): Snapshot {
    const dentistCount = this.dentistCount;
    const seats = this.seatCount;
    return {
      month: this.month,
      year: this.year,
      monthOfYear: this.monthOfYear,
      population: population(this.yearFloat),
      dentists: dentistCount,
      hospitals: this.hospitals,
      seats,
      queue: [...this.queue],
      queueTotal: this.queueTotal,
      queueLimit: this.queueLimit,
      budget: this.budget,
      satisfaction: this.satisfaction,
      avgWaitMonths: this.avgWaitMonths,
      monthlyCapacity: this.monthlyCapacity,
      monthlyDemandSessions: this.monthlyDemandSessions,
      freeSeats: Math.max(0, seats - dentistCount),
      waitingDentists: Math.max(0, dentistCount - seats),
      materialShort: this.materialShort,
      arrivalsPerYear: this.arrivalsPerYear,
      treatedPerYear: this.treatedPerYear,
      deferredPerYear: this.deferredPerYear,
      worsenedPerYear: this.worsenedPerYear,
      earlyArrivalShare: this.earlyArrivalShare,
      demandCut: this.demandCut,
      upgrades: { ...this.upgrades },
      triage: this.triage,
      preventive: this.preventive,
      collapsed: this.collapsed,
      collapseYear: this.collapseYear,
      collapseReason: this.collapseReason,
      lostTeeth: this.stats.lostTeeth,
      lostTeethLimit: B.LOST_TEETH_LIMIT,
      returnedPerYear: this.returnedPerYear,
      maxPreventive: this.maxPreventive,
      shortLevel: this.shortLevel,
      complicationRate: this.complicationRate,
      lastGrant: this.lastGrant,
      upkeepPerYear: this.lastUpkeep * 12,
      grantCut: this.grantCutThisYear,
      awarenessShift: this.awarenessShift,
    };
  }

  private sum(w: number[]): number {
    let n = 0;
    for (const v of w) n += v;
    return n;
  }

  /** Son 12 ayda gelen hasta. */
  get arrivalsPerYear(): number {
    return this.sum(this.arrivalsWindow);
  }

  /** Son 12 ayda tedavisi tamamlanan hasta. */
  get treatedPerYear(): number {
    return this.sum(this.treatedWindow);
  }

  /** Son 12 ayda sırası gelmeyip ertelenen hasta. */
  get deferredPerYear(): number {
    return Math.max(0, this.arrivalsPerYear - this.treatedPerYear);
  }

  /** Son 12 ayda komplikasyon yüzünden geri dönen hasta. */
  get returnedPerYear(): number {
    return this.sum(this.returnedWindow);
  }

  /** Son 12 ayda beklerken evre atlayan hasta. */
  get worsenedPerYear(): number {
    return this.sum(this.worsenedWindow);
  }

  /** Yeni gelenlerin erken evrede (1-2) olma oranı. */
  get earlyArrivalShare(): number {
    const mix = this.arrivalMix();
    return mix[0] + mix[1];
  }

  /** Tedavi edilenler içinde evre 5'e gitmeden kurtarılanların oranı. */
  get rescueRate(): number {
    const total = this.stats.treated;
    return total > 0 ? this.stats.savedTeeth / total : 1;
  }

  get score(): number {
    const year = this.collapseYear ?? this.year;
    return (year - B.START_YEAR) * 1000 + Math.round(this.rescueRate * 1000);
  }

  /** Çöküşe ya da ufka kadar oynat (bot ve yeniden oynatma için). */
  runUntilCollapse(horizonYear = B.SIM_HORIZON_YEAR, onMonth?: (s: Sim) => void) {
    while (!this.collapsed && this.year < horizonYear) {
      onMonth?.(this);
      this.step();
      if (this.opts.notices === false) this.notices.length = 0;
    }
  }

  /** Bilgi amaçlı: çöküş metni. */
  collapseText(): string {
    return t(TEXTS.collapseLine, { year: this.collapseYear ?? this.year });
  }
}
