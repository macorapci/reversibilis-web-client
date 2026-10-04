# Reversibilis — Oyun Tasarım ve Geliştirme Dokümanı (v2)

> Bu dosya Claude Code için yazıldı. Oyunu bu dokümana göre, bölüm 17'deki "Geliştirme aşamaları" sırasıyla geliştir. Her aşamanın sonunda oyun tarayıcıda çalışır durumda olsun. Bir sonraki aşamaya geçmeden dur ve neyin hazır olduğunu kısaca özetle.

## 0. Kimlik

| | |
|---|---|
| Proje / repo / `package.json` adı | `reversibilis-web-client` |
| Ekranda görünen ad (her yerde) | **Reversibilis** (`GAME_TITLE`) |
| Alan adı | https://reversibilis.com |
| İmza linki | https://10binatama.com/ |
| Kampanya | Diş Hekimliğine 10 Bin Atama — `#DişHekimliğine10BinAtama` |

- `reversibilis-web-client` yalnızca teknik addır (klasör, repo, paket). Oyun ekranında, sayfa başlığında, OG etiketlerinde ve paylaşım kartında **hiçbir zaman** görünmez; bunların hepsinde `GAME_TITLE` kullanılır.
- Kampanya sitesinden canlı veri (imza sayısı vb.) **çekilmez**. Oyun çalışırken hiçbir harici siteden veri çekmez. Kampanyayla tek bağlantı "İmza ver" linkidir.

### İsmin anlamı
*Pulpitis reversibilis*: diş sinirindeki iltihabın erken, geri döndürülebilir evresi; basit bir tedaviyle kurtarılır. Geç kalınırsa *irreversibilis* olur ve kanal tedavisi gerekir. Oyunda kuyrukta bekleyen her hastanın dişi zamanla reversibilis'ten irreversibilis'e geçer: **isim, mekaniğin kendisidir.** Sistem çöktüğünde ekrana IRREVERSIBILIS düşer; sonuç ekranı gerçek hayatta durumun hâlâ reversibilis olduğunu söyleyip imzaya yönlendirir.

## 1. Oyunun özü

**"Teknoloji hızlandırır, ama hastayı hekim kurtarır."**

Tür: idle / artımlı yönetim oyunu. Oyuncu 1940'tan başlayarak ülkenin kamusal ağız-diş sağlığı sistemini yönetir. Nüfus ve talep gerçek verilere oturur. Oyuncu hastane, ekipman, yapay zeka gibi her şeyi geliştirebilir; ama hekim sayısını değiştiremez. Hekim yalnızca atamayla gelir.

Değişmez temel kurallar:
1. **Gerçek takvim:** Oyun 1940'ta başlar; nüfus ve kamu diş başvuruları gerçek verilere göre ilerler.
2. **Bekleyen diş kötüleşir:** Kuyrukta bekleyen hasta evre atlar; ağırlaşan hasta daha çok seans ve daha pahalı, ithal malzeme ister. Küçük bir kapasite açığı kendi kendini büyüten bir sarmala dönüşür.
3. **Sonsuz yükseltme, azalan getiri:** Yükseltmelerin maksimum seviyesi yoktur. Her seviye bir öncekinin **3 katı** pahalıdır ve etkisi **2 katın altındadır**.
4. **Hekim satın alınamaz:** Yükseltme listesinde "Kadro artır" her zaman kilitlidir.
5. **Herkes çöker:** Kuyruk limiti aşılınca sistem çöker. İyi oyuncu daha geç çöker.

Hedef: 5–8 dakikalık, telefonda tek elle oynanabilen, sonucu paylaşılabilir bir web oyunu.

## 2. Platform ve teknoloji

- Tarayıcıda çalışan statik web oyunu. Kurulum yok, sunucu yok.
- **Vite + TypeScript.** Arayüz HTML/CSS (DOM) ile yapılır. Kuyruk görseli, küçük efektler ve sonuç grafiği tek bir `<canvas>` (Canvas 2D) ile çizilir. Oyun motoru ve grafik kütüphanesi gerekmez; idle oyun çoğunlukla panellerden ve sayılardan oluşur.
- **Mobil öncelikli, dikey tasarım.** PC'de en fazla 480 px genişliğinde, ortalanmış bir kart olarak görünür. Tüm etkileşimler tek dokunuşla yapılır.
- **Simülasyon saf TypeScript modülüdür** (`src/sim/`): arayüzden bağımsız, deterministik (tohumlu rastgele sayı üreteci), aylık adımlarla çalışır. Aynı modül üç yerde kullanılır: oyunun kendisi, `npm run sim` bot testleri ve sonuç ekranındaki "Atama yapılsaydı" yeniden oynatması.
- Dosyalar:
  - `src/config/balance.ts` — tüm dengeleme sayıları
  - `src/config/data.ts` — gerçek veriler (nüfus tablosu, çapa değerleri)
  - `src/config/texts.ts` — tüm metinler, linkler, kamusal durum verileri (Türkçe)
- Sayılar Türkçe biçimde gösterilir: `1.234.567`; büyük sayılar "1,2 milyon", "3,4 milyar".
- Türkçe karakterleri destekleyen bir web fontu (ör. Google Fonts "Nunito" veya "Inter").
- Toplam boyut hedefi < 2 MB. Görseller basit vektör/şekil. Telifli görsel, karakter veya logo kullanılmaz.
- **Resmî kurum logosu, amblemi ya da resmî görünümlü tasarım KULLANILMAZ.** Kampanyayı yürüten topluluğun logosu da yalnızca izin alınırsa eklenir (v1'de yok).

## 3. Gerçek veri ve model ayrımı

Kural: `balance.ts` ve `data.ts`'teki her değerin yanında yorum olarak **`[GERÇEK]`** (kaynağıyla) ya da **`[MODEL]`** etiketi bulunur. **Dengeleme yalnızca `[MODEL]` değerleri değiştirilerek yapılır; `[GERÇEK]` değerlere dokunulmaz.**

### Gerçek çapa değerleri

| Veri | Değer | Kaynak |
|---|---|---|
| Nüfus sayımları 1940–2020 | bölüm 15'teki tablo | TÜİK sayımları |
| Nüfus 2025 | 86.092.168; yıllık artış ‰5 | TÜİK ADNKS 2025 |
| Kamu ağız-diş birimlerine yıllık başvuru | 2002: 5.462.923 · 2022: 53.261.198 | Sağlık Bakanlığı (10binatama.com üzerinden) |
| Kamuda hekim başına yıllık hasta | 4.000'den fazla | 10binatama.com |
| Sağlık Bakanlığı'nda çalışan diş hekimi | 2015: 8.683 · 2023: 12.774 | Ankara Üniversitesi açık ders notları (2015); Sağlık Düşüncesi ve Tıp Kültürü Dergisi (1 Aralık 2023 verisi) |
| Açılan kadro | 2022: 948 · 2026: 521 | 10binatama.com |
| Yataklı tedavi kurumu | 1923: 86 · 1925: 167 · 1945: 198 | Sağlık Düşüncesi ve Tıp Kültürü Dergisi |
| Diş hekimine yalnızca şikâyet olunca gidenler | yaş gruplarına göre %84,2–94,9 | 10binatama.com |
| Ülkenin ikinci diş hekimliği okulu | 1963 (Ankara) | Bilkent Üniversitesi arşivi |
| Diş hekimliği fakültesi sayısı | 2002: 19 · 2023: 105 | TDB İnsangücü Planlaması 2023 |

### Model (tahmin) değerleri
1940 kamu diş hekimi sayısı, 1940 hastane sayısı (1945'teki 198'e dayanarak 190), 2002 öncesi başvuru oranı, 2022 sonrası talep tavanı, evre geçiş süreleri, geliş karışımı, hekim ayrılma oranı ve tüm ekonomi değerleri.

**2026 sonrası her şey tahmindir.** Arayüzde 2027'den itibaren yıl göstergesinin yanında küçük bir "tahmin" etiketi görünür.

## 4. Takvim ve hız

- Başlangıç: Ocak 1940. Simülasyon **aylık** adımlarla ilerler (yılda 12 adım).
- Dönem hızları (`ERA_SPEEDS`):

| Dönem | Gerçek süre / oyun yılı | Toplam |
|---|---|---|
| 1940–1979 | 1,2 sn | ~48 sn |
| 1980–1999 | 2 sn | ~40 sn |
| 2000–2026 | 5 sn | ~2 dk 15 sn |
| 2027 ve sonrası | 6 sn | çöküşe kadar |

- Hedef: oyuncu bugüne (2026) ~3,5–4 dakikada gelir; çöküş 2015–2040 arasında olur; oyun 5–8 dakika sürer.
- Arayüzde ×1 / ×2 hız düğmesi. Sekme arka plana geçince (`visibilitychange`) oyun duraklar.
- Simülasyon ufku 2070'tir (sonuç ekranındaki yeniden oynatma için).

## 5. Simülasyon modeli

**Toplu (aggregate) model:** Milyonlarca hasta tek tek değil, beş evre kovasında sayı olarak tutulur. Ekrandaki hasta ikonları bu kovaların oranlarını gösteren temsili bir örneklemdir (~40 ikon).

### 5.1 Nüfus
- Varsayılan `POPULATION_MODE = "census"`: bölüm 15'teki sayım tablosu kullanılır; noktalar arası geometrik (bileşik büyüme) ara değerleme yapılır. 2025 sonrası yıllık ‰5 artış (son gerçek değer, sonrası `[MODEL]` varsayım).
- Alternatif `POPULATION_MODE = "average"`: nüfus = 17.820.950 × 1,0187^(yıl − 1940). Bu oran 1940–2025 gerçek ortalamasıdır ve 2025'te gerçek değere tam oturur. 2025 sonrası yine ‰5.

### 5.2 Talep
- Yıllık talep (seans) = nüfus × başvuru oranı(yıl).
- Başvuru oranı çapaları `[GERÇEK]`: oran(2002) = 5.462.923 / nüfus(2002), oran(2022) = 53.261.198 / nüfus(2022). İkisi arası geometrik ara değerleme.
- 1940–2002 `[MODEL]`: `VISIT_RATE_1940`'tan oran(2002)'ye geometrik.
- 2022 sonrası `[MODEL]`: `VISIT_RATE_CAP` tavanına yaklaşan lojistik eğri. Başlangıç eğimi, 2002–2022 arasındaki kişi başı yıllık artış hızına (g) eşittir:
  `oran(t) = cap / (1 + (cap/oran2022 − 1) · e^(−k·(t − 2022)))`, `k = g / (1 − oran2022/cap)`.
- Aylık gelen hasta sayısı = (yıllık talep / 12) / o anki geliş karışımının ortalama seans ihtiyacı. Böylece **seans cinsinden talep gerçek başvuru sayısına eşit olur.**
- Gerçekçilik kontrolü: `npm run sim` çıktısı 2002 ve 2022 talebini yazdırır ve gerçek çapalarla karşılaştırır.

### 5.3 Evreler

| Evre | Ad | Tedavi | Seans | Malzeme (bütçe) |
|---|---|---|---|---|
| 1 | Başlangıç çürüğü | Flor, fissür örtücü | 0,5 | çok düşük |
| 2 | Çürük | Dolgu | 1 | düşük |
| 3 | Pulpitis reversibilis | Derin dolgu | 1,5 | düşük |
| 4 | Pulpitis irreversibilis | Kanal tedavisi | 3 | orta |
| 5 | Diş kaybı | Çekim + implant/protez | 6 | yüksek, **ithal malzeme** |

- **Geliş karışımı:** Hastaların çoğu geç gelir (`ARRIVAL_MIX_BASE`); gerçekte insanların %84–95'i diş hekimine yalnızca şikâyeti olunca gidiyor. Koruyucu program (bölüm 6.2) karışımı zamanla erken evrelere kaydırır.
- **İlerleme:** Her ay, tedavi edilmeden bekleyen hastaların `1 / STAGE_PROGRESS_MONTHS` kadarı bir sonraki evreye geçer (evre 5 hariç). Yapay zeka seviyeleri bu hızı yavaşlatır.
- Evre 4'e geçen hastanın ikonunda **IRREVERSIBILIS** etiketi görünür.
- Evre 5'e bekleme yüzünden geçen her hasta **"bekleme yüzünden kaybedilen diş"** sayacına eklenir.
- İkon renkleri: evre 1 yeşil, 2 açık yeşil, 3 sarı, 4 turuncu, 5 kırmızı.

### 5.4 Kapasite
```
aylık kapasite (seans) = min(hekim, koltuk)
                       × SESSIONS_PER_DENTIST_YEAR / 12
                       × hız çarpanı (ekipman × yapay zeka × kısa randevu)
                       × (1 − koruyucu program payı)
                       × olay çarpanı
```
`SESSIONS_PER_DENTIST_YEAR = 4000` `[GERÇEK]` — bugünkü aşırı yüklü kamu temposu. Bu ölçekle 2022–2023'te kamu kapasitesi (~12–13 bin hekim × 4.000 ≈ 50 milyon) gerçek talebe (53 milyon) çok yakındır: **sistem bugün tam sınırdadır.** Model bunu kendiliğinden üretmelidir.

### 5.5 Tedavi ve triyaj
Her ay kapasite, triyaj anahtarına göre kovalara dağıtılır:
- **Sırayla:** kovalara büyüklükleriyle orantılı.
- **Ağır vaka önce:** 5 → 4 → 3 → 2 → 1.
- **Hafif vaka önce:** 1 → 2 → 3 → 4 → 5.

Tedavi edilen her hasta kendi evresinin seans sayısı kadar kapasite kullanır. Evre 5 tedavisi ayrıca bütçeden ithal malzeme parası ister; bütçe yetmezse o hastalar beklemeye devam eder ve ekranda "Malzeme bekleniyor" uyarısı çıkar.

**Kısa randevu komplikasyonu:** Kısa randevu seviyesi > 0 ise tedavi edilenlerin `komplikasyon oranı` kadarı 2 ay sonra **bir üst evrede** kuyruğa geri döner ve "tamamlanan tedavi" sayılmaz.

### 5.6 Hekim
- 1940: `DENTISTS_START` `[MODEL]` — gerçek sayı teyit edilince güncellenecek.
- 1940 → 2015: 8.683'e geometrik ara değerleme; 2015 → 2023: 12.774'e geometrik `[GERÇEK çapalar]`.
- 2024 ve sonrası: `hekim(yıl+1) = hekim(yıl) × (1 − ATTRITION_RATE) + atama(yıl)`.
  - atama 2024–2026: 948'den 521'e doğrusal (`[MODEL]` ara değerler, uç noktalar `[GERÇEK]`).
  - atama 2027+: 521 sabit (son gerçek değer, sonrası `[MODEL]` varsayım).
- Oyuncu hekim sayısını hiçbir şekilde etkileyemez.

### 5.7 Hastane, koltuk ve kuyruk limiti
- `HOSPITALS_START = 190` `[MODEL]`. Koltuk = hastane × `SEATS_PER_HOSPITAL`.
- **Koltuk < hekim:** fazla hekimler çalışamaz; ekranda "Koltuk bekleyen hekim: N". Erken oyunda hastane almanın sebebi budur.
- **Koltuk > hekim:** ekranda **"Boş koltuk: N"** sayacı büyür. Geç oyunun sessiz mesajı: altyapı var, hekim yok.
- Kuyruk limiti = hastane × `QUEUE_PER_HOSPITAL`.

### 5.8 Bütçe
- Gelir: tamamlanan seans × `INCOME_PER_SESSION` × memnuniyet çarpanı (0,5 + 0,5 × memnuniyet / 100) + dokunuş geliri.
- Gider: tedavi malzemesi (hasta başına `STAGE_MATERIAL_REL[evre]` × `INCOME_PER_SESSION` × `MATERIAL_PRICE_MULT`; evre 5'teki ithal malzeme en büyük kalemdir, `MATERIAL_PRICE_MULT` olaylarla artar) ve yükseltmeler.

### 5.9 Memnuniyet (0–100)
```
hedef = 100
      − WAIT_PENALTY  × ortalama bekleme (ay)
      − LOSS_PENALTY  × (son 12 ayda bekleme yüzünden kaybedilen diş / son 12 ayda tedavi edilen)
      − SHORT_PENALTY × kısa randevu seviyesi
```
0–100 arasına sıkıştırılır; her ay hedefe %20 yaklaşır.
Ortalama bekleme (ay) = kuyruktaki toplam seans ihtiyacı / aylık kapasite. Arayüzde hafta olarak gösterilir.

### 5.10 Çöküş
Kuyruktaki hasta sayısı kuyruk limitini aşınca sistem çöker.

## 6. Oyuncu kararları

### 6.1 Triyaj anahtarı (3'lü)

| Seçenek | Kazanç | Bedel |
|---|---|---|
| Sırayla | Dengeli | Krizde ağır vakalar birikir |
| Ağır vaka önce | Diş kurtarır, implanta gidişi azaltır | Kuyruk sayısı daha hızlı büyür |
| Hafif vaka önce | Tedavi sayısı ve kısa vadeli memnuniyet uçar | Ağır vakalar implanta gider; malzeme gideri patlar |

### 6.2 Koruyucu program
Seçenekler: Kapalı / %10 / %20 / %30 (hekim zamanının taramaya ayrılan payı).
- Bedel: o pay kadar kapasite hemen düşer.
- Etki: geliş karışımı, programın 5 yıllık hareketli ortalamasıyla orantılı olarak `ARRIVAL_MIX_PREVENTIVE`'e doğru kayar (tam etki %30'da).
- Tasarım hedefi: erken açan oyuncu uzun vadede kazanır. Sarmal başladıktan sonra açmak kuyruğu kısa vadede daha da büyütür, yani zamanlama beceri ister.

### 6.3 Yükseltme hatları
Hepsi sonsuz seviyeli. Fiyat = taban fiyat × 3^seviye. Her seviyenin etkisi 2 katın altındadır.

| Hat | Etki / seviye | Açılış | Not |
|---|---|---|---|
| **Hastane ağı** | hastane ×1,5 (koltuk ve kuyruk limiti) | 1940 | |
| **Teknolojik ekipman** | hız ×1,6 | 1940 | Seviye adları döneme bağlıdır (aşağıda) |
| **Yapay zeka** | hız ×1,3 ve evre ilerlemesi ×0,9 | 2015 | Seviye adları: röntgen okuma, randevu planlama, çürük tespiti, risk tahmini, sonra "Yapay zeka Sv. N" |
| **Kısa randevu** | hız ×1,8; komplikasyon +%8 (en fazla %60); memnuniyet cezası | 1940 | Panik düğmesi |
| **Kadro artır** | hekim ×2 | — | **Her zaman kilitli.** Dokununca: "Bu yükseltme senin elinde değil." |

Ekipman seviye adları ve en erken alınabileceği yıl (`EQUIPMENT_LEVELS`): Elektrikli tur (1940) → Hava türbinli tur (1960) → Panoramik röntgen (1975) → Dijital röntgen (1995) → Döner kanal aletleri (2000) → İntraoral tarayıcı (2010) → CAD/CAM (2012) → Lazer (2015) → 3B görüntüleme (2018) → sonrasında "Ekipman Sv. N" (2020+). Yılı gelmemiş seviye kilitli görünür ("1975'te açılır").

### 6.4 Dokunuş (erken oyun)
Kuyruk paneline dokunmak küçük bir ek tedavi ve bütçe kazandırır. 1940–1979 arasında belirgindir, sonra önemsizleşir. Oyuncu tıklama oyunu gibi başlar, yükseltmelerle "artık dokunmama gerek yok" noktasına gelir.

## 7. Olaylar, bildirimler ve hasta yorumları

- **Tarihsel bildirimler** (`HISTORY_EVENTS`, bölüm 19): üstten kısa süreli kart olarak çıkar, oyunu durdurmaz.
- **2020 salgını:** Mart–Mayıs 2020 arası kapasite %20'ye düşer (olay `[GERÇEK]`, etki `[MODEL]`). Bildirim: "Salgın: randevular durdu."
- **Malzeme fiyatları arttı** (rastgele, 1980 sonrası ortalama 8 yılda bir): `MATERIAL_PRICE_MULT` ×1,3 kalıcı.
- **Okul tarama haftası** (koruyucu program açıksa, yılda %30 şans): evre 1–2 kuyruğunun %30'u anında tedavi edilir.
- **Hasta yorumları akışı:** Ekranda tek satır kayan yorumlar; oyunun durumuna göre seçilir (bölüm 19, `PATIENT_COMMENTS`). Oyunun duygusal göstergesidir.

## 8. Ekran düzeni (dikey, yukarıdan aşağıya)

1. **Üst bar:** büyük Yıl (2027'den sonra "tahmin" etiketi), Nüfus, Bütçe, Memnuniyet (yüz ikonu + %).
2. **Kuyruk paneli:** renkli hasta ikonları örneklemi (IRREVERSIBILIS etiketleriyle), "Kuyruk: 1,2 milyon / 1,9 milyon" limit barı, "Ortalama bekleme: 7 hafta".
3. **Kapasite satırı:** Hekim · Koltuk · Boş koltuk (veya koltuk bekleyen hekim) · Talep / kapasite oranı.
4. **Hasta yorumları** (tek satır, kayan).
5. **Ayarlar:** Triyaj anahtarı, Koruyucu program.
6. **Yükseltme listesi** (kaydırılabilir kartlar): ad, seviye, sonraki seviyenin adı ve etkisi, fiyat. Kilitli "Kadro artır" kartı listede hep görünür.
7. Hız (×1/×2) ve ses düğmeleri.

## 9. Oyun akışı (dönemler)

1. **Başlık ekranı:** Büyük **Reversibilis**, altında "1940'tan başla. Kaça kadar dayanabilirsin?" ve "Başla". Konu bu ekranda açıklanmaz.
2. **Görev (~10 sn):** "Görevin: ülkenin ağız-diş sağlığını yönetmek. Hastalar bekledikçe dişleri kötüleşir." Ardından 3 adımlık ipucu balonları (kuyruk, yükseltmeler, triyaj).
3. **1940–1979, Kuruluş:** Az hasta, az hekim. Oyuncu dokunarak tedavi eder, ilk hastaneleri ve ekipmanı alır. Tarihsel bildirimler akar. Rahat ve öğretici.
4. **1980–1999, Büyüme:** Nüfus hızla artar. Yükseltmeler oyunu kendi kendine akar hale getirir. Sayılar uçar.
5. **2000–2026, Patlama:** Başvurular katlanır, kuyruk büyümeye başlar, hastalar evre atlar, ilk IRREVERSIBILIS etiketleri görünür. 2020 salgını kuyruğu biriktirir. Kadro bildirimleri gelir. Oyuncu triyaj, koruyucu program ve yükseltmelerle mücadele eder.
6. **2027+, Tahmin:** Atama sınırlı, fiyatlar ×3. Kötüleşme ve bütçe sarmalları birleşir. Kuyruk limiti aşılır: **IRREVERSIBILIS**.

## 10. Skor

- Ana gösterge: **çöküş yılı** ("Sistemi 2031'e kadar taşıdın").
- İkincil gösterge: **diş kurtarma oranı** = tedavi edilen hastalar içinde evre 5'e gitmeden tedavi edilenlerin oranı.
- Tek sayı (sıralama için): `SKOR = (çöküş yılı − 1940) × 1000 + round(kurtarma oranı × 1000)`.
- En iyi skor `localStorage`'da saklanır (try/catch ile; erişilemezse sessizce atlanır).

## 11. Çöküş anı ve sonuç ekranı

### 11.1 Çöküş anı
Oyun donar, ekran hafifçe kararır, ortaya büyük ve ağır bir animasyonla **IRREVERSIBILIS** düşer. Altında: "Sistem 2031'de geri dönüşü olmayan noktaya ulaştı." 2–3 sn sonra sonuç ekranına geçilir.

### 11.2 Sonuç ekranı (dikey kaydırmalı, yukarıdan aşağıya)

**1. Senin oyunun** — kart ızgarası:
- Çöküş yılı ve skor (en iyi skorla birlikte)
- Tedavi edilen hasta
- Kurtarılan diş / bekleme yüzünden kaybedilen diş
- İthal malzemeye giden bütçe
- En uzun ortalama bekleme (hafta)
- Son memnuniyet
- Boş koltuk sayısı

**2. "Atama yapılsaydı" grafiği**
- Arka planda, oyuncunun **kendi karar kaydı** (yükseltme alımları, triyaj ve koruyucu değişiklikleri, ay damgasıyla) aynı tohumla 1940'tan yeniden oynatılır. Tek fark: **Ocak 2026'da +10.000 hekim ve +10.000 koltuk** eklenir (kampanyanın talebi: 10 bin atama ve atanan her hekime bir ünit).
- Oyuncunun kaydı bittikten sonra yeniden oynatma son ayarlarla devam eder, yeni yükseltme almaz (temkinli varsayım). Ufuk 2070.
- Grafik: x = yıl, y = memnuniyet (%). Düz çizgi "Senin oyunun" (çöküş noktası IRREVERSIBILIS işaretiyle), kesikli çizgi "2026'da 10 bin atama yapılsaydı".
- Altında: "Aynı kararlarla, 10 bin atama yapılsaydı sistem {yıl}'e kadar dayanırdı." (2070'e kadar çökmezse: "2070'e kadar çökmezdi.")
- Ardından: "Bu modelde en iyi strateji bile ~`BEST_POSSIBLE_YEAR`'te çöküyor. Sorun yönetim değil, kadro."
- Grafik, en fazla ~200 ms sürecek başsız simülasyonla hesaplanır; gerekirse bir sonraki karede çizilir.

**3. "Oyunda yaşadıkların, gerçekte yaşanıyor" (kamusal durum)**
- `PUBLIC_ISSUES` (bölüm 19) içinden 4 kart gösterilir: `kadro` her zaman ilk sıradadır; kalan 3 kart oyuncunun oyununda olanlara göre `trigger` kurallarıyla seçilir, yer kalırsa `genel` etiketlilerle doldurulur.
- Her kart üç satırdan oluşur:
  - **Başlık** (ör. "Geç kalınan tedavi")
  - **Senin oyununda:** oyuncunun kendi istatistiğiyle doldurulan cümle (ör. "Bekleme yüzünden 2,3 milyon diş kaybedildi.")
  - **Gerçekte:** gerçek veri + küçük puntoyla kaynağı
- Altında "Tümünü gör" ile bütün kartlar açılır ve "Tüm rakamlar →" linki (`DATA_URL`, yeni sekmede).

**4. Kilit anı**
- Oyun boyunca kilitli olan **"Kadro artır"** kartı burada yeniden görünür; kilit ikonu sallanır ve kart **"İmza ver"** düğmesine dönüşür.
- Metin: "Oyunda kilitliydi. **Bu kilidi oyun açamaz. İmza açar.**"
- Altında: "Oyunda satın alamadığın tek şey hekimdi. Gerçekte 10 binden fazla diş hekimi atama bekliyor."

**5. İsim ve çağrı**
- "*Pulpitis reversibilis:* diş sinirindeki iltihabın erken, geri döndürülebilir evresi. Geç kalınırsa *irreversibilis* olur."
- "**Gerçekte durum hâlâ reversibilis.** Yılbaşına kadar en az 10 bin diş hekimi ataması için imza ver."

**6. Düğmeler:** **İmza ver** (`SIGNATURE_URL`, yeni sekmede, en belirgin düğme), **Skorunu paylaş**, **Tekrar oyna**.

**7. Dipnot (küçük):** "Nüfus, başvuru, hekim ve kadro sayıları gerçek verilere dayanır; aradaki yıllar ve 2026 sonrası oyunun modelidir."

### 11.3 Paylaşım kartı
- Canvas'tan 1080×1350 PNG: **Reversibilis** başlığı, "Sistemi {yıl}'e kadar taşıdım", "Bekleme yüzünden {kayipDis} diş kaybedildi", IRREVERSIBILIS damgası, `reversibilis.com` ve `SHARE_TAG`.
- Paylaşım metni: `SHARE_TEXT` (bölüm 19).
- Mobilde Web Share API (dosya paylaşımı destekleniyorsa görselle, değilse metin + link). Desteklenmiyorsa PNG indirilir ve metin panoya kopyalanır.

## 12. Diğer teknik gereksinimler

- `<title>`: "Reversibilis". `<html lang="tr">`. `canonical` → https://reversibilis.com.
- Open Graph / Twitter: `og:title` "Reversibilis", `og:description` "1940'tan başla. Kaça kadar dayanabilirsin?", `og:url` https://reversibilis.com, `og:locale` tr_TR, `twitter:card` summary_large_image.
- 1200×630 önizleme görseli (`public/og.png`): koyu zemin, büyük "Reversibilis", altında "1940'tan başla. Kaça kadar dayanabilirsin?". Konuyu açık etmeyen, merak uyandıran bir görsel.
- Favicon: basit, soyut bir diş ikonu (kendin çiz).
- Sesler opsiyonel; varsayılan kapalı.
- Hata ayıklama paneli (`?debug=1`): hız ×10, bütçe ekle, yıla atla, anında çöküş, ham simülasyon durumunu göster.
- Gizlilik dostu ziyaret ve "İmza ver" tıklama sayımı için yer tutucu (v1'de kapalı: `ANALYTICS_ENABLED = false`).

## 13. Simülasyon döngüsü (her ay, sırayla)

1. Takvimi ilerlet; olayları ve tarihsel bildirimleri tetikle.
2. Nüfus, başvuru oranı, hekim ve geliş karışımını güncelle.
3. Yeni gelen hastaları evre kovalarına ekle; komplikasyonla geri dönenleri ekle.
4. Kapasiteyi hesapla ve triyaj sırasına göre tedavi et (evre 5 için malzeme bütçesini kontrol et).
5. Tedavi edilmeyenlerde evre ilerlemesini uygula; kaybedilen dişleri say.
6. Bütçeyi, memnuniyeti, ortalama beklemeyi güncelle.
7. Çöküş şartını kontrol et.
8. Oyuncu eylemlerini karar kaydına yaz (ay damgasıyla).

## 14. Başlangıç dengeleme değerleri (`balance.ts`)

Kaba başlangıç değerleridir; bölüm 16'daki simülasyonla ayarlanacak. **Yalnızca `[MODEL]` değerleri değiştirilebilir.**

```ts
export const BALANCE = {
  // Takvim
  START_YEAR: 1940,
  SIM_HORIZON_YEAR: 2070,
  ERA_SPEEDS: [                                   // [MODEL] sn / oyun yılı
    { until: 1979, secondsPerYear: 1.2 },
    { until: 1999, secondsPerYear: 2 },
    { until: 2026, secondsPerYear: 5 },
    { until: 9999, secondsPerYear: 6 },
  ],

  // Nüfus
  POPULATION_MODE: "census" as "census" | "average",
  POP_AVERAGE_GROWTH: 0.0187,                     // [GERÇEK] 1940→2025 ortalaması (türetilmiş)
  POP_GROWTH_AFTER_2025: 0.005,                   // [GERÇEK] 2025 artış hızı; sonrası sabit [MODEL]

  // Talep
  VISIT_RATE_1940: 0.01,                          // [MODEL] kişi başı yıllık kamu diş başvurusu
  VISIT_RATE_CAP: 2.0,                            // [MODEL] 2022 sonrası tavan

  // Evreler
  STAGE_SESSIONS: [0.5, 1, 1.5, 3, 6],            // [MODEL]
  STAGE_MATERIAL_REL: [0.01, 0.05, 0.1, 0.3, 4], // [MODEL] hasta başı malzeme = bu değer × INCOME_PER_SESSION (evre 5 ithal)
  STAGE_PROGRESS_MONTHS: 3,                       // [MODEL]
  ARRIVAL_MIX_BASE: [0.05, 0.15, 0.30, 0.35, 0.15],       // [MODEL] çoğu geç gelir
  ARRIVAL_MIX_PREVENTIVE: [0.30, 0.35, 0.20, 0.10, 0.05], // [MODEL] koruyucu tam etki

  // Hekim
  DENTISTS_START: 300,                            // [MODEL] 1940 kamu diş hekimi — teyit edilince güncelle
  SESSIONS_PER_DENTIST_YEAR: 4000,                // [GERÇEK] 10binatama.com
  ATTRITION_RATE: 0.02,                           // [MODEL] 2024+ yıllık emeklilik / ayrılma
  ATAMA_AFTER_2026: 521,                          // [GERÇEK] 2026 kadrosu; sonrası sabit [MODEL]

  // Hastane
  HOSPITALS_START: 190,                           // [MODEL] 1945'te 198 kurum vardı [GERÇEK]
  SEATS_PER_HOSPITAL: 2,                          // [MODEL]
  QUEUE_PER_HOSPITAL: 10000,                      // [MODEL]

  // Yükseltmeler (fiyat = base × 3^seviye, sonsuz seviye)
  COST_MULT: 3,
  UPGRADES: {
    hastane:     { base: 50, unlock: 1940, hospitalMult: 1.5 },
    ekipman:     { base: 80, unlock: 1940, speedMult: 1.6 },
    yapayZeka:   { base: 60, unlock: 2015, speedMult: 1.3, progressMult: 0.9 },
    kisaRandevu: { base: 30, unlock: 1940, speedMult: 1.8, complicationAdd: 0.08, complicationMax: 0.6 },
  },

  // Koruyucu program
  PREVENTIVE_OPTIONS: [0, 0.1, 0.2, 0.3],
  PREVENTIVE_LAG_YEARS: 5,                        // [MODEL]

  // Ekonomi
  INCOME_PER_SESSION: 0.001,                      // [MODEL] bütçe birimi (1940'ta ~180/yıl, 2022'de ~53.000/yıl)
  TAP_SESSIONS: 2000,                             // [MODEL] dokunuş başına ek seans
  MATERIAL_PRICE_EVENT_MULT: 1.3,                 // [MODEL]
  MATERIAL_EVENT_AVG_YEARS: 8,                    // [MODEL]

  // Memnuniyet
  WAIT_PENALTY: 6,                                // [MODEL] puan / ay bekleme
  LOSS_PENALTY: 40,                               // [MODEL]
  SHORT_PENALTY: 5,                               // [MODEL] puan / kısa randevu seviyesi

  // Olaylar
  PANDEMIC: { start: "2020-03", end: "2020-05", capacityMult: 0.2 }, // olay [GERÇEK], etki [MODEL]
  KOMPLIKASYON_DONUS_AY: 2,                       // [MODEL]

  // Sonuç ekranı yeniden oynatması (kampanyanın talebi)
  GHOST_YEAR: 2026,
  GHOST_EXTRA_DENTISTS: 10000,
  GHOST_EXTRA_SEATS: 10000,

  BEST_POSSIBLE_YEAR: 2038,                       // simülasyondan sonra güncelle
};
```

## 15. Gerçek veriler (`data.ts`)

```ts
// [GERÇEK] TÜİK genel nüfus sayımları ve ADNKS
export const CENSUS: [number, number][] = [
  [1940, 17820950], [1945, 18790174], [1950, 20947188], [1955, 24064763],
  [1960, 27754820], [1965, 31391421], [1970, 35605176], [1975, 40347719],
  [1980, 44736957], [1985, 50664458], [1990, 56473035], [2000, 67803927],
  [2007, 70586256], [2010, 73722988], [2015, 78741053], [2020, 83614362],
  [2025, 86092168],
];

// [GERÇEK] Kamu ağız-diş sağlığı birimlerine toplam yıllık başvuru — Sağlık Bakanlığı (10binatama.com)
export const VISIT_ANCHORS: [number, number][] = [[2002, 5462923], [2022, 53261198]];

// [GERÇEK] Sağlık Bakanlığı'nda çalışan diş hekimi
export const DENTIST_ANCHORS: [number, number][] = [[2015, 8683], [2023, 12774]];

// [GERÇEK] Açılan kadro (uç noktalar)
export const ATAMA_ANCHORS: [number, number][] = [[2022, 948], [2026, 521]];
```

## 16. Denge simülasyonu ve hedefler

`npm run sim`: aynı simülasyon modülüyle üç bot stratejisini farklı tohumlarla yüzlerce kez oynatır.

| Bot | Davranış |
|---|---|
| **Açgözlü** | Her zaman en ucuz yükseltmeyi alır; triyaj "Sırayla"; koruyucu kapalı; kısa randevu dahil her şeyi alır. |
| **Hızcı** | Ekipman, yapay zeka ve kısa randevuya yüklenir; hastaneyi yalnızca koltuk yetmeyince alır; triyaj "Hafif vaka önce". |
| **Akıllı** | Koltuk ihtiyacını takip eder; 1980'den itibaren koruyucu %20; bekleme 3 ayı geçince "Ağır vaka önce"; kısa randevuyu yalnızca kuyruk limitin %80'ini geçince alır. |

Çıktı: her bot için ortalama / en iyi / en kötü çöküş yılı, kaybedilen diş, aynı botun "+10 bin atama" yeniden oynatmasında çöküş yılı. Ayrıca gerçekçilik kontrolü: 2002 ve 2022 talebi ile 2015 ve 2023 hekim sayısı (gerçek değerlerle birebir eşleşmeli).

Hedefler:
- 2000'den önce hiçbir bot çökmez (öğretici dönem).
- Açgözlü: ~2015–2025 arasında çöker.
- Hızcı: Açgözlü'den biraz daha geç, ama kaybedilen dişte en kötüsü olur.
- Akıllı: ~2032–2040 arasında çöker.
- Hiçbir strateji atamasız 2045'i geçemez.
- "+10 bin atama" yeniden oynatması, Akıllı bot için çöküşü en az 10 yıl erteler.

Hedeflere yalnızca `[MODEL]` değerleri ayarlanarak ulaşılır. Sonuçlara göre `BEST_POSSIBLE_YEAR` güncellenir.

## 17. Geliştirme aşamaları

1. **İskelet ve simülasyon çekirdeği:** `reversibilis-web-client` adıyla Vite + TS projesi; `src/sim/` (nüfus, talep, evreler, kapasite, hekim, kuyruk, çöküş); `balance.ts`, `data.ts`, `texts.ts`; `npm run sim` ile pasif çalıştırma ve gerçekçilik kontrolü.
2. **Temel arayüz:** üst bar, kuyruk paneli (temsili ikonlar, renkler, limit barı), kapasite satırı, takvim akışı ve dönem hızları, basit çöküş.
3. **Ekonomi:** bütçe, yükseltme hatları (×3 fiyat, sonsuz seviye, açılış yılları, ekipman seviye adları), kilitli "Kadro artır", memnuniyet.
4. **Kararlar:** triyaj, koruyucu program, kısa randevu komplikasyonları, IRREVERSIBILIS etiketleri, kaybedilen diş sayacı, boş koltuk.
5. **Canlılık:** olaylar, tarihsel bildirimler, hasta yorumları, dokunuş.
6. **Sonuç ekranı:** IRREVERSIBILIS anı, oyun özeti, karar kaydı ve "+10 bin atama" yeniden oynatma grafiği, kamusal durum kartları, kilit anı, imza, paylaşım kartı.
7. **Denge:** bot simülasyonları, hedeflere göre `[MODEL]` ayarı, `BEST_POSSIBLE_YEAR`.
8. **Cila:** animasyonlar, ipucu balonları, OG etiketleri ve görseli, favicon, ses, orta seviye telefonda performans testi.
9. **Yayın:** `npm run build` ile statik çıktı. README'ye: Cloudflare Pages (veya Netlify) üzerinde yayın, **reversibilis.com** alan adını bağlama (DNS), `www` → kök yönlendirmesi, HTTPS kontrolü.

## 18. Kabul kriterleri

- iPhone Safari ve Android Chrome'da dikey modda; PC'de Chrome, Firefox ve Safari'de sorunsuz çalışır; orta seviye telefonda akıcıdır.
- Ortalama bir oyun 5–8 dakika sürer.
- Ad her yerde "Reversibilis"tir; "reversibilis-web-client" hiçbir kullanıcı arayüzünde görünmez.
- Tüm metinler `texts.ts`'ten, tüm sayılar `balance.ts` ve `data.ts`'ten gelir; her değer `[GERÇEK]` ya da `[MODEL]` etiketlidir.
- Simülasyon 2002 ve 2022 talebini, 2015 ve 2023 hekim sayısını gerçek değerlerle birebir üretir.
- Yükseltmelerin maksimum seviyesi yoktur; her seviye 3 kat pahalıdır; hiçbir seviyenin etkisi 2 katı geçmez.
- "Kadro artır" oyun içinde hiçbir yolla açılamaz; hekim sayısı oyuncu eylemlerinden etkilenmez.
- Sonuç ekranındaki her gerçek veri kaynağıyla gösterilir; 2026 sonrası "tahmin" olarak işaretlenir.
- "İmza ver" https://10binatama.com/ adresini yeni sekmede açar.
- Oyun çalışırken hiçbir harici siteden veri çekmez.

## 19. `texts.ts` — linkler, kamusal durum, bildirimler, yorumlar

Gerçek rakamlar kampanya sitesinden ve bölüm 3'teki kaynaklardan alınmıştır; kampanya sahibi yayından önce kontrol edecek.

```ts
export const GAME_TITLE = "Reversibilis";
export const SITE_URL = "https://reversibilis.com";
export const SIGNATURE_URL = "https://10binatama.com/";
export const DATA_URL = "https://10binatama.com/#rakamlar";
export const CAMPAIGN_NAME = "Diş Hekimliğine 10 Bin Atama";
export const SHARE_TAG = "#DişHekimliğine10BinAtama";
export const SHARE_TEXT =
  "Reversibilis'te sistemi {yil}'e kadar taşıyabildim. Sen kaça kadar dayanırsın? reversibilis.com #DişHekimliğine10BinAtama";

// Sonuç ekranı: "Oyunda yaşadıkların, gerçekte yaşanıyor"
// {kayipDis}, {bosKoltuk}, {tedavi}, {bekleme} gibi yer tutucular oyuncunun istatistikleriyle doldurulur.
type PublicIssue = {
  id: string;
  title: string;
  inGame: string;     // "Senin oyununda: ..."
  fact: string;       // "Gerçekte: ..."
  source: string;
  trigger: string[];  // "always" | "genel" | "kisaRandevu" | "kayipYuksek" | "koruyucuKapali" | "bosKoltuk" | "kuyrukCokusu"
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

// Tetik kuralları:
// kisaRandevu: kısa randevu seviyesi > 0
// kayipYuksek: kurtarma oranı < %70
// koruyucuKapali: oyunun çoğunda koruyucu program kapalı
// bosKoltuk: çöküş anında boş koltuk > 0
// kuyrukCokusu: her zaman (çöküş kuyruktan olur)

// Tarihsel bildirimler (oyunu durdurmaz)
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

// Hasta yorumları (duruma göre seçilir; {hafta} yer tutucusu)
export const PATIENT_COMMENTS = {
  sakin: [
    "Dolgum yirmi dakikada bitti, teşekkürler!",
    "Randevu ertesi güne verildi, harika.",
  ],
  yapayZeka: ["Yapay zeka röntgenimi bir dakikada okudu."],
  bekleme: [
    "Randevumu {hafta} hafta sonraya verdiler.",
    "Ağrım var ama sıra daha gelmedi.",
  ],
  kotulesme: [
    "Dolgu için sıraya girdim, sıra gelene kadar kanala döndü.",
    "Dişimi kurtaramadılar, implant için sıra bekliyorum.",
  ],
  kisaRandevu: ["Hekimim çok hızlıydı ama ağrım geçmedi, tekrar geldim."],
  bosKoltuk: ["Koca hastane, boş koltuklar… hekim yok."],
  koruyucu: ["Çocuğumun dişleri okulda tarandı, erken yakalandı."],
  malzeme: ["İmplant malzemesi gelmedi, beklemedeyim."],
};
```
