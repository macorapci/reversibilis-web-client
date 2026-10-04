# Reversibilis

> Ekranda, sekme başlığında, OG etiketlerinde ve paylaşım kartında oyunun adı her zaman **Reversibilis**'tir.
> `reversibilis-web-client` yalnızca teknik addır (klasör / repo / paket) ve hiçbir kullanıcı arayüzünde görünmez.

**"Teknoloji hızlandırır, ama hastayı hekim kurtarır."**

Tarayıcıda çalışan, mobil öncelikli bir idle / artımlı yönetim oyunu. Oyuncu 1940'tan
başlayarak ülkenin kamusal ağız-diş sağlığı sistemini yönetir. Nüfus ve talep gerçek
verilere oturur. Hastane, ekipman, yapay zeka — her şey geliştirilebilir; **hekim sayısı
hariç.** Hekim yalnızca atamayla gelir. Kuyruk limiti aşılınca sistem çöker ve oyun
[10binatama.com](https://10binatama.com/) imza çağrısıyla biter.

**Kampanya:** Diş Hekimliğine 10 Bin Atama — `#DişHekimliğine10BinAtama`

### İsmin anlamı
*Pulpitis reversibilis*: diş sinirindeki iltihabın erken, **geri döndürülebilir** evresi.
Geç kalınırsa *irreversibilis* olur. Oyunda kuyrukta bekleyen her hastanın dişi zamanla
evre atlar ve bu geçişi yapar — **isim, mekaniğin kendisidir.**

---

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # dist/ içine statik çıktı (tsc --noEmit + vite build)
npm run preview  # build çıktısını yerelde dene
npm run sim      # denge simülasyonu + gerçekçilik kontrolü
npm run og       # public/og.png ve apple-touch-icon.png üretir
```

Gereksinim: Node 20+. Üretim çıktısı tamamen statiktir (~50 KB JS + CSS); sunucu,
veritabanı veya çalışma anında harici istek yoktur.

**Hata ayıklama:** `?debug=1` ile sağ üstte bir panel çıkar — hız ×10, +1000 bütçe,
yıla atla, çökert, ham simülasyon durumunu konsola yaz.

---

## Mimari

**Simülasyon saf TypeScript'tir ve arayüzden tamamen bağımsızdır.** Aynı modül üç yerde
kullanılır: oyunun kendisi, `npm run sim` bot testleri ve sonuç ekranındaki
"atama yapılsaydı" yeniden oynatması.

| Dosya | İçerik |
|---|---|
| `src/config/balance.ts` | **Tüm dengeleme sayıları.** Her değer `[GERÇEK]` ya da `[MODEL]` etiketli. |
| `src/config/data.ts` | **Gerçek veriler:** nüfus sayımları, başvuru / hekim / kadro çapaları. |
| `src/config/texts.ts` | **Tüm metinler, linkler, kamusal durum kartları, bildirimler, hasta yorumları.** |
| `src/sim/model.ts` | Nüfus, başvuru oranı, hekim ve kadro eğrileri. |
| `src/sim/sim.ts` | Aylık simülasyon çekirdeği: evreler, kapasite, triyaj, bütçe, memnuniyet, çöküş. |
| `src/sim/replay.ts` | Karar kaydını aynı tohumla yeniden oynatır (+10 bin atama sürümü). |
| `src/sim/bots.ts`, `run.ts` | Üç bot stratejisi ve `npm run sim`. |
| `src/ui/` | DOM arayüzü, kuyruk ve grafik canvas'ları, paylaşım kartı. |

Arayüz HTML/CSS (DOM) ile yapılır; yalnızca kuyruk örneklemi, sonuç grafiği ve paylaşım
kartı Canvas 2D kullanır. Oyun motoru ya da grafik kütüphanesi yoktur.

### Gerçek veri / model ayrımı

`balance.ts` ve `data.ts`'teki her değerin yanında yorum olarak **`[GERÇEK]`**
(kaynağıyla) ya da **`[MODEL]`** etiketi vardır.

> **Dengeleme yalnızca `[MODEL]` değerleri değiştirilerek yapılır; `[GERÇEK]` değerlere
> dokunulmaz.** `npm run sim` her çalıştığında gerçek çapaları doğrular.

2026 sonrası her şey tahmindir; arayüzde 2027'den itibaren yılın yanında "tahmin"
etiketi görünür.

### Görünüm

Oyun 8-bit'tir: NES *Super Mario Bros.* 1-1 paleti (gökyüzü mavisi, tuğla turuncusu,
soru bloğu sarısı), keskin köşeler, 4 px kenarlıklar, sert gölgeler. Başlıklar ve
rakamlar **Press Start 2P**, Türkçe metinlerin tamamı **Pixelify Sans** — Press Start 2P
Türkçe büyük harfleri (Ş, İ, Ü…) küçük boyda çizdiği için Türkçe geçen metinlerde
kullanılmaz. Önizleme görselleri `scripts/pixelfont.mjs` içindeki 5×7 bitmap fontla
üretilir, böylece sistemde font kurulu olmasına gerek kalmaz.

### Koruyucu program

Oyunun en az anlaşılan parçası olduğu için mekaniği burada açık yazılıdır:

- **Bedel, anında.** Seçilen pay kadar hekim zamanı taramaya gider; tedavi kapasitesi
  o oranda düşer (`capacity × (1 − preventive)`).
- **Fayda, gecikmeli ve iki yönlü.** Programın **5 yıllık hareketli ortalamasıyla**
  orantılı olarak:
  1. **Talep düşer** (`PREVENTIVE_DEMAND_CUT`): erken yakalanan çürük tedaviye hiç
     gelmez — hasta tekrar gelmez. Asıl fayda budur.
  2. **Geliş karışımı erken evrelere kayar** (`ARRIVAL_MIX_PREVENTIVE`): gelen hasta
     dolgu değil flor ister, evre 5'e giden yol uzar.
- **Tarama da bir hizmettir** ve gelir getirir (`PREVENTIVE_INCOME_REL`, nüfusla
  sınırlı). Bu olmadan koruyucu program bütçeyi kurutuyor ve oyuncuyu cezalandırıyordu.
- Ayrıca her eylülde %30 ihtimalle **okul tarama haftası**: evre 1-2 kuyruğunun %30'u
  anında erir.

Ölçülen etkisi (40 aynı tohum, akıllı oyun):

| koruyucu | çöküş yılı | kaybedilen diş | kurtarma oranı |
|---|---|---|---|
| kapalı | 2033 | 148 milyon | %73 |
| %20 (1980'den) | 2035 | 94 milyon | %82 |

Yani **asıl kazancı diş, zaman değil**: kayıp dişi %36 azaltıyor, ömrü ~1-2 yıl uzatıyor.
Bu, oyunun tezini bozmuyor, doğruluyor — *teknoloji ve organizasyon hızlandırır, ama
hastayı hekim kurtarır.* Arayüzde bu artık görünür: koruyucu seçeneğinin altında
"yeni gelenlerin %X'i erken evrede · talep −%Y" yazar.

### Kısa randevu: senin kararın değil

Kısa randevu **oyuncunun seçeneği değildir.** Kuyruk limitin yarısını aşıp orada
kalırsa Bakanlık randevu süresini kısaltır (`SHORT_FORCED`); kuyruk uzun süre rahatsa
baskı gevşer. Oyuncu bu kaldıraca hiç dokunamaz, sadece sonucunu yaşar:

1. **Kapasite azıcık artar** (×1,25/seviye) — hızlanmanın faydası bilerek küçüktür.
2. **Komplikasyon** %12/seviye (en çok %60): tedavi edilenlerin bu kadarı 2 ay sonra
   **bir üst evrede** kuyruğa döner ve "tamamlanan tedavi" sayılmaz. Ekranda
   "tekrar gelen" olarak görünür; hasta yorumları bunu doğrudan söyler.
3. **Koruyucu programı kısar**: her seviye tarama için ayrılabilecek en yüksek oranı
   bir kademe düşürür (%30 → %20 → %10 → kapalı). Hekim zamanı hasta döndürmeye
   gidince taramaya kalmaz.

Bu, oyunun tezinin kalbidir: sistem sıkışınca çözüm diye dayatılan şey, sorunu büyütür.

### Oyuncunun kararları

| Hat | Etkisi | Açılış |
|---|---|---|
| **Hastane ağı** | Koltuk ve kuyruk limiti ×1,9 — ama her hastane yıllık işletme gideri yer | 1940 |
| **Klinik destek ekibi** | Kapasite ×1,4 (hekimi çoğaltmaz, her hekimin işini artırır) | 1950 |
| **Teknolojik ekipman** | Kapasite ×1,6; seviye adları döneme bağlı | 1940 |
| **Halkı bilinçlendirme** | Hastalar daha erken evrede gelir (+%30/seviye, birikimli) | 1960 |
| **Yerli malzeme üretimi** | Malzeme gideri ×0,7 — ithal fatura ve zam sarmalını kırar | 1980 |
| **Yapay zeka** | Kapasite ×1,3, kötüleşme ×0,9 | 2015 |
| **Kadro artır** | **Her zaman kilitli.** | — |

Artı iki politika anahtarı: **triyaj** (sırayla / ağır vaka önce / hafif vaka önce) ve
**koruyucu program** (kapalı / %10 / %20 / %30).

### Ekonomi: hastadan değil, devletten

Kamu ağız-diş sağlığı hizmeti tedavi ettiği hastadan para kazanmaz:

- Her Ocak'ta **devlet ödeneği** gelir. Ödenek nüfusla ve ülkenin gelişimiyle büyür
  (`GRANT_PER_CAPITA`, `GRANT_GROWTH`).
- Ödeneğin bir kısmı **siyasi desteğe** bağlıdır (`GRANT_SATISFACTION_WEIGHT`): iyi
  işleyen hizmet ödeneğini alır, çöken hizmetin bütçesi kısılır.
- Bazı yıllar **bütçe kesilir** (`BUDGET_CUT_CHANCE`): "Bu yıl bütçe kısıldı."
- Her hastane **yıllık işletme gideri** yer (`HOSPITAL_UPKEEP`). İhtiyaçtan fazla
  hastane açmak bütçeyi kurutur — "boş koltuk" artık sadece üzücü bir sayaç değil,
  ödediğin bir fatura.

### Ekranın okunurluğu### Ekranın okunurluğu

Her blok başlıklıdır ve tek bir soruya cevap verir:

| Blok | Soru |
|---|---|
| **HASTALAR** | İki çöküş göstergesi, kuyruk görseli, evre dağılımı, ortalama bekleme ve **son 12 ayın akışı**: tedavi edilen · sırası gelmeyen · evre atlayan · tekrar gelen |
| **SİSTEM** | Hekim, koltuk, boş koltuk (ya da koltuk bekleyen hekim), hastane gideri, talep/kapasite |
| **ELİNDE OLMAYANLAR** | Dayatılan kısa randevu seviyesi ve bu yılki devlet ödeneği — ikisi de oyuncunun kararı değil |
| **KARARLAR** | Triyaj ve koruyucu program; dayatmanın koruyucuya getirdiği kısıt burada yazılı |
| **YÜKSELTMELER** | Altı hat, kilitli "Kadro artır" dahil |

**Evre dağılımı** beş satırlık açıklama yerine iki parçadır: kuyruğun bileşimini
gösteren **oransal yığılmış bar** (`erken ▸ ◂ kayıp`) ve altında her evrenin sayısı.
Böylece kuyruk küçükken bile alan boş kalmaz ve "ne kadarı kanala döndü" okunur.
Kuyruk tamamen boşken ikon alanı mavi bir boşluk bırakmaz, **"KUYRUK BOŞ"** yazar.

**Hasta yorumları** ağırlıklı bir havuzdan seçilir: birden çok sorun varsa hepsi sırayla
duyulur, en acil olan daha sık çıkar. Kısa randevu açıkken ve hastalar geri dönmeye
başladığında şikâyetler bunu doğrudan söyler — *"Aynı diş için üçüncü kez geliyorum,
her seferinde beş dakika."*, *"Her gelişimde başka bir hekim, her seferinde baştan
anlatıyorum."*

### Değişmez kurallar### Değişmez kurallar---

## Denge

`npm run sim [tekrar]` üç bot stratejisini farklı tohumlarla oynatır. Önce gerçekçilik
kontrolü yapar — model, 2002/2022 talebini ve 2015/2023 hekim sayısını gerçek değerlerle
birebir üretmelidir:

```
✓ talep 2002 (seans)     model   5,5 milyon   gerçek   5,5 milyon
✓ talep 2022 (seans)     model  53,3 milyon   gerçek  53,3 milyon
✓ hekim 2015             model        8.683   gerçek        8.683
✓ hekim 2023             model       12.774   gerçek       12.774
```

Mevcut değerlerle (60 oyun/strateji):

| strateji | ortalama çöküş yılı | hedef |
|---|---|---|
| Açgözlü | 2018,9 | ~2015–2025 ✓ |
| Hızcı | 2036,7 | Açgözlü'den geç ✓ |
| Akıllı | 2039,2 | ~2032–2040 ✓ |
| Akıllı + 2026'da 10 bin atama | 2066,1 | çöküşü ≥10 yıl erteler ✓ (+27) |

`BALANCE.BEST_POSSIBLE_YEAR` (sonuç ekranında gösterilir) Akıllı botun ortalamasına göre
**2039** olarak ayarlandı. `balance.ts`'te bir `[MODEL]` değeri değiştirdikten sonra
`npm run sim` çalıştırıp bu tabloyu güncelleyin.

### Modelin karşılayamadığı iki hedef

`npm run sim` çıktısının sonunda "Notlar" başlığı altında yazılır:

1. **"Hızcı, kaybedilen dişte en kötüsü olur"** hedefi bu modelde doğmuyor. Sebep yapısal:
   "Hafif vaka önce" sırası evre 4'ü (pulpitis irreversibilis) evre 5'ten **önce** tedavi
   ediyor, yani evre 5'e geçişi azaltıyor. Hızcı'nın bedeli kayıp dişte değil, kuyrukta
   biriken evre 5 hastalarında ve komplikasyonlarda çıkıyor — evre 5 yığılması en çok onda.
   Hedefi tutturmak için ya "hafif vaka önce" sırası ya da `ARRIVAL_MIX_BASE` değişmeli.
2. **Bot tanımları değişti.** Dokümandaki üç bot "kısa randevu"yu bir satın alma
   kararı sayıyordu; o kaldırıldığı için botlar yeniden yazıldı. Akıllı bot artık
   koltuğu ihtiyaç kadar açar (fazlası işletme gideri), bilinçlendirmeyi erken alır
   ve koruyucu programı yalnızca sistemde boşluk varken açıp kriz gelince kapatır.

---

## Yayın

Çıktı tamamen statiktir. Aşağıda Cloudflare Pages anlatılmıştır; Netlify için notlar sonda.

### 1. Cloudflare Pages'e bağlama

1. Projeyi bir Git deposuna gönderin (GitHub / GitLab).
2. **Workers & Pages → Create → Pages → Connect to Git** ile depoyu seçin.
3. Derleme ayarları:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** ortam değişkeni `NODE_VERSION = 20` (veya üstü)
4. **Save and Deploy**. İlk yayın `<proje>.pages.dev` adresinde açılır.

### 2. reversibilis.com alan adını bağlama

**Alan adı Cloudflare'de ise (önerilen):**

1. Pages projesi → **Custom domains → Set up a custom domain** → `reversibilis.com`.
2. Cloudflare DNS kaydı kendisi oluşturur: `reversibilis.com` için
   **CNAME → `<proje>.pages.dev`** (kök alan adında CNAME flattening otomatik çalışır),
   kayıt **Proxied** (turuncu bulut) olmalıdır.
3. Aynı ekrandan `www.reversibilis.com` alan adını da ekleyin; onun için de
   **CNAME `www` → `<proje>.pages.dev`**, Proxied.

**Alan adı başka bir kayıt kuruluşunda ise:** ya nameserver'ları Cloudflare'e taşıyın,
ya da kayıt kuruluşunun panelinde:

```
reversibilis.com.      CNAME (veya ALIAS/ANAME)  <proje>.pages.dev
www.reversibilis.com.  CNAME                     <proje>.pages.dev
```

Kök alan adında CNAME desteklenmiyorsa ALIAS/ANAME kullanın; A kaydı girmeyin.

### 3. www → kök yönlendirmesi

Kanonik adres `https://reversibilis.com` (www'suz). **Rules → Redirect Rules → Create rule**:

- **If:** `Hostname` `equals` `www.reversibilis.com`
- **Then:** Type `Dynamic`,
  Expression `concat("https://reversibilis.com", http.request.uri.path)`,
  **Status code 301**, "Preserve query string" işaretli.

```bash
curl -sI https://www.reversibilis.com/ | head -3   # HTTP/2 301 → https://reversibilis.com/
```

### 4. HTTPS'in açık olduğunu doğrulama

1. **SSL/TLS → Overview**: şifreleme kipi **Full (strict)**.
2. **SSL/TLS → Edge Certificates**: her iki alan adı için sertifika **Active**;
   **Always Use HTTPS** ve **Automatic HTTPS Rewrites** açık.
3. Doğrulama:

```bash
curl -sI http://reversibilis.com/  | head -3   # 301 → https://
curl -sI https://reversibilis.com/ | head -3   # 200
curl -s  https://reversibilis.com/ | grep -o '<title>.*</title>'
```

4. `https://reversibilis.com/og.png` 1200×630 açılmalı. Kart önizlemesini Facebook
   Sharing Debugger / X Card Validator ile test edin.

### Netlify ile

**Build command** `npm run build`, **Publish directory** `dist`. Alan adını
**Domain management**'tan ekleyin, **Primary domain** olarak `reversibilis.com` seçin.
HTTPS için **Domain management → HTTPS → Verify DNS configuration → Provision certificate**.

---

## Sürümden önce kontrol listesi

- [ ] `npm run sim` — gerçekçilik ve hedef kontrollerinin hepsi ✓
- [ ] `npm run build` — tip hatası yok
- [ ] iPhone Safari ve Android Chrome'da dikey modda denendi
- [ ] PC'de Chrome, Firefox, Safari'de denendi
- [ ] Ortalama bir oyun 5–8 dakika sürüyor
- [ ] "İmza ver" https://10binatama.com/ adresini yeni sekmede açıyor
- [ ] `texts.ts` ve `data.ts` içindeki **gerçek rakamlar kampanya sahibi tarafından doğrulandı**
- [ ] `DENTISTS_START` (1940 kamu diş hekimi sayısı) teyit edildiyse güncellendi
- [ ] OG önizlemesi doğru görünüyor
