# Sipariş Kontrol: kurallar ve kararlar

Kullanıcıyla adım adım konuşularak kararlaştırılan kurallar (10.11.2026). Uygulamayı değiştirmeden önce bunları oku; burada yazan bir kararı kullanıcıya sormadan değiştirme.

## Amaç
Malzeme istek formları (bölümlerin istekleri) ile satınalmaya geçilen sipariş listesini **bölüm bölüm** karşılaştırmak, hataları göstermek, sonra sipariş listesindeki aynı kodları toplayıp tek satıra indiren **birleşik liste** üretmek.

## Kullanım ortamı
- iPhone, Safari'den açılan web uygulaması (PWA), Ana Ekrana eklenir. Ücretsiz, App Store yok.
- Veriler sadece telefonda işlenir, hiçbir sunucuya gönderilmez.
- iOS görünümü ve geçişleri. Arayüz dili Türkçe.

## Girdiler
- **İstek formları:** Tek Excel, formlar aynı sayfada alt alta; her formun kendi başlığı ve imza kısmı var. Form, "Malzeme Numarası/JD ADVERS" + "Miktar" başlık satırıyla başlar, "Talebi Yapanın" satırıyla biter. Başlık iki satıra bölünmüş olabilir.
- **Kod** JD ADVERS ya da LEO sütununda olabilir; ikisi de geçerli, hata değil. İkisi doluysa JD esas.
- **Sipariş listesi:** Sistemden alınan Excel: Mlz No. | Malzeme Tanımı 1 | Malzeme Tanımı 2 | Sipariş Miktarı | İşlem Ö.B. (birim) | Açıklama 1 (bölüm).
- CSV de okunur (0.4): harfler önce UTF-8, olmazsa Türkçe Windows (1254) olarak çözülür. Asıl yol yine .xlsx.
- İkisi de yüklenince rapor kendiliğinden açılır (Karşılaştır düğmesi yok).
- Yüklenen dosyanın yanında **Kaldır** tuşu var (0.5): o dosyayı kaldırır, rapor boşalır, diğer dosya ve ayarlar kalır. Düzeltme yapılmışsa önce sorar.
- Fotoğrafla okuma **yedek yoldur** (0.3'te eklendi): Tesseract telefonun içinde çalışır (`foto.js` + `vendor/tesseract`), fotoğraf dışarı gönderilmez. Görüntü temizlenir (gölge, tablo çizgileri, kenar lekeleri), eğim düzeltilir, satır satır okunur. Okunanlar kontrol ekranında düzenlenip onaylanmadan kullanılmaz.
- Fotoğraf test sonuçları (10.11.2026, kullanıcının fotoğrafları): düz sipariş listesi 31 satırın 29'u, kodların çoğu doğru; Yemekhane formu 13 satırın 12'si, kodların yarısı okunamadı; gölgeli İç Alan formu hiç okunamadı. Şüpheli işaretlenmeyen satırlarda da hata olabiliyor. Kullanıcıya açıkça söylendi: Excel asıl yol, fotoğraf elle düzeltme gerektirir. Daha iyi okuma çevrimiçi servis ister, bu da "veri telefonda kalır" kuralına aykırı; kullanıcıya sormadan yapma.

## Bölümler
- Sabit liste (30): MEDE, LOKAL, BOYAHANE İDARİ BİNA, İDARİ BİNA, YEMEKHANE, İÇ ALAN, TEST LAB, İPLİK LAB, BOYA LAB, SERA, ENERJİ, KOJEN, TEKİRDAĞ ENERJİ, SEVKİYAT, ARITMA, DOKUMA, BÜKÜM, GÜVENLİK, REVİR, HAM KONTROL, MAMÜL KONTROL, BOYAHANE, YARDIMCI İŞLETMELER, ÜRGE, SATINALMA, KARTELA, SERA YEMEKHANESİ, MUHASEBE, İDARİ BİNA SEKRETER, KONUT. Kullanıcı uygulamadan yeni bölüm ekleyebilir.
- Adlar **tahminle eşleştirilmez**. Sadece büyük-küçük harf, boşluk, nokta, tire farkı ve (0.4'ten beri, kullanıcı onayıyla) Türkçe harf farkı yok sayılır (TEKİRDAĞ-ENERJİ = TEKİRDAĞ ENERJİ, ÜR-GE = ÜRGE, IDARI BINA = İDARİ BİNA, GUVENLIK = GÜVENLİK). Aynı kural sütun başlıkları (MIKTAR = MİKTAR), birimler ve kodsuz satırların ad benzerliği için de geçerli.
- Benzer ama **ayrı** bölümler: Boyahane / Boyahane İdari Bina, İdari Bina / İdari Bina Sekreter, Sera / Sera Yemekhanesi, Enerji / Tekirdağ Enerji.
- Onaylanmış eşleşmeler: MEDE KIDS→MEDE, Enerji Şefliği→KOJEN, Enerji Üretim→ENERJİ, BOYA&APRE MDR./BOYA LAB.ŞEFLİĞİ→BOYA LAB, KUMAŞ TEST LAB/KGM→TEST LAB, İPLİK TEST LAB/KGM→İPLİK LAB, H.K.K ve HAM KON→HAM KONTROL, MUH.→MUHASEBE.
- Tanınmayan ad → kullanıcıya listeden seçtirilir, cevap hatırlanır. Formun bölüm sütunu tamamen boşsa → o form için sorulur (❓ uyarısıyla).
- **Açık soru:** "DOKU" formunda gerçek bölüm Açıklamalar sütununda (BÜKÜM, DOKUMA, BÜKÜM+İPLİK). Nasıl ele alınacağı kullanıcıya soruldu, cevap bekleniyor.

## Karşılaştırma (bölüm bölüm, Kod + Bölüm üzerinden)
- Birimlerin hepsi adet sayılır; **birim çevirme yapılmaz** (4 KOLİ = 4).
- Sipariş listesinde aynı bölümde aynı kod birden fazla geçerse önce toplanır.
- Uyarılar:
  - ✅ Doğru
  - 🔴 Eksik: formda var, siparişte yok
  - 🔴 Fazla: siparişte var, formda yok
  - 🔀 Muhtemel kod hatası: aynı bölümde aynı adetli bir eksik ve bir fazla
  - 🟡 Adet farkı: birim aynı, adet farklı
  - 📦 Birim farkı: birim farklı, adet farklı
  - ⚠️ Kod çakışması: **aynı bölüm formunda aynı kod birden fazla satırda**. Ad benzerliği çakışma DEĞİLDİR; ürünü kod belirler. Kod aynı ad farklıysa sorun yok.
  - 🔁 Eski kod: siparişte eşdeğeriyle değiştirilmesi gereken kod
  - ⚪ Kodsuz / 🔵 Tahmin: kod boş; program addan tahmin eder (ana kelime/marka tutmalı), kullanıcı ✔/✖ ile onaylar
  - ❓ Bölüm belirsiz
  - 📭 Form yok: bölümün siparişi var, formu yok (tek satırda, kalem sayısıyla)
- **Eşdeğer kodlar:** 152958 ≡ 179920 (kahve kreması; satınalma 152958'i 179920'ye çevirir). Eşdeğerle eşleşen doğru sayılır, not düşülür. Siparişte 152958 görülürse uyarılır.

## Hatırlanan / hatırlanmayan
- Hatırlanır: bölüm eşleşmeleri, eşdeğer kodlar, onaylanan kod tahminleri, bölüm listesi.
- **Hatırlanmaz:** adet ve birim farkı onayları. Her karşılaştırmada yeniden sorulur; geçen aya bakıp kendiliğinden "doğru" demez.
- Karşılaştırma geçmişi saklanmaz.

## Rapor ekranı
- Seçici: Sorunlu / Onaylanan / Tümü, her birinin yanında sayı.
- Rapor sekmesinde sorunlu bölüm sayısı kırmızı rozet.
- Bölüme dokununca detay sağdan gelir; adet/birim farkı satırları sola kaydırılarak ya da "Doğru" düğmesiyle onaylanır.
- Hata satırına dokununca düzeltme penceresi açılır: hızlı düzeltmeler (siparişe ekle, siparişten çıkar, kodu düzelt, adedi forma eşitle) ve elle kod/adet düzenleme. Sonuç anında yeniden hesaplanır; düzeltmeler Rapor'un üstünde listelenir, "Son düzeltmeyi geri al" var. Sipariş düzeltmeleri gönderilen Düzeltilmiş Sipariş Excel'ine yansır; form düzeltmeleri sadece o karşılaştırmada geçerli.
- Eksik ve Fazla satırlarında (0.5, kullanıcı isteği): **Görmezden gel** (satırda ve düzeltme penceresinde; sadece o karşılaştırmada geçerli, hatırlanmaz, pencereden geri alınabilir). Fazla satırında ayrıca **Forma ekle**, Eksik satırında **Siparişe ekle**.
- Ayarlar: Bölüm listesi, bölüm eşleşmeleri, eşdeğer kodlar, öğrenilmiş kodlar ayrı sayfalarda; ekleme ve silme var; "Başlangıç ayarlarına dön".
- Ana sayfada "İstek formları" / "Sipariş listesi" başlıkları büyük ve kırmızı; Ayarlar başlıkları büyük.

## Birleşik liste
- Sipariş listesindeki aynı kodlar bölüme bakılmadan toplanır. Sütunlar: Kod | Ürün adı | Toplam adet.
- Sıralama: toplam adede göre büyükten küçüğe, eşitse kod sırası.
- Üstte özet: "176 satır → 103 satır · Toplam 4343 adet · sipariş listesiyle aynı".
- Her satırda toplama işlemi (= 4+210); dokununca hangi bölümden geldiği açılır. Arama kutusu var.
- Aynı kod farklı birimlerle geçerse uyarı (güvenlik önlemi; normalde olmaz).

## Çıktı
- İki **ayrı** Excel: Birlesik_Liste_GG.AA.YYYY.xlsx ve Duzeltilmis_Siparis_GG.AA.YYYY.xlsx. Mail öncesi dosya adları ve satır sayıları gösterilir, sonra iPhone paylaşım ekranından Mail.
- Hata raporu sadece ekranda.

## Görünüm
- Ana başlık "Sipariş kontrol" mavi. Sekmeler: İstek form / liste · Rapor · Birleşik · Ayarlar.
- "Excel seç" Excel yeşili, "Fotoğraf çek" turuncu.

## Test verisi
Kullanıcının 10.11.2026 tarihli 28 fotoğrafından aktarılan veriyle beklenen sonuç: 155 doğru satır (eşdeğer kod dahil), 25 bölüm (12 sorunlu, 13 onaylı), birleşik liste 176 → 103 satır, 4343 adet. Test Excel'leri gizli veri içerdiği için depoya konmaz.

## Yapılacaklar
1. Gerçek Excel dosyalarıyla deneme (kullanıcı iş bilgisayarından telefona atıp deneyecek).
2. DOKU formu kararı.
3. Fotoğrafın kalıp kalmayacağı / nasıl iyileştirileceği: kullanıcının kararı bekleniyor.
