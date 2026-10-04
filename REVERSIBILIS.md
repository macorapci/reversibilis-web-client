# Reversibilis — Oyun Tasarım ve Geliştirme Dokümanı

> Bu dosya Claude Code için yazıldı. Oyunu bu dokümana göre, bölüm 13'teki "Geliştirme aşamaları" sırasıyla geliştir. Her aşamanın sonunda oyun tarayıcıda çalışır durumda olsun. Bir sonraki aşamaya geçmeden dur ve neyin hazır olduğunu kısaca özetle.

## 0. Kimlik

| | |
|---|---|
| Proje / repo / `package.json` adı | `reversibilis-web-client` |
| Ekranda görünen ad (her yerde) | **Reversibilis** (`GAME_TITLE`) |
| Alan adı | https://reversibilis.com |
| İmza linki | https://10binatama.com/ |
| Kampanya | Diş Hekimliğine 10 Bin Atama — `#DişHekimliğine10BinAtama` |

- `reversibilis-web-client` yalnızca teknik addır (klasör, repo, paket). Oyun ekranında, sayfa başlığında (`<title>`), OG etiketlerinde ve paylaşım kartında **hiçbir zaman** görünmez; bunların hepsinde `GAME_TITLE` kullanılır.
- Kampanya sitesinden canlı veri (imza sayısı vb.) **çekilmez**. İmza sayısı oyun mekaniğine bağlanmaz. Kampanyayla tek bağlantı "İmza ver" linkidir.

### İsmin anlamı
*Pulpitis reversibilis*: diş sinirindeki iltihabın erken, geri döndürülebilir evresi; basit bir tedaviyle kurtarılır. Geç kalınırsa *irreversibilis* olur ve kanal tedavisi gerekir. Oyunun mesajı: **sorun hâlâ geri döndürülebilir, ama müdahale şimdi gerekiyor.** Oyun içinde sistem çöktüğünde ekrana IRREVERSIBILIS düşer; final ekranı gerçek hayatta durumun hâlâ reversibilis olduğunu söyleyip imzaya yönlendirir.

## 1. Amaç

Yılbaşına kadar en az 10 bin diş hekimi ataması talep eden **Diş Hekimliğine 10 Bin Atama** imza kampanyasına dikkat çekmek.

Oyuncu diş hekimi yetiştiren bir sistemi yönetir: üretimi otomatikleştirir ama **Atama Kapısı**'nın kotası hiç artmaz, hatta zamanla azalır. Sistem kaçınılmaz olarak çöker; oyuncu ne kadar iyi oynarsa o kadar geç çöker. Oyun, **"Bu kapıyı oyun açamaz. İmza açar."** mesajı ve imza linkiyle biter.

Hedef: 5–8 dakikalık, telefonda tek elle oynanabilen, sonucu paylaşılabilir bir web oyunu.

## 2. Platform ve teknoloji

- Tarayıcıda çalışan statik web oyunu. Kurulum yok, sunucu yok.
- **Vite + TypeScript + Phaser** (güncel kararlı sürüm).
- **Dikey (portrait) tasarım**, mantıksal çözünürlük 720×1280. Phaser Scale Manager `FIT` + ortalama. PC'de ekranın ortasında dikey bir kart olarak görünür.
- Dokunma ve fare aynı şekilde çalışır. Serbest bant çizme ve zorunlu sürükle-bırak YOK; her etkileşim tek dokunuşla yapılır.
- Tüm dengeleme sayıları tek yerde: `src/config/balance.ts`.
- Tüm metinler, linkler ve gerçek veriler tek yerde: `src/config/texts.ts` (Türkçe).
- Türkçe karakterleri (ç ğ ı İ ö ş ü) destekleyen bir web fontu (ör. Google Fonts "Nunito" veya "Inter").
- Toplam boyut hedefi < 3 MB. Görseller basit vektör/şekil. Harici telifli görsel, karakter veya logo kullanılmaz.
- **Resmî kurum logosu, amblemi ya da resmî görünümlü tasarım KULLANILMAZ.** Oyun bir kampanya oyunudur; bir resmî kurumun yayını gibi görünmemeli. Kampanyayı yürüten topluluğun logosu da yalnızca izin alınırsa eklenir (v1'de yok).

## 3. Ekran düzeni (dikey, yukarıdan aşağıya)

1. **Üst bar:** Yıl, Bütçe, Skor ve iki çöküş barı (Bekleme Alanı, Hasta Sabrı).
2. **Fakülteler:** Yan yana fakülte binaları (en fazla 8 görünür, fazlası "+3" gibi gösterilir).
3. **Bantlar:** Fakültelerden aşağı akan ve ortada birleşen sabit bantlar.
4. **Atama Kapısı** (üstünde o yılın kotası yazan küçük bir tabela) ve önündeki **Bekleme Alanı** (mezun ikonları burada yığılır).
5. **Hastaneler:** 4 hastane. Her birinde hasta kuyruğu, hekim ikonları ve hekimlerin enerji barları.
6. **Alt bar:** Yükseltme/araç butonları ve Hızlı Mod anahtarı.

## 4. Zaman

- 1 oyun yılı = 30 sn (`YEAR_SECONDS`).
- Bant yolculuğu ~5 sn sürer ve okulun 5 yılını temsil eder (oyun yılına bağlı değildir).
- Kapı her yılın sonunda açılır.

## 5. Varlıklar ve kurallar

### Fakülte
- Her fakülte yılda `GRADS_PER_FACULTY` mezun üretir (yıl içine yayılmış).
- Yıl 1–3: Oyuncu bütçeyle yeni fakülte açar (en fazla `MAX_PLAYER_FACULTIES`).
- `AUTO_FACULTY_FROM_YEAR`. yıldan itibaren her yıl başında otomatik olarak +1 fakülte açılır. Bildirim: "Yeni diş hekimliği fakültesi açıldı!" Fakülteler kapatılamaz; artık oyuncunun kontrolünde değildir.

### Atama Kapısı
- Her yıl sonunda açılır ve en fazla o yılın kotası kadar mezun geçirir.
- Kota `GATE_QUOTA_START` ile başlar ve her `GATE_QUOTA_DROP_EVERY_YEARS` yılda bir 1 azalır; `GATE_QUOTA_MIN` altına inmez. Kota düştüğü yıl bildirim: "Bu yıl açılan kadro azaldı." (Gerçekte açılan kadro 2022'de 948 iken 2026'da 521'e düştü; bkz. bölüm 15.)
- **Kota hiçbir yolla artmaz.** Yükseltme menüsünde her zaman kilitli bir **"Kadro artır"** butonu bulunur. Dokununca: "Bu yükseltme senin elinde değil."

### Bekleme Alanı
- Kapıdan geçemeyen mezunlar burada yığılır. Kapasite: `WAIT_CAPACITY`.
- Bekleyen mezun ikonları zamanla griye döner. Birkaç ikonun üstünde örnek olarak "Bekleme: N yıl" balonu görünür.
- Doluluk %100 olursa → **ÇÖKÜŞ**.

### Hastaneler ve hastalar
- 4 hastane, kurgusal adlarla: **Merkez**, **Sahil**, **Ova**, **Dağ İlçesi**.
- Hasta dağılım ağırlıkları eşit değildir (`HOSPITAL_WEIGHTS`): Merkez en az, Dağ İlçesi en çok yük alır. Bu, gerçekteki bölgesel eşitsizliğe gönderme yapar ve yönlendirme becerisini önemli kılar.
- Her hastane `QUEUE_START_PER_HOSPITAL` hastalık bir kuyrukla başlar.
- Toplam hasta geliş hızı `PATIENT_RATE_START` ile başlar ve her yıl `PATIENT_RATE_GROWTH` oranında (bileşik) artar.
- Hekimi olmayan hastanenin kuyruğu sadece büyür.
- **Hasta Sabrı** barı = toplam kuyruk / (`QUEUE_CAPACITY_PER_HOSPITAL` × 4). %100 olursa → **ÇÖKÜŞ**.

### Hekim
- Kapıdan geçen her mezun hekim olur, bir hastaneye atanır ve orada kalıcı çalışır.
- Normal modda bir hastayı `TREAT_TIME_NORMAL` saniyede tedavi eder; enerjisi sabit kalır.
- Enerjisi 0'a inen hekim tükenir ve sistemden ayrılır (bkz. bölüm 8).

### Bütçe
- Gelir: her tamamlanan tedavi için `INCOME_PER_TREATMENT`, her yıl başında `INCOME_PER_YEAR`.
- Yükseltmeler ve araçlar bütçe harcar.

## 6. Oyun akışı (oyuncu deneyimi)

1. **Başlık ekranı:** Büyük **Reversibilis** yazısı, altında küçük "Kaç yıl dayanabilirsin?" ve "Başla" butonu. Konu bu ekranda açıklanmaz; merak korunur.
2. **Görev (~10 sn):** "Görevin: ülkenin diş hekimi ihtiyacını karşılamak." Ardından 3 adımlık kısa ipucu balonlarıyla eğitim.
3. **Sistem çalışıyor (yıl 1):** Mezun sayısı kotanın altındadır; herkes atanır, kuyruklar kısalır, hastaneler yeşile döner. Oyuncu doğru yolda olduğuna inanır.
4. **Otomasyon (yıl 1–3):** Oyuncu bütçeyle fakülte açar, bantları hızlandırır. Bu bölüm keyifli ve tatmin edici olmalı: hızla artan sayaçlar, küçük animasyonlar.
5. **Tıkanma (yıl 4+):** Fakülteler kendiliğinden açılır, kapı kotası düşer, bekleme alanı dolar, kuyruklar yeniden kızarır. Oyuncu araçlarla ve Hızlı Mod ile süre kazanmaya çalışır.
6. **Çöküş ve final:** Barlardan biri dolunca oyun durur ve final ekranına geçilir.

## 7. Beceri araçları

Her aracın bir bedeli vardır. Beceri = bedeli doğru zamanda ödemek.

| Araç | Etki | Bedel |
|---|---|---|
| **Akıllı yönlendirme** (otomatik olay) | Kapı açıldığında oyun 5 sn yavaşlar; oyuncu hastanelere dokunarak yeni hekimleri dağıtır. | Süre dolarsa kalanlar rastgele dağıtılır (genelde kötü sonuç). |
| **Uzmanlık (DUS)** | Bekleme alanından `DUS_COUNT` kişiyi çıkarır. | `DUS_RETURN_YEARS` yıl sonra hepsi birden geri döner. Bütçe maliyeti var, kullanım sonrası 1 yıl bekleme süresi. |
| **Özel sektör** | Her kullanımda bekleme alanından 3 kişi çıkarır. | Toplam kapasite `PRIVATE_CAPACITY`; dolunca buton kalıcı olarak kapanır. |
| **Yurt dışı** | Bekleme alanından `ABROAD_COUNT` kişiyi anında çıkarır. | Giden her hekim skordan `ABROAD_PENALTY` puan düşürür. |
| **Mobil diş ünitesi** | Seçilen hastanenin kuyruğunu 10 sn boyunca 3 kat hızlı eritir. | Pahalı; kullanım sonrası 1 yıl bekleme süresi. |

## 8. Verimlilik hattı ve Hızlı Mod

Alt barda **"Hızlı Mod"** anahtarı bulunur. Seviyeler önce bütçeyle açılır, sonra mod istenildiğinde açılıp kapatılır.

- **Seviye 1 — Kısa randevu:** Randevu 60 → 30 dk. Tedavi süresi `TREAT_TIME_L1` olur.
- **Seviye 2 — Seanslara bölme:** Kanal tedavisi 3 seansa bölünür, randevu 10 dk olur. Her seans `SESSION_TIME_L2` sürer ve hasta kuyruğa 3 kez girer (seanslar arası kısa bekleme).

Hızlı Mod açıkken:
- Hekim enerjisi saniyede `ENERGY_DRAIN_L1` / `ENERGY_DRAIN_L2` azalır. Mod kapalıyken enerji saniyede `ENERGY_RECOVER` dolar.
- Enerjisi 0 olan hekim tükenir ve ayrılır. Bildirim: "Bir hekim tükendi, sistemden ayrıldı." Skordan `BURNOUT_PENALTY` düşer.
- Her tedavi `COMPLICATION_L1` / `COMPLICATION_L2` ihtimalle başarısız olur. Başarısız hasta `COMPLICATION_RETURN_YEARS` yıl sonra **"ağır hasta"** olarak geri döner; tedavi süresi 2 katıdır.
- Üst barda iki sayaç yan yana durur: **"Randevu/saat"** (Hızlı Modda fırlar) ve **"Tamamlanan tedavi"** (az artar). Aradaki fark açıkça görünmeli.
- İlk komplikasyon dalgasında bildirim: **"Kısalan randevu, geri dönen hasta demek."**

Tasarım hedefi: Hızlı Modu sürekli açık tutan oyuncu tükenmişlik ve komplikasyon dalgasıyla erken çöker. Sadece kriz anlarında kısa süre açan oyuncu daha uzun dayanır.

## 9. Skor

```
Skor = dayanılan yıl × 1000
     + tamamlanan tedavi × 10
     − (yurt dışına giden + tükenen hekim) × 50
```

- Seans tekrarları ve komplikasyonla geri dönen hastalar "tamamlanan tedavi" sayılmaz. Tedavi yalnızca son seans başarıyla bittiğinde sayılır.
- En iyi skor `localStorage`'da saklanır (try/catch ile; erişilemezse sessizce atlanır).

## 10. Çöküş ve final ekranı

### Çöküş anı
Oyun donar, ekran hafifçe kararır ve ortaya büyük, ağır bir animasyonla **IRREVERSIBILIS** yazısı düşer. Altında: "Sistem X. yılda geri dönüşü olmayan noktaya ulaştı." ve çöküş nedeni ("Bekleme alanı doldu" / "Hastalar bekleyemedi"). 2–3 sn sonra final ekranına geçilir.

### Final ekranı (yukarıdan aşağıya)
1. Özet kart: üretilen mezun, atanan, bekleyen, yurt dışına giden, tükenen, tamamlanan tedavi, skor, en iyi skor.
2. Hızlı Mod Seviye 2 kullanıldıysa: "Randevuyu 10 dakikaya indirdin. Kuyruk kısalmadı, hekimin tükendi."
3. "Bu sistemde en iyi strateji bile ~`BEST_POSSIBLE_YEAR`. yılda çöküyor. Çünkü sorun yönetim değil, kadro."
4. Ana mesaj, büyük puntoyla: **"Bu kapıyı oyun açamaz. İmza açar."**
5. İsmin açıklaması, küçük ve sade: "*Pulpitis reversibilis:* diş sinirindeki iltihabın erken, geri döndürülebilir evresi. Geç kalınırsa *irreversibilis* olur."
6. Çağrı: "**Gerçekte durum hâlâ reversibilis.** Yılbaşına kadar en az 10 bin diş hekimi ataması için imza ver."
7. Butonlar: **İmza ver** (`SIGNATURE_URL`, yeni sekmede — en belirgin buton), **Skorunu paylaş**, **Tekrar oyna**.
8. Görsel olarak net ayrılmış **"Gerçek rakamlar"** kutusu (bkz. bölüm 15):
   - `REAL_DATA` içinden en fazla 3 madde gösterilir: oyunda olan şeye göre seçilir (etiketlere göre, aşağıdaki kural), kalan yer `genel` etiketlilerle doldurulur.
   - Seçim kuralı: çöküş bekleme alanından olduysa `kapi`; hasta sabrından olduysa `hasta`; Hızlı Mod kullanıldıysa `hizli`; en az 1 hekim yurt dışına gittiyse `yurtdisi` etiketli maddeye öncelik ver.
   - Her maddenin altında kaynağı yazar.
   - Kutunun altında: "Tüm rakamlar →" linki (`DATA_URL`, yeni sekmede) ve küçük not: "Oyundaki sayılar ölçeklidir ve kurgusaldır."

### Paylaşım kartı
- Canvas'tan 1080×1350 PNG üretilir: **Reversibilis** başlığı, dayanılan yıl, skor, "IRREVERSIBILIS" damgası, kısa mesaj, `reversibilis.com` ve `SHARE_TAG`.
- Paylaşım metni (`SHARE_TEXT`, `{yil}` yer tutucusuyla): "Reversibilis'te {yil} yıl dayanabildim. Sen kaç yıl dayanırsın? reversibilis.com #DişHekimliğine10BinAtama"
- Mobilde Web Share API ile paylaşılır (dosya paylaşımı destekleniyorsa görselle, değilse metin + link). Desteklenmiyorsa PNG indirilir ve paylaşım metni panoya kopyalanır.

## 11. Diğer teknik gereksinimler

- `<title>`: "Reversibilis". `<html lang="tr">`.
- Open Graph / Twitter kart etiketleri:
  - `og:title` "Reversibilis", `og:description` "Kaç yıl dayanabilirsin?", `og:url` https://reversibilis.com, `og:locale` tr_TR, `twitter:card` summary_large_image.
  - 1200×630 önizleme görseli (`public/og.png`): koyu zemin, büyük "Reversibilis", altında "Kaç yıl dayanabilirsin?". Konuyu açık etmeyen, merak uyandıran bir görsel.
- `canonical` → https://reversibilis.com.
- Favicon: basit, soyut bir diş/kapı ikonu (kendin çiz, telifli ikon kullanma).
- Sesler opsiyonel; varsayılan kapalı, tek dokunuşla açılır/kapanır.
- Sekme arka plana geçince (`visibilitychange`) oyun duraklar.
- Hata ayıklama paneli (`?debug=1`): oyun hızı ×1/×5, bütçe ekle, yıl atla, anında çöküş.
- Gizlilik dostu ziyaret ve "İmza ver" tıklama sayımı için yer tutucu (v1'de kapalı: `ANALYTICS_ENABLED = false`).
- Harici siteden çalışma anında veri çekilmez (bkz. bölüm 0).

## 12. Başlangıç dengeleme değerleri (`balance.ts`)

Bunlar kaba başlangıç değerleridir; bölüm 13'teki simülasyonla ayarlanacak.

```ts
export const BALANCE = {
  YEAR_SECONDS: 30,
  GRADS_PER_FACULTY: 4,             // yıllık
  MAX_PLAYER_FACULTIES: 3,
  AUTO_FACULTY_FROM_YEAR: 4,        // bu yıldan itibaren her yıl +1 fakülte
  WAIT_CAPACITY: 40,

  GATE_QUOTA_START: 6,              // yıllık
  GATE_QUOTA_DROP_EVERY_YEARS: 3,   // her 3 yılda 1 azalır
  GATE_QUOTA_MIN: 3,                // asla artmaz

  HOSPITAL_COUNT: 4,
  HOSPITAL_WEIGHTS: [0.1, 0.2, 0.3, 0.4], // Merkez, Sahil, Ova, Dağ İlçesi
  QUEUE_START_PER_HOSPITAL: 12,
  QUEUE_CAPACITY_PER_HOSPITAL: 25,
  PATIENT_RATE_START: 0.6,          // saniyede, tüm hastaneler toplam
  PATIENT_RATE_GROWTH: 0.3,         // yıllık bileşik artış

  TREAT_TIME_NORMAL: 8,             // sn / hasta
  TREAT_TIME_L1: 4,
  SESSION_TIME_L2: 1.3,             // sn / seans, 3 seans

  ENERGY_DRAIN_L1: 4,               // % / sn
  ENERGY_DRAIN_L2: 8,
  ENERGY_RECOVER: 3,
  COMPLICATION_L1: 0.10,
  COMPLICATION_L2: 0.25,
  COMPLICATION_RETURN_YEARS: 2,

  DUS_COUNT: 6,
  DUS_RETURN_YEARS: 3,
  PRIVATE_CAPACITY: 12,
  ABROAD_COUNT: 5,
  ABROAD_PENALTY: 50,
  BURNOUT_PENALTY: 50,

  INCOME_PER_TREATMENT: 5,
  INCOME_PER_YEAR: 100,
  BEST_POSSIBLE_YEAR: 12,           // simülasyondan sonra güncelle
};
```

Hedef denge:
- Hiç araç kullanmayan oyuncu ~5–6. yılda çöker.
- Hızlı Modu hep açık tutan oyuncu daha da erken çöker.
- İyi oyuncu ~10–12. yıla kadar dayanır.
- Hiçbir strateji sonsuza kadar dayanamaz.

## 13. Geliştirme aşamaları

1. **İskelet:** `reversibilis-web-client` adıyla Vite + TS + Phaser projesi, dikey ölçekleme, Başlık / Oyun / Final sahneleri, `balance.ts`, `texts.ts`, debug paneli.
2. **Çekirdek döngü:** fakülte → bant → kapı → bekleme alanı → hastaneler; hasta kuyrukları, hekim tedavisi, azalan kapı kotası, iki çöküş barı, basit final ekranı. Görseller bu aşamada basit kutular olabilir.
3. **Ekonomi:** bütçe, yükseltmeler, otomatik fakülte açılışı, kilitli "Kadro artır".
4. **Beceri araçları** (bölüm 7).
5. **Verimlilik hattı ve Hızlı Mod** (bölüm 8).
6. **Skor, IRREVERSIBILIS çöküş anı, final ekranı, gerçek rakamlar kutusu, paylaşım kartı, imza linki** (bölüm 9–10).
7. **Denge simülasyonu:** Oyun mantığını görselden ayrı tut ki başsız (headless) çalışabilsin. `npm run sim` ile üç bot stratejisini (araç kullanmayan / Hızlı Mod hep açık / akıllı) yüzlerce kez oynat, her birinin ortalama kaçıncı yılda çöktüğünü yazdır. Değerleri hedef dengeye göre ayarla ve `BEST_POSSIBLE_YEAR`'ı güncelle.
8. **Cila:** animasyonlar, eğitim balonları, OG etiketleri ve görseli, favicon, ses, orta seviye telefonda performans testi.
9. **Yayın:** `npm run build` ile statik çıktı. README'ye şunları yaz: projeyi Cloudflare Pages (veya Netlify) üzerinde yayına alma, **reversibilis.com** alan adını bağlama (DNS ayarları), `www.reversibilis.com` → `reversibilis.com` yönlendirmesi, HTTPS'in açık olduğunu doğrulama.

## 14. Kabul kriterleri

- iPhone Safari ve Android Chrome'da dikey modda; PC'de Chrome, Firefox ve Safari'de sorunsuz çalışır.
- Orta seviye bir telefonda akıcıdır (hedef 60 fps).
- Ortalama bir oyun 5–8 dakika sürer.
- Ekranda, sekme başlığında, OG etiketlerinde ve paylaşım kartında ad her zaman "Reversibilis"tir; "reversibilis-web-client" hiçbir kullanıcı arayüzünde görünmez.
- Tüm metinler ve linkler `texts.ts`'ten, tüm sayılar `balance.ts`'ten gelir.
- "Kadro artır" hiçbir yolla açılamaz; kapı kotası hiçbir zaman artmaz.
- "İmza ver" butonu https://10binatama.com/ adresini yeni sekmede açar.
- Oyun çalışırken hiçbir harici siteden veri çekmez.

## 15. `texts.ts` — linkler ve gerçek rakamlar

Aşağıdaki değerleri `texts.ts`'e aynen koy. Gerçek rakamlar kampanya sitesinden (10binatama.com, Ekim 2026) alınmıştır; kampanya sahibi yayından önce kontrol edecek.

```ts
export const GAME_TITLE = "Reversibilis";
export const SITE_URL = "https://reversibilis.com";
export const SIGNATURE_URL = "https://10binatama.com/";
export const DATA_URL = "https://10binatama.com/#rakamlar";
export const CAMPAIGN_NAME = "Diş Hekimliğine 10 Bin Atama";
export const SHARE_TAG = "#DişHekimliğine10BinAtama";
export const SHARE_TEXT =
  "Reversibilis'te {yil} yıl dayanabildim. Sen kaç yıl dayanırsın? reversibilis.com #DişHekimliğine10BinAtama";

type RealData = { text: string; source: string; tags: string[] };

export const REAL_DATA: RealData[] = [
  {
    text: "Son 8 yılda diş hekimliği fakültelerinin kontenjanı %151 arttı.",
    source: "10binatama.com",
    tags: ["kapi", "genel"],
  },
  {
    text: "Bakanlığa bağlı ağız-diş sağlığı birimleri için açılan kadro 2022'de 948 iken 2026'da 521'e düştü.",
    source: "10binatama.com",
    tags: ["kapi", "genel"],
  },
  {
    text: "10 binden fazla genç diş hekimi atama bekliyor.",
    source: "10binatama.com",
    tags: ["kapi", "genel"],
  },
  {
    text: "Odalara kayıtlı diş hekimleri arasında çalışmayanların oranı 2004'te %4,4 iken 2024'te %13,6'ya çıktı.",
    source: "TDB (10binatama.com üzerinden)",
    tags: ["kapi"],
  },
  {
    text: "Kamudaki ağız-diş sağlığı birimlerine yıllık başvuru 2002'de yaklaşık 5,5 milyondu, 2022'de 53 milyonu aştı.",
    source: "Sağlık Bakanlığı (10binatama.com üzerinden)",
    tags: ["hasta", "genel"],
  },
  {
    text: "Bir diş hekimine düşen hasta sayısı 2024'te Şişli'de 250, Siirt Pervari'de 27.407 idi.",
    source: "10binatama.com",
    tags: ["hasta"],
  },
  {
    text: "Kamuda bir diş hekimi yılda 4 binden fazla hastaya bakıyor; muayene ve tedaviler 15–20, hatta 5–10 dakikaya sıkıştırılıyor.",
    source: "10binatama.com",
    tags: ["hizli", "hasta"],
  },
  {
    text: "Yurt dışında çalışmak için alınan İyi Hal Belgesi sayısı 2014'te 3 iken 2025'te 400'e yaklaştı.",
    source: "Meslek örgütü verileri (10binatama.com üzerinden)",
    tags: ["yurtdisi"],
  },
];
```
