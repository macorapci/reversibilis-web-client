/**
 * Tüm dengeleme sayıları. Her değerin yanında `[GERÇEK]` (kaynağıyla) ya da
 * `[MODEL]` etiketi vardır.
 *
 * **Dengeleme yalnızca `[MODEL]` değerleri değiştirilerek yapılır;
 * `[GERÇEK]` değerlere dokunulmaz.** Hedefler için `npm run sim` çıktısına bak.
 */
export const BALANCE = {
  // ----------------------------------------------------------------- Takvim
  START_YEAR: 1940, // [GERÇEK] oyunun başlangıcı
  SIM_HORIZON_YEAR: 2070, // [MODEL] sonuç ekranı yeniden oynatma ufku
  /** [MODEL] gerçek saniye / oyun yılı */
  ERA_SPEEDS: [
    { until: 1979, secondsPerYear: 1.2 },
    { until: 1999, secondsPerYear: 2 },
    { until: 2026, secondsPerYear: 5 },
    { until: 9999, secondsPerYear: 6 },
  ],
  /** [MODEL] bu yıldan sonrası tahmindir; arayüzde etiketlenir */
  FORECAST_FROM_YEAR: 2027,

  // ----------------------------------------------------------------- Nüfus
  POPULATION_MODE: "census" as "census" | "average",
  POP_AVERAGE_GROWTH: 0.0187, // [GERÇEK] 1940→2025 ortalaması (türetilmiş)
  POP_GROWTH_AFTER_2025: 0.005, // [GERÇEK] 2025 artış hızı; sonrası sabit [MODEL]

  // ----------------------------------------------------------------- Talep
  VISIT_RATE_1940: 0.01, // [MODEL] kişi başı yıllık kamu diş başvurusu
  /**
   * [MODEL] 2022 sonrası lojistik eğrinin asimptotu. Eğri bu değere hiçbir
   * zaman ulaşmaz; 2045'te kişi başı ~3,6 başvuruya denk gelir. Tavan ne
   * kadar yüksekse talep o kadar uzun süre dik artar.
   */
  VISIT_RATE_CAP: 12,

  // ---------------------------------------------------------------- Evreler
  STAGE_SESSIONS: [0.5, 1, 1.5, 3, 6], // [MODEL]
  /** [MODEL] hasta başı malzeme = bu değer × INCOME_PER_SESSION (evre 5 ithal) */
  STAGE_MATERIAL_REL: [0.01, 0.05, 0.1, 0.3, 1.5],
  STAGE_PROGRESS_MONTHS: 3, // [MODEL] bekleyenin kaç ayda bir evre atladığı
  ARRIVAL_MIX_BASE: [0.05, 0.15, 0.3, 0.35, 0.15], // [MODEL] çoğu geç gelir
  ARRIVAL_MIX_PREVENTIVE: [0.3, 0.35, 0.2, 0.1, 0.05], // [MODEL] koruyucu tam etki

  // ----------------------------------------------------------------- Hekim
  DENTISTS_START: 300, // [MODEL] 1940 kamu diş hekimi — teyit edilince güncelle
  SESSIONS_PER_DENTIST_YEAR: 4000, // [GERÇEK] 10binatama.com
  /**
   * [MODEL] Taban hız katsayısı. SESSIONS_PER_DENTIST_YEAR bugünün aşırı
   * yüklü temposudur; 1940'ta bir hekim bunun çok altını yapardı. Ekipman
   * yükseltmeleri çarpanı zamanla 1'e taşır — böylece model, dokümandaki
   * "2022-23'te kapasite ≈ talep" çapasını kendiliğinden üretir.
   */
  BASE_SPEED: 0.26,
  /**
   * [MODEL] 2024+ yıllık kayıp: emeklilik + kamudan özele geçiş + yurt dışı.
   * Gerçek işaretler bu yönde — çalışmayan diş hekimi oranı 2004'te %4,4
   * iken 2024'te %13,6, yurt dışı İyi Hal Belgesi 2014'te 3 iken 2025'te ~400.
   * Dengede geç oyunun sertliğini belirleyen değer budur.
   */
  ATTRITION_RATE: 0.12,
  ATAMA_AFTER_2026: 521, // [GERÇEK] 2026 kadrosu; sonrası sabit [MODEL]

  // --------------------------------------------------------------- Hastane
  HOSPITALS_START: 190, // [MODEL] 1945'te 198 kurum vardı [GERÇEK]
  SEATS_PER_HOSPITAL: 2, // [MODEL]
  QUEUE_PER_HOSPITAL: 13000, // [MODEL] kuyruk limiti = hastane × bu
  /**
   * [MODEL] İkinci çöküş şartı: sırası gelmediği için kaybedilen diş sayısı
   * bunu aşarsa sistem çöker. Kuyruk limiti "sistem tıkandı" der; bu ise
   * "insanlar dişini kaybetti" der. Oyunun asıl bedeli budur.
   */
  LOST_TEETH_LIMIT: 60_000_000,

  // ----------------------------- Yükseltmeler (fiyat = base × 3^seviye) ---
  COST_MULT: 3, // [MODEL] her seviye bir öncekinin 3 katı
  UPGRADES: {
    hastane: { base: 300, unlock: 1940, hospitalMult: 1.9 }, // [MODEL]
    ekipman: { base: 9000, unlock: 1940, speedMult: 1.6 }, // [MODEL]
    /** [MODEL] Ağız-diş sağlığı teknikeri ve yardımcı personel: hekimi
     *  çoğaltmaz ama her hekimin yaptığı iş artar. Ucuz, erken hat. */
    destek: { base: 18000, unlock: 1950, speedMult: 1.4 },
    /** [MODEL] Halkı bilinçlendirme: "ağrımadan git" kampanyaları. Hastalar
     *  daha erken evrede gelir, kuyruk ucuzlar. Kapasiteyi artırmaz. */
    bilinclendirme: { base: 1800, unlock: 1960, mixShift: 0.3 },
    /** [MODEL] Yerli malzeme üretimi: ithal implant/protez faturasını düşürür,
     *  malzeme zamlarının etkisini kırar. */
    malzeme: { base: 2200, unlock: 1980, materialMult: 0.7 },
    yapayZeka: { base: 6750, unlock: 2015, speedMult: 1.3, progressMult: 0.9 }, // [MODEL]
  },

  /**
   * Kısa randevu artık oyuncunun tercihi değil: kuyruk şişince Bakanlık
   * randevu sürelerini kısaltır. Oyuncu bunu seçmez, yaşar.
   */
  SHORT_FORCED: {
    /** kuyruk limitin bu oranını aşarsa baskı başlar */
    queueRatio: 0.5, // [MODEL]
    /** baskı bu kadar ay sürerse seviye bir artar */
    monthsToRaise: 10, // [MODEL]
    /** kuyruk rahatsa bu kadar ay sonra seviye bir düşer */
    monthsToDrop: 30, // [MODEL]
    maxLevel: 5, // [MODEL]
    speedMult: 1.25, // [MODEL] hızlandırır ama azıcık: asıl bedeli komplikasyon
    complicationAdd: 0.12, // [MODEL]
    complicationMax: 0.6, // [MODEL]
  },

  // ----------------------------------------------------- Koruyucu program
  PREVENTIVE_OPTIONS: [0, 0.1, 0.2, 0.3], // [MODEL]
  PREVENTIVE_LAG_YEARS: 5, // [MODEL] hareketli ortalama penceresi
  /**
   * [MODEL] Koruyucu programın asıl faydası: flor ve fissür örtücü çürüğü
   * önler, hastanın tedavi için tekrar gelmesine gerek kalmaz. Tam etkide
   * (%30 tarama, 5 yıllık ortalama) toplam talep bu oranda düşer. Bedeli
   * anında ödenir, faydası 5 yılda birikir — zamanlama beceri ister.
   */
  PREVENTIVE_DEMAND_CUT: 0.45,

  // -------------------------------------------------------------- Ekonomi
  /**
   * Kamu ağız-diş sağlığı hizmeti hastadan para kazanmaz: her yıl devletten
   * ödenek alır. Ödenek nüfusa bağlıdır ve bazı yıllar kesilir.
   */
  BUDGET_START: 50, // [MODEL] 1940 başlangıç kasası
  /**
   * [MODEL] 1940'ta kişi başı yıllık kamu ödeneği. Ödenek hem nüfusla hem de
   * ülkenin gelişimiyle (GRANT_GROWTH) büyür; hastadan alınan parayla değil.
   */
  GRANT_PER_CAPITA: 0.00001,
  GRANT_GROWTH: 0.05, // [MODEL] yıllık reel büyüme
  /**
   * [MODEL] Ödeneğin memnuniyete bağlı payı. Siyasi destek: iyi işleyen
   * hizmet ödeneğini alır, çöken hizmetin bütçesi kısılır. 0 = tamamen
   * düz ödenek, 1 = tamamen performansa bağlı.
   */
  GRANT_SATISFACTION_WEIGHT: 0.85,
  BUDGET_CUT_CHANCE: 0.25, // [MODEL] ödeneğin kısılma ihtimali (yıllık)
  BUDGET_CUT_MULT: 0.3, // [MODEL] kısıldığı yıl verilen pay
  BUDGET_CUT_FROM_YEAR: 1960, // [MODEL]
  /**
   * [MODEL] Hastane başına yıllık işletme gideri (1940 değeri; ödenekle aynı
   * hızda büyür). İhtiyaçtan fazla hastane açmak bütçeyi yer — "boş koltuk"
   * yalnızca üzücü bir sayaç değil, ödediğin bir fatura.
   */
  HOSPITAL_UPKEEP: 0.033,
  MATERIAL_UNIT: 0.001, // [MODEL] malzeme birim maliyeti
  TAP_SESSIONS: 2000, // [MODEL] dokunuş başına ek seans
  MATERIAL_PRICE_EVENT_MULT: 1.15, // [MODEL]
  MATERIAL_EVENT_AVG_YEARS: 8, // [MODEL]
  MATERIAL_EVENT_FROM_YEAR: 1980, // [MODEL]

  // ----------------------------------------------------------- Memnuniyet
  WAIT_PENALTY: 6, // [MODEL] puan / ay bekleme
  LOSS_PENALTY: 40, // [MODEL]
  SHORT_PENALTY: 5, // [MODEL] puan / kısa randevu seviyesi
  SATISFACTION_LERP: 0.2, // [MODEL] her ay hedefe yaklaşma oranı

  // --------------------------------------------------------------- Olaylar
  PANDEMIC: { start: "2020-03", end: "2020-05", capacityMult: 0.2 }, // olay [GERÇEK], etki [MODEL]
  KOMPLIKASYON_DONUS_AY: 2, // [MODEL]
  SCHOOL_SCREEN_CHANCE: 0.3, // [MODEL] koruyucu açıkken yıllık şans
  SCHOOL_SCREEN_SHARE: 0.3, // [MODEL] evre 1-2 kuyruğunun erittiği pay

  // ------------------------------------ Sonuç ekranı yeniden oynatması ---
  GHOST_YEAR: 2026, // [GERÇEK] kampanyanın talebi: 2026'da atama
  GHOST_EXTRA_DENTISTS: 10000, // [GERÇEK] 10 bin atama
  GHOST_EXTRA_SEATS: 10000, // [GERÇEK] atanan her hekime bir ünit

  BEST_POSSIBLE_YEAR: 2039, // [MODEL] `npm run sim`: Akıllı bot ortalama 2039'da çöküyor
};

export type Balance = typeof BALANCE;
export type UpgradeId = keyof typeof BALANCE.UPGRADES;
