/**
 * Tüm metinler, linkler ve gerçek veriler (Türkçe).
 *
 * `reversibilis-web-client` yalnızca teknik addır; kullanıcı arayüzünde
 * hiçbir zaman görünmez. Ekranda her yerde GAME_TITLE kullanılır.
 */

export const GAME_TITLE = "Reversibilis";
export const SITE_URL = "https://reversibilis.com";
export const SIGNATURE_URL = "https://10binatama.com/";
export const DATA_URL = "https://10binatama.com/#rakamlar";
export const CAMPAIGN_NAME = "Diş Hekimliğine 10 Bin Atama";
export const SHARE_TAG = "#DişHekimliğine10BinAtama";
export const SHARE_TEXT =
  "Reversibilis'te sistemi {yil}'e kadar taşıyabildim. Sen kaça kadar dayanırsın? reversibilis.com #DişHekimliğine10BinAtama";

/** Gizlilik dostu sayım için yer tutucu. v1'de kapalı. */
export const ANALYTICS_ENABLED = false;

// ---------------------------------------------------------------- kamusal durum

export type PublicIssue = {
  id: string;
  title: string;
  /** "Senin oyununda: ..." — oyuncunun istatistikleriyle doldurulur */
  inGame: string;
  /** "Gerçekte: ..." */
  fact: string;
  source: string;
  trigger: string[];
};

export const PUBLIC_ISSUES: PublicIssue[] = [
  {
    id: "kadro",
    title: "Hekim satın alamadın",
    inGame: "Her şeyi geliştirebildin ama hekim sayısını değil.",
    fact: "Bakanlığa bağlı ağız-diş sağlığı birimleri için açılan kadro 2022'de 948'di, 2026'da 521'e düştü. 10 binden fazla genç diş hekimi atama bekliyor.",
    source: "10binatama.com",
    trigger: ["always"],
  },
  {
    id: "talep",
    title: "Hasta akını",
    inGame: "2000'lerden sonra başvurular katlandı; kuyruk {bekleme} haftaya uzadı.",
    fact: "Kamudaki ağız-diş sağlığı birimlerine yıllık başvuru 2002'de yaklaşık 5,5 milyondu; 2022'de 53 milyonu aştı.",
    source: "Sağlık Bakanlığı (10binatama.com üzerinden)",
    trigger: ["kuyrukCokusu", "genel"],
  },
  {
    id: "sure",
    title: "Kısalan randevu",
    inGame: "Randevuyu kısalttıkça hastalar bir üst evrede geri döndü.",
    fact: "Kamuda bir diş hekimi yılda 4 binden fazla hastaya bakıyor; tedaviler 15–20, hatta 5–10 dakikaya sıkıştırılıyor.",
    source: "10binatama.com",
    trigger: ["kisaRandevu"],
  },
  {
    id: "koruyucu",
    title: "Geç kalınan tedavi",
    inGame: "Bekleyen dolgular kanala, kanallar implanta döndü: {kayipDis} diş kaybedildi.",
    fact: "Yaş gruplarına göre insanların %84–95'i diş hekimine yalnızca şikâyeti olduğunda gidiyor. 3 çocuktan 1'i son bir yılda diş ağrısı ya da dişe bağlı rahatsızlık yaşadı.",
    source: "10binatama.com",
    trigger: ["kayipYuksek", "koruyucuKapali"],
  },
  {
    id: "unit",
    title: "Koltuk ve hekim",
    inGame: "Oyunun sonunda {bosKoltuk} koltuk hekimsiz kaldı.",
    fact: "Bakanlığa bağlı birimlerde 11.285 diş üniti var, özel kliniklerde 23.510. Kampanya, atanacak her hekime bir ünit kurulmasını istiyor.",
    source: "Sağlık Bakanlığı istatistikleri (10binatama.com üzerinden)",
    trigger: ["bosKoltuk"],
  },
  {
    id: "esitsizlik",
    title: "Herkes aynı sırada değil",
    inGame: "Kuyruk ülke ortalamasıydı; uzak ilçelerde çok daha uzun olurdu.",
    fact: "Bir diş hekimine düşen hasta sayısı 2024'te İstanbul Şişli'de 250, Siirt Pervari'de 27.407 idi.",
    source: "10binatama.com",
    trigger: ["genel"],
  },
  {
    id: "goc",
    title: "Giden hekimler",
    inGame: "Her yıl hekimlerin bir kısmı sistemden ayrıldı.",
    fact: "Yurt dışında çalışmak için alınan İyi Hal Belgesi sayısı 2014'te 3'tü, 2025'te 400'e yaklaştı.",
    source: "Meslek örgütü verileri (10binatama.com üzerinden)",
    trigger: ["genel"],
  },
  {
    id: "issizlik",
    title: "Yetişti ama gelmedi",
    inGame: "Fakülteler hekim yetiştirdi, kamuya gelen sınırlı kaldı.",
    fact: "Diş hekimliği fakültesi sayısı 2002'de 19'du, 2023'te 105'e ulaştı. Odalara kayıtlı diş hekimleri arasında çalışmayanların oranı 2004'te %4,4'ten 2024'te %13,6'ya çıktı.",
    source: "TDB",
    trigger: ["genel"],
  },
];

/** Tarihsel bildirimler — oyunu durdurmaz. */
export const HISTORY_EVENTS: { year: number; month?: number; text: string }[] = [
  { year: 1940, text: "Nüfus 17,8 milyon. Ülkede tek bir diş hekimliği okulu var." },
  { year: 1963, text: "Ülkenin ikinci diş hekimliği okulu Ankara'da açıldı." },
  { year: 2002, text: "Diş hekimliği fakültesi sayısı: 19." },
  { year: 2020, month: 3, text: "Salgın: randevular durdu." },
  { year: 2022, text: "Bu yıl 948 kadro açıldı." },
  { year: 2023, text: "Diş hekimliği fakültesi sayısı 105'e ulaştı." },
  { year: 2026, text: "Bu yıl açılan kadro: 521." },
  { year: 2027, text: "Bugüne geldin. Bundan sonrası tahmin." },
];

/** Hasta yorumları — oyunun duygusal göstergesi. */
export const PATIENT_COMMENTS: Record<string, string[]> = {
  sakin: [
    "Dolgum yirmi dakikada bitti, teşekkürler!",
    "Randevu ertesi güne verildi, harika.",
    "Hekim her şeyi tek tek anlattı, içim rahat.",
    "Yıllardır korkuyordum, bu sefer hiç acımadı.",
    "Çocuğun ilk muayenesiydi, güler yüzle karşıladılar.",
    "Kanal tedavim üç seansta bitti, hepsi planlandığı gibi.",
  ],
  yapayZeka: [
    "Yapay zeka röntgenimi bir dakikada okudu.",
    "Randevum telefonda otomatik ayarlandı, sıra beklemedim.",
    "Gözle görünmeyen çürüğü makine yakaladı.",
  ],
  koruyucu: [
    "Çocuğumun dişleri okulda tarandı, erken yakalandı.",
    "Flor uygulaması yaptılar, dolgu gerekmedi.",
    "Altı ayda bir çağırıyorlar; on yıldır dolgum yok.",
    "Fissür örtücü sayesinde azı dişleri sapasağlam.",
  ],
  bilinclendirme: [
    "Afişi görüp ağrım yokken geldim, küçük bir çürük çıktı.",
    "Televizyondaki spotu izleyip çocuğu getirdim.",
    "Ağrıyı beklememek gerektiğini yeni öğrendim.",
  ],
  bekleme: [
    "Randevumu {hafta} hafta sonraya verdiler.",
    "Ağrım var ama sıra daha gelmedi.",
    "Sabah altıda sıraya girdim, yine alamadım.",
    "{hafta} hafta sonra diye bir kâğıt verdiler, o kadar.",
    "Özele gidecek param yok, beklemekten başka çarem de.",
  ],
  kotulesme: [
    "Dolgu için sıraya girdim, sıra gelene kadar kanala döndü.",
    "Dişimi kurtaramadılar, implant için sıra bekliyorum.",
    "Küçük bir çürüktü, şimdi çekilecek diyorlar.",
    "Beklerken yüzüm şişti, acile gittim.",
    "Altı ay önce gelseydim kurtulurmuş.",
  ],
  kisaRandevu: [
    "Hekimim çok hızlıydı ama ağrım geçmedi, tekrar geldim.",
    "Aynı diş için üçüncü kez geliyorum, her seferinde beş dakika.",
    "Dolgum iki ayda düştü, yeniden sıraya girdim.",
    "Her gelişimde başka bir hekim, her seferinde baştan anlatıyorum.",
    "Kanal tedavim yarım kaldı, randevu bitti diye eve gönderdiler.",
    "Koltuğa oturdum oturmadım, kalkmamı istediler.",
  ],
  bosKoltuk: [
    "Koca hastane, boş koltuklar… hekim yok.",
    "Beş ünit var, ikisi çalışıyor.",
    "Yeni bina açıldı ama randevu yine iki ay sonraya.",
  ],
  malzeme: [
    "İmplant malzemesi gelmedi, beklemedeyim.",
    "Protezim için 'stok yok' dediler.",
    "Malzeme gelince arayacaklarmış, üç aydır ses yok.",
  ],
  butce: [
    "Bu yıl ödenek yok demişler, randevular seyreldi.",
    "Hastane 'bütçe bitti' diyip yeni hasta almıyor.",
    "Kadro da yok, para da yok; sırada bekliyoruz.",
  ],
};

// ---------------------------------------------------------------- arayüz

export const STAGE_NAMES = [
  "Başlangıç çürüğü",
  "Çürük",
  "Pulpitis reversibilis",
  "Pulpitis irreversibilis",
  "Diş kaybı",
];

export const STAGE_TREATMENTS = [
  "Flor, fissür örtücü",
  "Dolgu",
  "Derin dolgu",
  "Kanal tedavisi",
  "Çekim + implant/protez",
];

/** Ekipman seviye adları ve en erken alınabileceği yıl. */
export const EQUIPMENT_LEVELS: { name: string; year: number }[] = [
  { name: "Elektrikli tur", year: 1940 },
  { name: "Hava türbinli tur", year: 1960 },
  { name: "Panoramik röntgen", year: 1975 },
  { name: "Dijital röntgen", year: 1995 },
  { name: "Döner kanal aletleri", year: 2000 },
  { name: "İntraoral tarayıcı", year: 2010 },
  { name: "CAD/CAM", year: 2012 },
  { name: "Lazer", year: 2015 },
  { name: "3B görüntüleme", year: 2018 },
];
export const EQUIPMENT_GENERIC = "Ekipman Sv. {n}";
export const EQUIPMENT_GENERIC_YEAR = 2020;

export const AI_LEVELS = [
  "Röntgen okuma",
  "Randevu planlama",
  "Çürük tespiti",
  "Risk tahmini",
];
export const AI_GENERIC = "Yapay zeka Sv. {n}";

export const TEXTS = {
  // --- başlık ---
  tagline: "1940'tan başla. Kaça kadar dayanabilirsin?",
  start: "Başla",
  bestScore: "En iyi skor",
  soundOn: "Ses: açık",
  soundOff: "Ses: kapalı",

  // --- görev / eğitim ---
  briefing:
    "Görevin: ülkenin ağız-diş sağlığını yönetmek. Hastalar bekledikçe dişleri kötüleşir.",
  tutorial: [
    "Kuyruk burada. Her renk bir evre: yeşil başlangıç çürüğü, kırmızı diş kaybı. Bekleyen hasta evre atlar.",
    "Yükseltmelerle kapasiteni büyütürsün. Seviyenin sonu yoktur, ama her seviye 3 kat pahalıdır.",
    "Triyaj kimin önce tedavi edileceğini seçer. Ağır vaka önce diş kurtarır, kuyruğu uzatır.",
  ],
  tutorialNext: "Devam",
  tutorialDone: "Başla",

  // --- üst bar ---
  year: "Yıl",
  forecast: "tahmin",
  population: "Nüfus",
  budget: "Bütçe",
  satisfaction: "Memnuniyet",

  // --- kuyruk paneli ---
  patientsTitle: "Hastalar",
  systemTitle: "Sistem",
  decisionsTitle: "Kararlar",
  gaugeQueue: "Sırada bekleyen",
  gaugeLost: "Çürüyüp kaybedilen diş",
  gaugeOfLimit: "/ {n}",
  collapseAtLimit: "dolarsa çöküş",
  stageScale: "Evre",
  queueEmpty: "KUYRUK BOŞ",
  stageEarly: "erken",
  stageLate: "kayıp",
  queueTitle: "Kuyruk",
  queueOf: "{n} / {k}",
  avgWait: "Ortalama bekleme: {n} hafta",
  irreversibilis: "IRREVERSIBILIS",
  lostTeeth: "Bekleme yüzünden kaybedilen diş",
  materialWarning: "Malzeme bekleniyor",
  notifPreventiveCut:
    "Randevular kısaldı: tarama için ayrılabilecek hekim zamanı azaldı.",
  notifShortForced:
    "Bakanlık randevu sürelerini kısalttı (Sv.{n}). Bu senin kararın değildi.",
  notifShortEased: "Kuyruk rahatladı, randevu süresi biraz uzadı (Sv.{n}).",
  notifBudgetCut: "Bu yıl bütçe kısıldı: ödeneğin büyük kısmı verilmedi.",
  tapHint: "Kuyruğa dokun: hemen tedavi et",

  // --- son 12 ayın akışı ---
  flowTitle: "Son 12 ay",
  flowTreated: "Tedavi edilen",
  flowDeferred: "Sırası gelmeyen",
  flowWorsened: "Evre atlayan",
  flowReturned: "Tekrar gelen",
  flowReturnedHint:
    "Kısa randevu yüzünden tedavisi tutmayan hastalar bir üst evrede kuyruğa geri döndü — sırayı onlar da uzatıyor.",

  // --- kapasite satırı ---
  dentists: "Hekim",
  seats: "Koltuk",
  freeSeats: "Boş koltuk",
  waitingDentists: "Koltuk bekleyen hekim",
  demandRatio: "Talep / kapasite",
  upkeep: "Hastane gideri",

  // --- ayarlar ---
  triageTitle: "Triyaj",
  triageOrder: "Sırayla",
  triageSevere: "Ağır vaka önce",
  triageLight: "Hafif vaka önce",
  preventiveTitle: "Koruyucu program",
  preventiveOff: "Kapalı",
  preventiveEffect: "Yeni gelenlerin %{early}'i erken evrede · talep −%{cut}",
  preventiveCapped:
    "Kısa randevu Sv.{n} açık: tarama için en fazla {max} ayırabilirsin.",
  preventiveHint:
    "Tarama, çürüğü erken yakalar: hasta tedavi için tekrar gelmez. Bedeli kapasiteden hemen düşer, faydası 5 yılda birikir.",

  // --- yükseltmeler ---
  upgradesTitle: "Yükseltmeler",
  upgHospital: "Hastane ağı",
  upgEquipment: "Teknolojik ekipman",
  upgAI: "Yapay zeka",
  upgShortName: "Kısa randevu",
  upgSupport: "Klinik destek ekibi",
  upgAwareness: "Halkı bilinçlendirme",
  upgMaterial: "Yerli malzeme üretimi",
  upgQuota: "Kadro artır",
  upgQuotaDesc: "Hekim sayısını iki katına çıkarır.",
  upgQuotaLocked: "Bu yükseltme senin elinde değil.",
  level: "Sv. {n}",
  nextLevel: "Sonraki: {name}",
  unlocksIn: "{year}'te açılır",
  effectHospital: "Hastane ve kuyruk limiti ×{n}",
  effectSpeed: "Kapasite ×{n}",
  effectAI: "Kapasite ×{n}, kötüleşme ×{m}",
  effectAwareness: "Hastalar daha erken gelir (+%{n})",
  effectMaterial: "Malzeme gideri ×{n}",

  // --- dayatılan kısa randevu ---
  forcedTitle: "Elinde olmayanlar",
  forcedNone: "Randevu süresi normal.",
  forcedLevel: "Sv.{n} · komplikasyon %{c}",
  forcedHint:
    "Kuyruk şişince Bakanlık randevu süresini kısaltıyor. Bunu sen seçmiyorsun: tedavi hızlanıyor ama hastalar tedavisi tutmadığı için bir üst evrede geri dönüyor ve taramaya ayıracak zaman kalmıyor.",

  // --- devlet ödeneği ---
  grantTitle: "Yıllık ödenek",
  grantNormal: "Bu yıl {n} ödenek geldi.",
  grantCut: "Bu yıl bütçe kısıldı: yalnızca {n} geldi.",
  grantHint: "Hizmet hastadan para kazanmaz; bütçe her yıl devletten gelir.",
  locked: "Kilitli",
  notEnough: "Bütçe yetmiyor",
  buy: "Al",

  // --- hız / ses ---
  speed: "Hız",
  paused: "Duraklatıldı",

  // --- çöküş ---
  collapseLine: "Sistem {year}'de geri dönüşü olmayan noktaya ulaştı.",
  collapseReasonQueue: "Kuyruk limiti aşıldı.",
  collapseReasonTeeth: "Çürüyüp kaybedilen diş sayısı sınırı aştı.",

  // --- sonuç ekranı ---
  resultYourGame: "Senin oyunun",
  resCollapseYear: "Çöküş yılı",
  resScore: "Skor",
  resBest: "En iyi skor",
  resTreated: "Tedavi edilen hasta",
  resSaved: "Kurtarılan diş",
  resLost: "Bekleme yüzünden kaybedilen diş",
  resImport: "İthal malzemeye giden bütçe",
  resMaxWait: "En uzun ortalama bekleme",
  resSatisfaction: "Son memnuniyet",
  resFreeSeats: "Boş koltuk",
  weeks: "{n} hafta",

  ghostTitle: "Atama yapılsaydı",
  ghostYours: "Senin oyunun",
  ghostWithHiring: "2026'da 10 bin atama yapılsaydı",
  ghostLine:
    "Aynı kararlarla, 10 bin atama yapılsaydı sistem {year}'e kadar dayanırdı.",
  ghostNeverLine: "Aynı kararlarla, 10 bin atama yapılsaydı {year}'e kadar çökmezdi.",
  ghostTooEarly:
    "Çöküş {ghostYear}'dan önce olduğu için bu oyunda atamanın etkisi görünmüyor. Daha uzun dayanabilirsen fark ortaya çıkar.",
  bestPossible:
    "Bu modelde en iyi strateji bile ~{year}'te çöküyor. Sorun yönetim değil, kadro.",

  publicTitle: "Oyunda yaşadıkların, gerçekte yaşanıyor",
  publicInGame: "Senin oyununda",
  publicFact: "Gerçekte",
  publicSource: "Kaynak",
  publicShowAll: "Tümünü gör",
  allNumbers: "Tüm rakamlar →",

  lockMomentTitle: "Oyunda kilitliydi.",
  lockMomentMain: "Bu kilidi oyun açamaz. İmza açar.",
  lockMomentSub:
    "Oyunda satın alamadığın tek şey hekimdi. Gerçekte 10 binden fazla diş hekimi atama bekliyor.",

  nameExplainer:
    "Pulpitis reversibilis: diş sinirindeki iltihabın erken, geri döndürülebilir evresi. Geç kalınırsa irreversibilis olur.",
  callToAction:
    "Gerçekte durum hâlâ reversibilis. Yılbaşına kadar en az 10 bin diş hekimi ataması için imza ver.",

  sign: "İmza ver",
  share: "Skorunu paylaş",
  shareCopied: "Paylaşım metni kopyalandı, görsel indirildi.",
  shareFailed: "Paylaşım yapılamadı.",
  replay: "Tekrar oyna",
  footnote:
    "Nüfus, başvuru, hekim ve kadro sayıları gerçek verilere dayanır; aradaki yıllar ve 2026 sonrası oyunun modelidir.",
  shareSurvived: "Sistemi {year}'e kadar taşıdım",
  shareLost: "Bekleme yüzünden {n} diş kaybedildi",

  // --- debug ---
  debugTitle: "debug",
  debugSpeed: "hız ×{n}",
  debugBudget: "+1000 bütçe",
  debugJump: "yıla atla",
  debugCollapse: "çökert",
  debugState: "ham durum",
};

/** `{ad}` biçimindeki yer tutucuları doldurur. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}
