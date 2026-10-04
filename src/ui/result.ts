import { BALANCE } from "../config/balance";
import {
  DATA_URL,
  PUBLIC_ISSUES,
  SIGNATURE_URL,
  TEXTS,
  type PublicIssue,
  t,
} from "../config/texts";
import type { Sim } from "../sim/sim";
import { replay } from "../sim/replay";
import type { Trace } from "../sim/types";
import { drawChart } from "./chart";
import { el, openExternal } from "./dom";
import { big, num, pct, weeks } from "./format";
import { shareScore } from "./share";
import { writeBestScore } from "./storage";
import { track } from "./analytics";

const B = BALANCE;

/** Oyuncunun istatistiklerine göre kamusal durum kartlarını seçer. */
function pickIssues(sim: Sim): PublicIssue[] {
  const snap = sim.snapshot();
  const tags = new Set<string>(["kuyrukCokusu"]);
  if (sim.stats.maxShortLevel > 0) tags.add("kisaRandevu");
  if (sim.rescueRate < 0.7) tags.add("kayipYuksek");
  if (sim.stats.monthsPreventiveOn < sim.stats.months / 2) tags.add("koruyucuKapali");
  if (snap.freeSeats > 0) tags.add("bosKoltuk");

  const picked: PublicIssue[] = [];
  const add = (it: PublicIssue) => {
    if (picked.length < 4 && !picked.includes(it)) picked.push(it);
  };

  // "kadro" her zaman ilk sırada
  const kadro = PUBLIC_ISSUES.find((i) => i.trigger.includes("always"));
  if (kadro) add(kadro);
  for (const issue of PUBLIC_ISSUES) {
    if (issue.trigger.some((tg) => tags.has(tg))) add(issue);
  }
  for (const issue of PUBLIC_ISSUES) {
    if (issue.trigger.includes("genel")) add(issue);
  }
  for (const issue of PUBLIC_ISSUES) add(issue);
  return picked;
}

function issueVars(sim: Sim): Record<string, string> {
  const snap = sim.snapshot();
  return {
    kayipDis: big(sim.stats.lostTeeth),
    bosKoltuk: num(snap.freeSeats),
    tedavi: big(sim.stats.treated),
    bekleme: num(weeks(sim.stats.maxAvgWaitMonths)),
  };
}

function issueCard(issue: PublicIssue, vars: Record<string, string>): HTMLElement {
  return el(
    "div",
    { class: "issue" },
    el("h4", {}, issue.title),
    el("span", { class: "lab" }, TEXTS.publicInGame),
    el("div", {}, t(issue.inGame, vars)),
    el("span", { class: "lab" }, TEXTS.publicFact),
    el("div", {}, issue.fact),
    el("div", { class: "src" }, `${TEXTS.publicSource}: ${issue.source}`)
  );
}

/** Sonuç ekranı (bölüm 11.2). */
export function showResult(parent: HTMLElement, sim: Sim, onReplay: () => void) {
  const snap = sim.snapshot();
  const year = sim.collapseYear ?? sim.year;
  const score = sim.score;
  const best = writeBestScore(score);
  const root = el("div", { class: "screen" });
  parent.append(root);

  // --- 1. Senin oyunun ---
  const cards: [string, string][] = [
    [TEXTS.resCollapseYear, String(year)],
    [TEXTS.resScore, num(score)],
    [TEXTS.resTreated, big(sim.stats.treated)],
    [TEXTS.resSaved, big(sim.stats.savedTeeth)],
    [TEXTS.resLost, big(sim.stats.lostTeeth)],
    [TEXTS.resImport, big(sim.stats.importSpend)],
    [TEXTS.resMaxWait, t(TEXTS.weeks, { n: num(weeks(sim.stats.maxAvgWaitMonths)) })],
    [TEXTS.resSatisfaction, pct(snap.satisfaction)],
    [TEXTS.resFreeSeats, num(snap.freeSeats)],
    [TEXTS.resBest, num(best)],
  ];
  root.append(
    el("h1", { class: "title" }, TEXTS.irreversibilis),
    el("p", { class: "sub" }, t(TEXTS.collapseLine, { year })),
    el(
      "p",
      { class: "sub", style: "font-size:14px;margin-top:4px" },
      sim.collapseReason === "dis" ? TEXTS.collapseReasonTeeth : TEXTS.collapseReasonQueue
    ),
    el(
      "div",
      { class: "panel" },
      el("div", { class: "tiny" }, TEXTS.resultYourGame),
      el(
        "div",
        { class: "cards", style: "margin-top:8px" },
        ...cards.map(([k, v]) =>
          el("div", { class: "card" }, el("div", { class: "k" }, k), el("div", { class: "v" }, v))
        )
      )
    )
  );

  // --- 2. "Atama yapılsaydı" grafiği ---
  const chartCanvas = el("canvas", { id: "chart" }) as HTMLCanvasElement;
  const ghostLine = el("p", { class: "tiny" }, "…");
  root.append(
    el(
      "div",
      { class: "panel" },
      el("div", { class: "tiny" }, TEXTS.ghostTitle),
      chartCanvas,
      el(
        "div",
        { class: "legend" },
        el("span", {}, el("i", {}), TEXTS.ghostYours),
        el("span", { class: "dashed" }, el("i", {}), TEXTS.ghostWithHiring)
      ),
      ghostLine,
      el("p", { class: "tiny" }, t(TEXTS.bestPossible, { year: B.BEST_POSSIBLE_YEAR }))
    )
  );

  // Yeniden oynatma başsız çalışır; bir sonraki karede çizilir.
  setTimeout(() => {
    const ghost = replay(sim.seed, sim.decisions, { ghost: true });
    const mine: Trace = sim.trace;
    drawChart(chartCanvas, mine, ghost.trace);
    // Çöküş atama yılından önceyse yeniden oynatma hiçbir şeyi değiştirmez
    if (year < B.GHOST_YEAR) {
      ghostLine.textContent = t(TEXTS.ghostTooEarly, { ghostYear: B.GHOST_YEAR });
    } else if (ghost.collapseYear) {
      ghostLine.textContent = t(TEXTS.ghostLine, { year: ghost.collapseYear });
    } else {
      ghostLine.textContent = t(TEXTS.ghostNeverLine, { year: B.SIM_HORIZON_YEAR });
    }
  }, 0);

  // --- 3. Kamusal durum ---
  const vars = issueVars(sim);
  const issues = pickIssues(sim);
  const issueBox = el("div", { class: "panel" }, el("div", { class: "tiny" }, TEXTS.publicTitle));
  const issueList = el("div", { style: "margin-top:8px" });
  for (const issue of issues) issueList.append(issueCard(issue, vars));
  const showAll = el("button", { class: "btn", type: "button" }, TEXTS.publicShowAll);
  showAll.addEventListener("click", () => {
    issueList.replaceChildren(...PUBLIC_ISSUES.map((i) => issueCard(i, vars)));
    showAll.remove();
  });
  const allLink = el("button", { class: "btn", type: "button" }, TEXTS.allNumbers);
  allLink.addEventListener("click", () => openExternal(DATA_URL));
  issueBox.append(issueList, el("div", { class: "row" }, showAll, allLink));
  root.append(issueBox);

  // --- 4. Kilit anı ---
  root.append(
    el(
      "div",
      { class: "panel", style: "padding:0;border:0" },
      el(
        "div",
        { id: "lock-moment" },
        el("span", { class: "lock" }, "🔒"),
        el("div", { class: "tiny" }, TEXTS.lockMomentTitle),
        el("h3", { style: "font-size:20px;margin:6px 0" }, TEXTS.lockMomentMain),
        el("div", { style: "font-size:13px" }, TEXTS.lockMomentSub)
      )
    )
  );

  // --- 5. İsim ve çağrı ---
  root.append(
    el(
      "div",
      { class: "panel" },
      el("p", { class: "tiny" }, TEXTS.nameExplainer),
      el("p", { style: "font-size:15px;margin:8px 0 0" }, TEXTS.callToAction)
    )
  );

  // --- 6. Düğmeler ---
  const sign = el("button", { class: "btn btn--primary btn--big", type: "button" }, TEXTS.sign);
  sign.addEventListener("click", () => {
    track("sign");
    openExternal(SIGNATURE_URL);
  });
  const shareBtn = el("button", { class: "btn", type: "button" }, TEXTS.share);
  const shareMsg = el("div", { class: "tiny" }, "");
  shareBtn.addEventListener("click", () => {
    void (async () => {
      shareBtn.disabled = true;
      track("share");
      const r = await shareScore({ year, lostTeeth: sim.stats.lostTeeth });
      if (r === "downloaded") shareMsg.textContent = TEXTS.shareCopied;
      else if (r === "failed") shareMsg.textContent = TEXTS.shareFailed;
      shareBtn.disabled = false;
    })();
  });
  const again = el("button", { class: "btn", type: "button" }, TEXTS.replay);
  again.addEventListener("click", onReplay);

  root.append(
    el(
      "div",
      { class: "panel" },
      sign,
      el("div", { class: "row", style: "margin-top:8px" }, shareBtn, again),
      shareMsg
    ),
    el("p", { class: "footnote" }, TEXTS.footnote)
  );

  window.scrollTo(0, 0);
}
