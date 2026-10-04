/** Türkçe sayı biçimleri: 1.234.567, "1,2 milyon", "3,4 milyar". */

const nf = new Intl.NumberFormat("tr-TR");

export function num(n: number): string {
  return nf.format(Math.round(n));
}

export function big(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1).replace(".", ",")} milyar`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} milyon`;
  if (a >= 1e4) return `${(n / 1e3).toFixed(0)} bin`;
  return num(n);
}

/** Bütçe birimi — oyun içinde soyut "kaynak". */
export function money(n: number): string {
  return big(n);
}

export function pct(n: number): string {
  return `%${Math.round(n)}`;
}

/** Ay cinsinden bekleme → hafta. */
export function weeks(months: number): number {
  return Math.round((months * 52) / 12);
}

export function decimal(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}
