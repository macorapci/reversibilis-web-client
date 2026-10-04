import type { UpgradeId } from "../config/balance";

export type TriageMode = "order" | "severe" | "light";

/** Çöküş sebebi: kuyruk limiti mi aşıldı, yoksa diş mi kaybedildi. */
export type CollapseReason = "kuyruk" | "dis";

/** Oyuncunun yaptığı ve yeniden oynatmada tekrarlanan eylemler. */
export type Decision =
  | { month: number; kind: "upgrade"; id: UpgradeId }
  | { month: number; kind: "triage"; value: TriageMode }
  | { month: number; kind: "preventive"; value: number };

export interface Notice {
  kind: "history" | "event" | "comment";
  text: string;
}

export interface Snapshot {
  month: number;
  year: number;
  monthOfYear: number;
  population: number;
  dentists: number;
  hospitals: number;
  seats: number;
  queue: number[];
  queueTotal: number;
  queueLimit: number;
  budget: number;
  satisfaction: number;
  avgWaitMonths: number;
  monthlyCapacity: number;
  monthlyDemandSessions: number;
  freeSeats: number;
  waitingDentists: number;
  materialShort: boolean;
  /** son 12 ayın akışı — ekrandaki "tedavi / ertelenen" satırı */
  arrivalsPerYear: number;
  treatedPerYear: number;
  deferredPerYear: number;
  worsenedPerYear: number;
  /** yeni gelenlerin erken evrede (1-2) olma oranı */
  earlyArrivalShare: number;
  /** koruyucu programın talebi düşürme oranı */
  demandCut: number;
  upgrades: Record<UpgradeId, number>;
  triage: TriageMode;
  preventive: number;
  collapsed: boolean;
  collapseYear: number | null;
  collapseReason: CollapseReason | null;
  /** bekleme yüzünden kaybedilen diş ve limiti */
  lostTeeth: number;
  lostTeethLimit: number;
  /** komplikasyon yüzünden son 12 ayda geri dönen hasta */
  returnedPerYear: number;
  /** kısa randevu yüzünden seçilebilen en yüksek koruyucu oranı */
  maxPreventive: number;
  /** Bakanlığın dayattığı kısa randevu seviyesi ve komplikasyon oranı */
  shortLevel: number;
  complicationRate: number;
  /** bu yılki devlet ödeneği ve kısılıp kısılmadığı */
  lastGrant: number;
  grantCut: boolean;
  /** yıllık hastane işletme gideri */
  upkeepPerYear: number;
  /** bilinçlendirmenin karışımı erkene kaydırma gücü */
  awarenessShift: number;
}

export interface SimStats {
  arrived: number;
  treated: number;
  treatedLate: number;
  savedTeeth: number;
  lostTeeth: number;
  importSpend: number;
  maxAvgWaitMonths: number;
  complications: number;
  monthsPreventiveOn: number;
  months: number;
  /** bekleyip evre atlayan hasta sayısı (toplam) */
  worsened: number;
  maxShortLevel: number;
  /** ödeneğin kısıldığı yıl sayısı */
  budgetCutYears: number;
}

/** Sonuç ekranındaki grafik için aylık memnuniyet izi. */
export interface Trace {
  year: number[];
  satisfaction: number[];
  collapseYear: number | null;
}
