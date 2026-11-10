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
- İkisi de yüklenince rapor kendiliğinden açılır (Karşılaştır düğmesi yok).
- Fotoğrafla okuma da olacak (yedek yol), okunanlar kaydetmeden önce kontrol ekranında gösterilecek. **Henüz yapılmadı.**

## Bölümler
- Sabit liste (30): MEDE, LOKAL, BOYAHANE İDARİ BİNA, İDARİ BİNA, YEMEKHANE, İÇ ALAN, TEST LAB, İPLİK LAB, BOYA LAB, SERA, ENERJİ, KOJEN, TEKİRDAĞ ENERJİ, SEVKİYAT, ARITMA, DOKUMA, BÜKÜM, GÜVENLİK, REVİR, HAM KONTROL, MAMÜL KONTROL, BOYAHANE, YARDIMCI İŞLETMELER, ÜRGE, SATINALMA, KARTELA, SERA YEMEKHANESİ, MUHASEBE, İDARİ BİNA SEKRETER, KONUT. Kullanıcı uygulamadan yeni bölüm ekleyebilir.
- Adlar **tahminle eşleştirilmez**. Sadece büyük-küçük harf, boşluk, nokta, tire farkı yok sayılır (TEKİRDAĞ-ENERJİ = TEKİRDAĞ ENERJİ, ÜR-GE = ÜRGE).
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
- Hatalar uygulama içinde düzeltilecek, sonuç anında yeniden hesaplanacak, düzeltme kaydı ekranda görünecek. **Düzeltme henüz yapılmadı.**

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
2. Uygulama içinde düzeltme + düzeltme kaydı + düzeltilmiş sipariş Excel'i.
3. Ayarlardaki listeleri düzenleme/silme.
4. Fotoğraftan okuma + kontrol ekranı.
5. DOKU formu kararı.
