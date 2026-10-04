/**
 * Gerçek veriler. Bu dosyadaki hiçbir değer dengeleme için değiştirilmez;
 * hepsi `[GERÇEK]`tir. Dengeleme yalnızca `balance.ts` içindeki `[MODEL]`
 * değerleriyle yapılır.
 */

/** [GERÇEK] TÜİK genel nüfus sayımları ve ADNKS */
export const CENSUS: [number, number][] = [
  [1940, 17820950],
  [1945, 18790174],
  [1950, 20947188],
  [1955, 24064763],
  [1960, 27754820],
  [1965, 31391421],
  [1970, 35605176],
  [1975, 40347719],
  [1980, 44736957],
  [1985, 50664458],
  [1990, 56473035],
  [2000, 67803927],
  [2007, 70586256],
  [2010, 73722988],
  [2015, 78741053],
  [2020, 83614362],
  [2025, 86092168],
];

/**
 * [GERÇEK] Kamu ağız-diş sağlığı birimlerine toplam yıllık başvuru
 * — Sağlık Bakanlığı (10binatama.com üzerinden)
 */
export const VISIT_ANCHORS: [number, number][] = [
  [2002, 5462923],
  [2022, 53261198],
];

/**
 * [GERÇEK] Sağlık Bakanlığı'nda çalışan diş hekimi
 * — Ankara Üniversitesi açık ders notları (2015);
 *   Sağlık Düşüncesi ve Tıp Kültürü Dergisi (1 Aralık 2023)
 */
export const DENTIST_ANCHORS: [number, number][] = [
  [2015, 8683],
  [2023, 12774],
];

/** [GERÇEK] Açılan kadro (uç noktalar) — 10binatama.com */
export const ATAMA_ANCHORS: [number, number][] = [
  [2022, 948],
  [2026, 521],
];
