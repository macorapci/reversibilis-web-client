import { BALANCE } from "../config/balance";
import {
  ATAMA_ANCHORS,
  CENSUS,
  DENTIST_ANCHORS,
  VISIT_ANCHORS,
} from "../config/data";

const B = BALANCE;

/** İki nokta arasında bileşik (geometrik) ara değerleme. */
export function geoInterp(
  x: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): number {
  if (x1 === x0) return y0;
  const k = (x - x0) / (x1 - x0);
  return y0 * Math.pow(y1 / y0, k);
}

function lerp(x: number, x0: number, y0: number, x1: number, y1: number): number {
  if (x1 === x0) return y0;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

const LAST_CENSUS = CENSUS[CENSUS.length - 1];

/** Nüfus (kesirli yıl kabul eder). */
export function population(year: number): number {
  if (B.POPULATION_MODE === "average") {
    const base = CENSUS[0][1];
    const p = base * Math.pow(1 + B.POP_AVERAGE_GROWTH, year - CENSUS[0][0]);
    return year <= LAST_CENSUS[0]
      ? p
      : LAST_CENSUS[1] * Math.pow(1 + B.POP_GROWTH_AFTER_2025, year - LAST_CENSUS[0]);
  }
  if (year <= CENSUS[0][0]) return CENSUS[0][1];
  if (year >= LAST_CENSUS[0]) {
    return LAST_CENSUS[1] * Math.pow(1 + B.POP_GROWTH_AFTER_2025, year - LAST_CENSUS[0]);
  }
  for (let i = 1; i < CENSUS.length; i++) {
    if (year <= CENSUS[i][0]) {
      return geoInterp(year, CENSUS[i - 1][0], CENSUS[i - 1][1], CENSUS[i][0], CENSUS[i][1]);
    }
  }
  return LAST_CENSUS[1];
}

const [Y_A, VISITS_A] = VISIT_ANCHORS[0];
const [Y_B, VISITS_B] = VISIT_ANCHORS[1];
/** [GERÇEK] çapalardan türeyen kişi başı yıllık başvuru oranları. */
export const RATE_A = VISITS_A / population(Y_A);
export const RATE_B = VISITS_B / population(Y_B);

/** 2002→2022 arasındaki yıllık bileşik artış; lojistik eğrinin başlangıç eğimi. */
const RATE_GROWTH = Math.pow(RATE_B / RATE_A, 1 / (Y_B - Y_A)) - 1;
const LOGISTIC_K = RATE_GROWTH / (1 - RATE_B / B.VISIT_RATE_CAP);

/** Kişi başı yıllık kamu diş başvurusu. */
export function visitRate(year: number): number {
  if (year <= B.START_YEAR) return B.VISIT_RATE_1940;
  if (year <= Y_A) return geoInterp(year, B.START_YEAR, B.VISIT_RATE_1940, Y_A, RATE_A);
  if (year <= Y_B) return geoInterp(year, Y_A, RATE_A, Y_B, RATE_B);
  const cap = B.VISIT_RATE_CAP;
  return cap / (1 + (cap / RATE_B - 1) * Math.exp(-LOGISTIC_K * (year - Y_B)));
}

/** Yıllık talep — seans cinsinden. */
export function yearlyDemandSessions(year: number): number {
  return population(year) * visitRate(year);
}

const [DY_A, DENT_A] = DENTIST_ANCHORS[0];
const [DY_B, DENT_B] = DENTIST_ANCHORS[1];
const [AY_A, ATAMA_A] = ATAMA_ANCHORS[0];
const [AY_B, ATAMA_B] = ATAMA_ANCHORS[1];

/** O yıl açılan kadro. Uç noktalar [GERÇEK], arası doğrusal [MODEL]. */
export function atama(year: number): number {
  if (year <= AY_A) return ATAMA_A;
  if (year >= AY_B) return B.ATAMA_AFTER_2026;
  return lerp(year, AY_A, ATAMA_A, AY_B, ATAMA_B);
}

/**
 * Sağlık Bakanlığı'nda çalışan diş hekimi sayısı.
 * 2023'e kadar gerçek çapalardan türer; sonrası ayrılma + atama ile yürür.
 * Oyuncu bu sayıyı hiçbir şekilde etkileyemez.
 */
export function dentists(year: number): number {
  if (year <= B.START_YEAR) return B.DENTISTS_START;
  if (year <= DY_A) return geoInterp(year, B.START_YEAR, B.DENTISTS_START, DY_A, DENT_A);
  if (year <= DY_B) return geoInterp(year, DY_A, DENT_A, DY_B, DENT_B);

  // 2024+: hekim(y+1) = hekim(y) × (1 − ayrılma) + atama(y)
  let d = DENT_B;
  for (let y = DY_B; y < Math.floor(year); y++) {
    d = d * (1 - B.ATTRITION_RATE) + atama(y);
  }
  const next = d * (1 - B.ATTRITION_RATE) + atama(Math.floor(year));
  return lerp(year, Math.floor(year), d, Math.floor(year) + 1, next);
}

/** Dönemin oyun hızı (gerçek saniye / oyun yılı). */
export function secondsPerYear(year: number): number {
  for (const era of B.ERA_SPEEDS) if (year <= era.until) return era.secondsPerYear;
  return B.ERA_SPEEDS[B.ERA_SPEEDS.length - 1].secondsPerYear;
}
