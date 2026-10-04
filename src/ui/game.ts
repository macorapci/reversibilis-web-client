import { BALANCE, type UpgradeId } from "../config/balance";
import {
  AI_GENERIC,
  AI_LEVELS,
  EQUIPMENT_GENERIC,
  EQUIPMENT_LEVELS,
  PATIENT_COMMENTS,
  TEXTS,
  t,
} from "../config/texts";
import { Sim } from "../sim/sim";
import { secondsPerYear } from "../sim/model";
import type { TriageMode } from "../sim/types";
import { big, decimal, num, pct, weeks } from "./format";
import { el } from "./dom";
import { Notices } from "./notices";
import { STAGE_COLORS, drawQueue } from "./queueCanvas";
import { play } from "./sound";
import { STAGE_NAMES } from "../config/texts";

const B = BALANCE;
const UPGRADE_IDS: UpgradeId[] = [
  "hastane",
  "destek",
  "ekipman",
  "bilinclendirme",
  "malzeme",
  "yapayZeka",
];
const UPGRADE_NAMES: Record<UpgradeId, string> = {
  hastane: TEXTS.upgHospital,
  ekipman: TEXTS.upgEquipment,
  destek: TEXTS.upgSupport,
  bilinclendirme: TEXTS.upgAwareness,
  malzeme: TEXTS.upgMaterial,
  yapayZeka: TEXTS.upgAI,
};

interface UpgradeRow {
  card: HTMLElement;
  level: HTMLElement;
  next: HTMLElement;
  effect: HTMLElement;
  button: HTMLButtonElement;
}

/** Oyun ekranı: üst bar, kuyruk, kapasite, yorumlar, ayarlar, yükseltmeler. */
export class GameScreen {
  readonly sim: Sim;
  readonly root: HTMLElement;
  private notices: Notices;
  private raf = 0;
  private lastTs = 0;
  private acc = 0;
  /** oyuncunun seçtiği hız (×1 / ×2) ve debug çarpanı */
  speed = 1;
  debugSpeed = 1;
  private paused = false;
  private commentTimer = 0;
  /** yeniden kurulmak yerine metni güncellenen hücreler */
  private capCells: [HTMLElement, HTMLElement][] = [];
  private flowCells: [HTMLElement, HTMLElement][] = [];
  private lastQueueKey = "";
  private onCollapse: () => void;

  private ui!: {
    year: HTMLElement;
    forecast: HTMLElement;
    population: HTMLElement;
    budget: HTMLElement;
    mood: HTMLElement;
    satisfaction: HTMLElement;
    canvas: HTMLCanvasElement;
    gQueueVal: HTMLElement;
    gQueueLim: HTMLElement;
    gQueueBar: HTMLElement;
    gLostVal: HTMLElement;
    gLostLim: HTMLElement;
    gLostBar: HTMLElement;
    wait: HTMLElement;
    stageSegs: HTMLElement[];
    stageCountEls: HTMLElement[];
    material: HTMLElement;
    capacity: HTMLElement;
    comment: HTMLElement;
    flow: HTMLElement;
    prevEffect: HTMLElement;
    prevCap: HTMLElement;
    forcedShort: HTMLElement;
    grantLine: HTMLElement;
    triage: HTMLButtonElement[];
    preventive: HTMLButtonElement[];
    upgrades: Record<string, UpgradeRow>;
    speedBtn: HTMLButtonElement;
  };

  constructor(parent: HTMLElement, seed: number, onCollapse: () => void) {
    this.sim = new Sim({ seed });
    this.onCollapse = onCollapse;
    this.root = el("div", { class: "screen" });
    parent.append(this.root);
    this.notices = new Notices(document.body);
    this.build();
    this.render();

    document.addEventListener("visibilitychange", this.onVisibility);
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private onVisibility = () => {
    this.paused = document.hidden;
    this.lastTs = performance.now();
  };

  // ---------------------------------------------------------------- kurulum

  private build() {
    const bar = el("div", { id: "topbar" });
    const year = el("div", { id: "year" }, "1940");
    const forecast = el("span", { class: "badge", hidden: "" }, TEXTS.forecast);
    const popWrap = el(
      "div",
      { class: "stat" },
      el("span", { class: "tiny" }, TEXTS.population),
      el("b", { id: "population" }, "0")
    );
    const budWrap = el(
      "div",
      { class: "stat" },
      el("span", { class: "tiny" }, TEXTS.budget),
      el("b", { id: "budget" }, "0")
    );
    const mood = el("span", { id: "mood" }, "🙂");
    const satWrap = el(
      "div",
      { class: "stat" },
      el("span", { class: "tiny" }, TEXTS.satisfaction),
      el("b", { id: "satisfaction" }, "%100")
    );
    bar.append(
      el("div", { id: "year-wrap" }, year, forecast),
      popWrap,
      budWrap,
      el("div", { class: "mood-wrap" }, mood, satWrap)
    );
    this.root.append(bar);

    // --- hastalar paneli: iki çöküş göstergesi + kuyruk görseli + akış ---
    const canvas = el("canvas", { id: "queue-canvas" }) as HTMLCanvasElement;
    const gQueueVal = el("b", {}, "0");
    const gQueueLim = el("span", { class: "of" }, "");
    const gQueueBar = el("i", {});
    const gLostVal = el("b", {}, "0");
    const gLostLim = el("span", { class: "of" }, "");
    const gLostBar = el("i", {});
    const gauge = (
      label: string,
      val: HTMLElement,
      of: HTMLElement,
      bar: HTMLElement,
      id: string
    ) =>
      el(
        "div",
        { class: "gauge", id },
        el("span", { class: "tiny" }, label),
        el("div", { class: "gauge-num" }, val, of),
        el("div", { class: "limitbar" }, bar),
        el("span", { class: "gauge-note" }, TEXTS.collapseAtLimit)
      );

    const wait = el("div", { class: "wait" }, "");
    const material = el("div", { class: "warn-line", hidden: "" }, TEXTS.materialWarning);
    const flow = el("div", { class: "flow" });

    // evre dağılımı: oransal yığılmış bar + her evrenin sayısı
    const stageBar = el("div", { class: "stage-bar" });
    const stageSegs = STAGE_NAMES.map((name, i) =>
      el("i", { style: `background:${STAGE_COLORS[i]}`, title: `${i + 1} ${name}` })
    );
    stageBar.append(...stageSegs);
    const stageCounts = el("div", { class: "stage-counts" });
    const stageCountEls = STAGE_NAMES.map((name, i) =>
      el(
        "span",
        { class: "stage-count", title: `${i + 1} ${name}` },
        el("i", { class: "swatch", style: `background:${STAGE_COLORS[i]}` }),
        el("b", {}, "0")
      )
    );
    stageCounts.append(...stageCountEls);
    const legend = el(
      "div",
      { class: "stage-legend" },
      el(
        "div",
        { class: "stage-head" },
        el("span", { class: "tiny" }, TEXTS.stageScale),
        el("span", { class: "edge" }, TEXTS.stageEarly),
        el("span", { class: "edge edge--right" }, TEXTS.stageLate)
      ),
      stageBar,
      stageCounts
    );

    const queueWrap = el(
      "div",
      { class: "panel", id: "queue-wrap", title: TEXTS.tapHint },
      el("div", { class: "panel-title" }, TEXTS.patientsTitle),
      el(
        "div",
        { class: "gauges" },
        gauge(TEXTS.gaugeQueue, gQueueVal, gQueueLim, gQueueBar, "gauge-queue"),
        gauge(TEXTS.gaugeLost, gLostVal, gLostLim, gLostBar, "gauge-lost")
      ),
      canvas,
      legend,
      wait,
      material,
      flow
    );
    queueWrap.addEventListener("pointerdown", () => this.onTap());
    this.root.append(queueWrap);

    // --- kapasite ---
    const capacity = el("div", { id: "capacity" });
    this.root.append(
      el("div", { class: "panel" }, el("div", { class: "panel-title" }, TEXTS.systemTitle), capacity)
    );

    // --- hasta yorumları ---
    const comment = el("div", { id: "comments" }, "");
    this.root.append(comment);

    // --- dayatılanlar: oyuncunun seçmediği, yaşadığı şeyler ---
    const forcedShort = el("b", {}, TEXTS.forcedNone);
    const grantLine = el("b", {}, "—");
    const forcedPanel = el(
      "div",
      { class: "panel" },
      el("div", { class: "panel-title" }, TEXTS.forcedTitle),
      el(
        "div",
        { class: "forced-row" },
        el("span", { class: "k" }, TEXTS.upgShortName),
        forcedShort
      ),
      el("div", { class: "hint" }, TEXTS.forcedHint),
      el(
        "div",
        { class: "forced-row", style: "margin-top:8px" },
        el("span", { class: "k" }, TEXTS.grantTitle),
        grantLine
      ),
      el("div", { class: "hint" }, TEXTS.grantHint)
    );
    this.root.append(forcedPanel);

    // --- ayarlar ---
    const triageSeg = el("div", { class: "seg" });
    const triageBtns: HTMLButtonElement[] = (
      [
        ["order", TEXTS.triageOrder],
        ["severe", TEXTS.triageSevere],
        ["light", TEXTS.triageLight],
      ] as [TriageMode, string][]
    ).map(([mode, label]) => {
      const b = el("button", { type: "button" }, label) as HTMLButtonElement;
      b.addEventListener("click", () => {
        this.sim.setTriage(mode);
        play("tap");
        this.render();
      });
      b.dataset.mode = mode;
      triageSeg.append(b);
      return b;
    });

    const prevEffect = el("div", { class: "tiny", style: "margin-top:6px" }, "");
    const prevCap = el("div", { class: "warn-line", hidden: "" }, "");
    const prevSeg = el("div", { class: "seg" });
    const prevBtns: HTMLButtonElement[] = B.PREVENTIVE_OPTIONS.map((v) => {
      const b = el(
        "button",
        { type: "button" },
        v === 0 ? TEXTS.preventiveOff : pct(v * 100)
      ) as HTMLButtonElement;
      b.addEventListener("click", () => {
        this.sim.setPreventive(v);
        play("tap");
        this.render();
      });
      b.dataset.value = String(v);
      prevSeg.append(b);
      return b;
    });

    this.root.append(
      el(
        "div",
        { class: "panel" },
        el("div", { class: "panel-title" }, TEXTS.decisionsTitle),
        el("div", { class: "tiny" }, TEXTS.triageTitle),
        triageSeg,
        el("div", { class: "tiny", style: "margin-top:10px" }, TEXTS.preventiveTitle),
        prevSeg,
        prevCap,
        prevEffect,
        el("div", { class: "hint" }, TEXTS.preventiveHint)
      )
    );

    // --- yükseltmeler ---
    const list = el("div", { class: "panel" }, el("div", { class: "panel-title" }, TEXTS.upgradesTitle));
    const upgrades: Record<string, UpgradeRow> = {};
    for (const id of UPGRADE_IDS) upgrades[id] = this.buildUpgradeCard(list, id);
    upgrades.quota = this.buildQuotaCard(list);
    this.root.append(list);

    // --- hız ve ses ---
    const speedBtn = el("button", { class: "btn", type: "button" }, "×1") as HTMLButtonElement;
    speedBtn.addEventListener("click", () => {
      this.speed = this.speed === 1 ? 2 : 1;
      speedBtn.textContent = `×${this.speed}`;
      play("tap");
    });
    this.root.append(
      el(
        "div",
        { class: "panel row row--between" },
        el("span", { class: "tiny" }, TEXTS.speed),
        speedBtn
      )
    );

    this.ui = {
      year,
      forecast,
      population: popWrap.querySelector("b")!,
      budget: budWrap.querySelector("b")!,
      mood,
      satisfaction: satWrap.querySelector("b")!,
      canvas,
      gQueueVal,
      gQueueLim,
      gQueueBar,
      gLostVal,
      gLostLim,
      gLostBar,
      wait,
      stageSegs,
      stageCountEls,
      material,
      capacity,
      comment,
      flow,
      prevEffect,
      prevCap,
      forcedShort,
      grantLine,
      triage: triageBtns,
      preventive: prevBtns,
      upgrades,
      speedBtn,
    };
  }

  private buildUpgradeCard(parent: HTMLElement, id: UpgradeId): UpgradeRow {
    const level = el("span", { class: "lvl" }, "");
    const next = el("div", { class: "eff" }, "");
    const effect = el("div", { class: "eff" }, "");
    const button = el("button", { class: "btn", type: "button" }, "") as HTMLButtonElement;
    button.addEventListener("click", () => {
      if (this.sim.buyUpgrade(id)) {
        play("buy");
        this.render();
      } else {
        play("bad");
      }
    });
    const card = el(
      "div",
      { class: "upg" },
      el("div", {}, el("h4", {}, UPGRADE_NAMES[id]), level),
      el("div", { class: "price" }, button),
      next,
      effect
    );
    parent.append(card);
    return { card, level, next, effect, button };
  }

  /** "Kadro artır" kartı listede hep görünür ve hiçbir zaman açılmaz. */
  private buildQuotaCard(parent: HTMLElement): UpgradeRow {
    const button = el("button", { class: "btn", type: "button" }, "🔒") as HTMLButtonElement;
    button.addEventListener("click", () => {
      play("bad");
      this.notices.show(TEXTS.upgQuotaLocked);
    });
    const card = el(
      "div",
      { class: "upg upg--locked", id: "quota-card" },
      el("div", {}, el("h4", {}, TEXTS.upgQuota)),
      el("div", { class: "price" }, button),
      el("div", { class: "eff" }, TEXTS.upgQuotaDesc)
    );
    parent.append(card);
    return {
      card,
      level: el("span", {}),
      next: el("span", {}),
      effect: el("span", {}),
      button,
    };
  }

  // ------------------------------------------------------------------ döngü

  private tick = (ts: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.25, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    if (this.paused || this.sim.collapsed) return;

    const monthsPerSecond = 12 / secondsPerYear(this.sim.year);
    this.acc += dt * monthsPerSecond * this.speed * this.debugSpeed;
    let steps = 0;
    while (this.acc >= 1 && steps < 240 && !this.sim.collapsed) {
      this.acc -= 1;
      this.sim.step();
      steps++;
    }
    if (steps > 0) {
      for (const n of this.sim.drainNotices()) this.notices.show(n.text);
      this.render();
    }

    this.commentTimer += dt;
    if (this.commentTimer > 6) {
      this.commentTimer = 0;
      this.updateComment();
    }

    if (this.sim.collapsed) {
      play("collapse");
      this.onCollapse();
    }
  };

  private onTap() {
    if (this.sim.collapsed) return;
    const n = this.sim.tap();
    if (n > 0) play("tap");
    this.render();
  }

  // ------------------------------------------------------------------ çizim

  render() {
    const s = this.sim;
    const snap = s.snapshot();

    this.ui.year.textContent = String(snap.year);
    this.ui.forecast.hidden = snap.year < B.FORECAST_FROM_YEAR;
    this.ui.population.textContent = big(snap.population);
    this.ui.budget.textContent = big(snap.budget);
    this.ui.satisfaction.textContent = pct(snap.satisfaction);
    this.ui.mood.textContent =
      snap.satisfaction > 70 ? "🙂" : snap.satisfaction > 40 ? "😐" : "🙁";

    // kuyruk görseli yalnızca bileşim gözle görülür biçimde değiştiyse çizilir
    const qKey = snap.queue.map((q) => Math.round((q / Math.max(1, snap.queueTotal)) * 40)).join(",");
    if (qKey !== this.lastQueueKey) {
      this.lastQueueKey = qKey;
      drawQueue(this.ui.canvas, snap.queue, snap.queueTotal);
    }

    // iki çöküş göstergesi: kuyruk dolarsa da, diş kaybı sınırı aşılırsa da biter
    const setGauge = (
      val: HTMLElement,
      of: HTMLElement,
      bar: HTMLElement,
      value: number,
      limit: number
    ) => {
      const fill = Math.min(1, value / Math.max(1, limit));
      val.textContent = big(value);
      of.textContent = t(TEXTS.gaugeOfLimit, { n: big(limit) });
      val.style.color = fill < 0.5 ? "" : fill < 0.8 ? "var(--brick)" : "var(--red)";
      bar.style.width = `${(fill * 100).toFixed(1)}%`;
      bar.style.background =
        fill < 0.5 ? "var(--green)" : fill < 0.8 ? "var(--coin)" : "var(--red)";
    };
    setGauge(
      this.ui.gQueueVal,
      this.ui.gQueueLim,
      this.ui.gQueueBar,
      snap.queueTotal,
      snap.queueLimit
    );
    setGauge(
      this.ui.gLostVal,
      this.ui.gLostLim,
      this.ui.gLostBar,
      snap.lostTeeth,
      snap.lostTeethLimit
    );

    const qTotal = Math.max(1, snap.queueTotal);
    snap.queue.forEach((q, i) => {
      const share = snap.queueTotal > 0 ? q / qTotal : 0;
      this.ui.stageSegs[i].style.flexGrow = String(Math.max(0.0001, share));
      const b = this.ui.stageCountEls[i].querySelector("b")!;
      b.textContent = big(q);
      this.ui.stageCountEls[i].classList.toggle("stage-count--zero", q < 1);
    });

    this.ui.wait.textContent = t(TEXTS.avgWait, { n: num(weeks(snap.avgWaitMonths)) });
    this.ui.material.hidden = !snap.materialShort;

    // talep / kapasite: 1'in üstü, kapasitenin talebi karşılayamadığı demek
    // son 12 ayın akışı: kaçını tedavi ettik, kaçının sırası gelmedi
    const flowRows: [string, string, string, string][] = [
      [TEXTS.flowTreated, big(snap.treatedPerYear), "ok", ""],
      [TEXTS.flowDeferred, big(snap.deferredPerYear), snap.deferredPerYear > 0 ? "bad" : "ok", ""],
      [TEXTS.flowWorsened, big(snap.worsenedPerYear), snap.worsenedPerYear > 0 ? "warn" : "ok", ""],
      [
        TEXTS.flowReturned,
        big(snap.returnedPerYear),
        snap.returnedPerYear > 0 ? "bad" : "ok",
        TEXTS.flowReturnedHint,
      ],
    ];
    if (this.flowCells.length === 0) {
      this.ui.flow.append(el("span", { class: "tiny" }, TEXTS.flowTitle));
      for (const [k, , , hint] of flowRows) {
        const item = el(
          "span",
          { class: "flow-item", ...(hint ? { title: hint } : {}) },
          el("i", {}, k),
          el("b", {}, "")
        );
        this.ui.flow.append(item);
        this.flowCells.push([item, item.querySelector("b")!]);
      }
    }
    flowRows.forEach(([, v, tone], i) => {
      const [item, val] = this.flowCells[i];
      if (val.textContent !== v) val.textContent = v;
      const cls = `flow-item flow-item--${tone}`;
      if (item.className !== cls) item.className = cls;
    });

    // dayatılan kısa randevu ve yıllık ödenek
    if (snap.shortLevel === 0) {
      this.ui.forcedShort.textContent = TEXTS.forcedNone;
      this.ui.forcedShort.className = "";
    } else {
      this.ui.forcedShort.textContent = t(TEXTS.forcedLevel, {
        n: snap.shortLevel,
        c: Math.round(snap.complicationRate * 100),
      });
      this.ui.forcedShort.className = "hot";
    }
    this.ui.grantLine.textContent = snap.lastGrant
      ? t(snap.grantCut ? TEXTS.grantCut : TEXTS.grantNormal, { n: big(snap.lastGrant) })
      : "—";
    this.ui.grantLine.className = snap.grantCut ? "hot" : "";

    this.ui.prevEffect.textContent = t(TEXTS.preventiveEffect, {
      early: Math.round(snap.earlyArrivalShare * 100),
      cut: Math.round(snap.demandCut * 100),
    });
    // kısa randevu açıldıkça tarama için ayrılabilen zaman kısılır
    for (const b of this.ui.preventive) {
      const v = Number(b.dataset.value);
      b.disabled = v > snap.maxPreventive;
      b.classList.toggle("seg-locked", v > snap.maxPreventive);
    }
    this.ui.prevCap.hidden = snap.shortLevel === 0;
    if (snap.shortLevel > 0) {
      this.ui.prevCap.textContent = t(TEXTS.preventiveCapped, {
        n: snap.shortLevel,
        max: snap.maxPreventive === 0 ? TEXTS.preventiveOff : pct(snap.maxPreventive * 100),
      });
    }

    const ratio = snap.monthlyDemandSessions / Math.max(1, snap.monthlyCapacity);
    const capRows: [string, string][] = [
      [TEXTS.dentists, num(snap.dentists)],
      [TEXTS.seats, num(snap.seats)],
      snap.waitingDentists > 0
        ? [TEXTS.waitingDentists, num(snap.waitingDentists)]
        : [TEXTS.freeSeats, num(snap.freeSeats)],
      [TEXTS.upkeep, big(snap.upkeepPerYear)],
      [TEXTS.demandRatio, decimal(ratio, 2)],
    ];
    // satırlar bir kez kurulur, sonra yalnızca metin güncellenir
    if (this.capCells.length === 0) {
      for (const [k] of capRows) {
        const key = el("span", { class: "k" }, k);
        const val = el("b", {}, "");
        this.ui.capacity.append(key, val);
        this.capCells.push([key, val]);
      }
    }
    capRows.forEach(([k, v], i) => {
      const [key, val] = this.capCells[i];
      if (key.textContent !== k) key.textContent = k;
      if (val.textContent !== v) val.textContent = v;
    });

    for (const b of this.ui.triage) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === snap.triage));
    }
    for (const b of this.ui.preventive) {
      b.setAttribute("aria-pressed", String(Number(b.dataset.value) === snap.preventive));
    }

    for (const id of UPGRADE_IDS) this.renderUpgrade(id);
  }

  private renderUpgrade(id: UpgradeId) {
    const s = this.sim;
    const row = this.ui.upgrades[id];
    const lvl = s.upgrades[id];
    const cost = s.upgradeCost(id);
    const unlockYear = s.nextLevelUnlockYear(id);
    const unlocked = s.upgradeUnlocked(id);

    row.level.textContent = t(TEXTS.level, { n: lvl });
    row.next.textContent = t(TEXTS.nextLevel, { name: this.levelName(id, lvl) });
    row.effect.textContent = this.effectText(id);
    row.card.classList.toggle("upg--locked", !unlocked);

    if (!unlocked) {
      row.button.textContent = t(TEXTS.unlocksIn, { year: unlockYear });
      row.button.disabled = true;
      return;
    }
    row.button.textContent = big(cost);
    row.button.disabled = s.budget < cost;
    row.button.classList.toggle("btn--primary", s.budget >= cost);
  }

  /** Bir sonraki seviyenin adı — ekipman ve yapay zekada döneme bağlıdır. */
  private levelName(id: UpgradeId, lvl: number): string {
    if (id === "ekipman") {
      return EQUIPMENT_LEVELS[lvl]?.name ?? t(EQUIPMENT_GENERIC, { n: lvl + 1 });
    }
    if (id === "yapayZeka") {
      return AI_LEVELS[lvl] ?? t(AI_GENERIC, { n: lvl + 1 });
    }
    return t(TEXTS.level, { n: lvl + 1 });
  }

  private effectText(id: UpgradeId): string {
    const u = B.UPGRADES;
    switch (id) {
      case "hastane":
        return t(TEXTS.effectHospital, { n: decimal(u.hastane.hospitalMult) });
      case "ekipman":
        return t(TEXTS.effectSpeed, { n: decimal(u.ekipman.speedMult) });
      case "destek":
        return t(TEXTS.effectSpeed, { n: decimal(u.destek.speedMult) });
      case "bilinclendirme":
        return t(TEXTS.effectAwareness, {
          n: Math.round(u.bilinclendirme.mixShift * 100),
        });
      case "malzeme":
        return t(TEXTS.effectMaterial, { n: decimal(u.malzeme.materialMult, 2) });
      case "yapayZeka":
        return t(TEXTS.effectAI, {
          n: decimal(u.yapayZeka.speedMult),
          m: decimal(u.yapayZeka.progressMult, 2),
        });
    }
  }

  private updateComment() {
    const s = this.sim;
    const pool: [string, number][] = [];
    if (s.materialShort) pool.push(["malzeme", 3]);
    if (s.avgWaitMonths > 6) pool.push(["kotulesme", 3]);
    else if (s.avgWaitMonths > 1.5) pool.push(["bekleme", 3]);
    // kısa randevu açıkken hastalar aynı diş için tekrar tekrar geliyor
    if (s.shortLevel > 0) pool.push(["kisaRandevu", s.returnedPerYear > 0 ? 4 : 2]);
    if (s.grantCutThisYear) pool.push(["butce", 3]);
    if (s.preventive > 0) pool.push(["koruyucu", 1]);
    if (s.upgrades.bilinclendirme > 0) pool.push(["bilinclendirme", 1]);
    if (s.upgrades.yapayZeka > 0) pool.push(["yapayZeka", 1]);
    if (s.snapshot().freeSeats > 0 && s.year > 2010) pool.push(["bosKoltuk", 2]);
    if (pool.length === 0) pool.push(["sakin", 1]);

    const total = pool.reduce((a, [, w]) => a + w, 0);
    let r = s.rng() * total;
    let key = pool[0][0];
    for (const [k, w] of pool) {
      if (r < w) {
        key = k;
        break;
      }
      r -= w;
    }

    const list = PATIENT_COMMENTS[key] ?? PATIENT_COMMENTS.sakin;
    const text = list[Math.floor(s.rng() * list.length)];
    this.ui.comment.textContent = t(text, { hafta: num(weeks(s.avgWaitMonths)) });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.notices.destroy();
    this.root.remove();
  }
}
