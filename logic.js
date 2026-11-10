// Sipariş kontrol: Excel okuma, karşılaştırma ve birleştirme mantığı.
// Arayüzden bağımsızdır; tarayıcıda window.SK, Node'da module.exports olarak kullanılır.
(function (root) {
  'use strict';

  const BOLUMLER = [
    'MEDE', 'LOKAL', 'BOYAHANE İDARİ BİNA', 'İDARİ BİNA', 'YEMEKHANE', 'İÇ ALAN', 'TEST LAB',
    'İPLİK LAB', 'BOYA LAB', 'SERA', 'ENERJİ', 'KOJEN', 'TEKİRDAĞ ENERJİ', 'SEVKİYAT', 'ARITMA',
    'DOKUMA', 'BÜKÜM', 'GÜVENLİK', 'REVİR', 'HAM KONTROL', 'MAMÜL KONTROL', 'BOYAHANE',
    'YARDIMCI İŞLETMELER', 'ÜRGE', 'SATINALMA', 'KARTELA', 'SERA YEMEKHANESİ', 'MUHASEBE',
    'İDARİ BİNA SEKRETER', 'KONUT'
  ];

  // Kullanıcının onayladığı bölüm eşleşmeleri (yazılış -> bölüm).
  const ESLESMELER = {
    'MEDE KİDS': 'MEDE', 'MEDE KIDS': 'MEDE',
    'ENERJİ ŞEFLİĞİ': 'KOJEN', 'ENERJİ ÜRETİM': 'ENERJİ',
    'BOYA&APRE MDR./BOYA LAB.ŞEFLİĞİ': 'BOYA LAB',
    'KUMAŞ TEST LAB/KGM': 'TEST LAB', 'İPLİK TEST LAB/KGM': 'İPLİK LAB',
    'H.K.K': 'HAM KONTROL', 'HAM KON': 'HAM KONTROL', 'MUH.': 'MUHASEBE'
  };

  const ESDEGER = { '152958': '179920' };

  const BIRIM = {
    AD: 'AD', ADET: 'AD', ADT: 'AD', PK: 'PK', PKT: 'PK', PAKET: 'PK', PAK: 'PK',
    TP: 'TP', TOP: 'TP', CF: 'CF', 'ÇF': 'CF', 'ÇİFT': 'CF', CIFT: 'CF',
    KOLİ: 'KOLİ', KOLI: 'KOLİ', KL: 'KOLİ', KU: 'KU', KUTU: 'KU', KG: 'KG', BD: 'BD', LT: 'LT'
  };

  const up = s => String(s == null ? '' : s).toLocaleUpperCase('tr-TR').trim();
  const sik = s => up(s).replace(/[^A-ZÇĞİÖŞÜ0-9+]/g, '');
  const birim = s => { const u = up(s).replace(/[^A-ZÇĞİÖŞÜ]/g, ''); return BIRIM[u] || u; };

  function kod(v) {
    const s = String(v == null ? '' : v).trim().replace(/\.0+$/, '');
    return /^\d{1,8}$/.test(s) ? String(parseInt(s, 10)) : '';
  }
  function sayi(v) {
    if (typeof v === 'number') return v;
    const s = String(v == null ? '' : v).trim().replace(',', '.');
    return /^\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }

  function bolumCoz(ham, ayar) {
    const n = sik(ham);
    if (!n) return ayar.eslesmeler[''] || null;
    for (const k in ayar.eslesmeler) if (sik(k) === n) return ayar.eslesmeler[k];
    return ayar.bolumler.find(b => sik(b) === n) || null;
  }

  // ---------- İstek formları ----------
  function basliktaMi(satir) {
    const t = satir.map(sik).join('|');
    return t.includes('MİKTAR') && (t.includes('MALZEMENUMARASI') || t.includes('JDADVERS'));
  }
  function sutunBul(a, b) {
    const s = {};
    const n = Math.max(a.length, (b || []).length);
    for (let i = 0; i < n; i++) {
      const t = sik(a[i]) + sik(b ? b[i] : '');
      if (s.jd == null && (t.includes('JDADVERS') || (t.includes('MALZEMENUMARASI') && !t.includes('LEO')))) s.jd = i;
      else if (s.leo == null && t.includes('LEO')) s.leo = i;
      else if (s.ad == null && t.includes('TANIM')) s.ad = i;
      else if (s.birim == null && t.includes('BİRİM')) s.birim = i;
      else if (s.miktar == null && t.includes('MİKTAR')) s.miktar = i;
      else if (s.bolum == null && t.includes('BÖLÜM')) s.bolum = i;
      else if (s.aciklama == null && t.includes('AÇIKLAMA')) s.aciklama = i;
    }
    return s;
  }

  function formlariOku(satirlar) {
    const formlar = [];
    let s = null, f = null;
    for (let r = 0; r < satirlar.length; r++) {
      const row = satirlar[r] || [];
      const metin = row.map(sik).join('|');
      if (basliktaMi(row)) {
        const sonraki = satirlar[r + 1] || [];
        const devam = sonraki.some(c => sik(c)) && !sonraki.some(c => !isNaN(sayi(c)) && sik(c));
        s = sutunBul(row, devam ? sonraki : null);
        if (devam) r++;
        f = { no: formlar.length + 1, satir: r + 1, kalemler: [] };
        formlar.push(f);
        continue;
      }
      if (!f) continue;
      if (metin.includes('TALEBİYAPAN') || metin.includes('MALZEMEİSTEKFORMU')) { f = null; continue; }
      const al = i => (i == null ? '' : row[i]);
      const ad = String(al(s.ad) || '').trim();
      const m = sayi(al(s.miktar));
      const jd = kod(al(s.jd)), leo = kod(al(s.leo));
      if (!ad && !jd && !leo && isNaN(m)) continue;
      f.kalemler.push({
        kod: jd || leo, ad, miktar: isNaN(m) ? 0 : m, birim: birim(al(s.birim)), birimHam: String(al(s.birim) || '').trim(),
        bolumHam: String(al(s.bolum) || '').trim(), aciklama: String(al(s.aciklama) || '').trim(), satir: r + 1
      });
    }
    return formlar.filter(x => x.kalemler.length);
  }

  // ---------- Sipariş listesi ----------
  function siparisOku(satirlar) {
    let s = null; const kalemler = [];
    for (let r = 0; r < satirlar.length; r++) {
      const row = satirlar[r] || [];
      const t = row.map(sik);
      if (t.some(x => x.startsWith('MLZNO'))) {
        s = {};
        t.forEach((x, i) => {
          if (x.startsWith('MLZNO')) s.kod = i;
          else if (x.includes('TANIMI1')) s.ad1 = i;
          else if (x.includes('TANIMI2')) s.ad2 = i;
          else if (x.includes('SİPARİŞ')) s.miktar = i;
          else if (x.includes('İŞLEM') || x === 'ÖB') s.birim = i;
          else if (x.includes('AÇIKLAMA') && s.bolum == null) s.bolum = i;
        });
        continue;
      }
      if (!s) continue;
      const k = kod(row[s.kod]), m = sayi(row[s.miktar]);
      if (!k || isNaN(m)) continue;
      const ad = [row[s.ad1], row[s.ad2]].filter(x => x != null && String(x).trim()).map(x => String(x).trim());
      kalemler.push({ kod: k, ad: ad[0] || '', ad2: ad[1] || '', miktar: m, birim: birim(row[s.birim]), birimHam: String(row[s.birim] || '').trim(), bolumHam: String(row[s.bolum] || '').trim(), satir: r + 1 });
    }
    if (!s) throw new Error('Sipariş listesinde "Mlz No." başlığı bulunamadı.');
    return kalemler;
  }

  // ---------- Bölüm soruları ----------
  // Formun bölüm sütunu tamamen boşsa form için, bölüm adı tanınmıyorsa ad için soru üretir.
  function sorular(formlar, siparis, ayar, cevaplar) {
    const q = [], gor = new Set();
    for (const f of formlar) {
      const dolu = f.kalemler.find(k => k.bolumHam);
      if (!dolu) {
        if (!cevaplar.form[f.no]) q.push({ tur: 'form', anahtar: f.no, ipucu: f.kalemler[0].aciklama, ornek: f.kalemler.slice(0, 3).map(k => k.ad) });
        continue;
      }
      for (const k of f.kalemler) {
        const h = k.bolumHam || dolu.bolumHam;
        if (!bolumCoz(h, ayar) && !gor.has(sik(h))) { gor.add(sik(h)); q.push({ tur: 'ad', anahtar: h, taraf: 'İstek formu' }); }
      }
    }
    for (const k of siparis) {
      if (!bolumCoz(k.bolumHam, ayar) && !gor.has(sik(k.bolumHam))) { gor.add(sik(k.bolumHam)); q.push({ tur: 'ad', anahtar: k.bolumHam, taraf: 'Sipariş listesi' }); }
    }
    return q;
  }

  // ---------- Ad benzerliği (kodsuz satırlar için) ----------
  function ikili(s) { const t = sik(s), b = new Map(); for (let i = 0; i < t.length - 1; i++) { const x = t.substr(i, 2); b.set(x, (b.get(x) || 0) + 1); } return b; }
  function benzerlik(a, b) {
    const A = ikili(a), B = ikili(b); let o = 0, na = 0, nb = 0;
    A.forEach((v, k) => { na += v; if (B.has(k)) o += Math.min(v, B.get(k)); });
    B.forEach(v => { nb += v; });
    if (!(na + nb)) return 0;
    // Ana kelime (ör. marka) ortak değilse benzer sayma: "Pril deterjanı" ile "Fairy deterjanı" eşleşmesin.
    const kel = s => up(s).split(/[^A-ZÇĞİÖŞÜ0-9]+/).filter(w => w.length >= 3);
    const ka = kel(a), kb = kel(b);
    if (!ka.length || !kb.length || !(kb.includes(ka[0]) || ka.includes(kb[0]))) return 0;
    return (2 * o) / (na + nb);
  }

  // ---------- Karşılaştırma ----------
  function karsilastir(formlar, siparis, ayar, cevaplar, durum) {
    durum = durum || { onay: {}, red: {} };
    const es = ayar.esdeger, eskiKodlar = new Set(Object.keys(es));
    const ortak = k => es[k] || k;

    // ref: düzeltme ekranının asıl satırı bulabilmesi için [form sırası, kalem sırası] / sipariş satır sırası.
    const F = [];
    formlar.forEach((f, fi) => {
      const dolu = f.kalemler.find(k => k.bolumHam);
      f.kalemler.forEach((k, ki) => {
        const b = dolu ? bolumCoz(k.bolumHam || dolu.bolumHam, ayar) : bolumCoz(cevaplar.form[f.no], ayar);
        F.push(Object.assign({}, k, { bolum: b, form: f.no, ref: [fi, ki] }));
      });
    });
    const S = siparis.map((k, i) => Object.assign({}, k, { bolum: bolumCoz(k.bolumHam, ayar), ref: i }));

    const bolumAdlari = [...new Set([...F, ...S].map(x => x.bolum).filter(Boolean))];
    const bolumler = [];

    for (const b of bolumAdlari) {
      const fb = F.filter(x => x.bolum === b), sb = S.filter(x => x.bolum === b);
      const sorun = [], dogru = [];
      const ekle = o => { o.id = b + '|' + o.tip + '|' + (o.kod || o.ad) + '|' + (o.kod2 || ''); o.onayli = !!durum.onay[o.id]; sorun.push(o); };

      if (!fb.length) {
        bolumler.push({ ad: b, formYok: true, sorun: [{ tip: 'FORMYOK', id: b + '|FORMYOK', not: sb.length + ' kalem siparişte var', sRef: sb.map(x => x.ref) }], dogru: [], siparis: sb });
        continue;
      }

      // Kodsuz satırlar: önce öğrenilmiş adlar, sonra benzerlik tahmini.
      const formKodlari = new Set(fb.filter(x => x.kod).map(x => ortak(x.kod)));
      for (const x of fb.filter(x => !x.kod)) {
        const og = ayar.ogrenilen[sik(x.ad)];
        if (og) { x.kod = og; x.ogrenildi = true; continue; }
        let en = null, puan = 0;
        const havuz = sb.filter(s => !formKodlari.has(ortak(s.kod))).map(s => ({ kod: s.kod, ad: s.ad + ' ' + s.ad2, kaynak: 'sipariş' }))
          .concat(F.filter(y => y.kod && y !== x).map(y => ({ kod: y.kod, ad: y.ad, kaynak: (y.bolum || '') + ' formu' })));
        for (const h of havuz) {
          if (formKodlari.has(ortak(h.kod)) || durum.red[b + '|' + sik(x.ad) + '|' + h.kod]) continue;
          const p = benzerlik(x.ad, h.ad); if (p > puan) { puan = p; en = h; }
        }
        if (en && puan >= 0.6) { x.kod = en.kod; x.tahmin = en; formKodlari.add(ortak(en.kod)); }
        else ekle({ tip: 'KODSUZ', ad: x.ad, form: x.miktar, fBirim: x.birimHam, fRef: [x.ref] });
      }

      // Aynı bölüm formunda aynı kod birden fazla satırda.
      const say = {};
      fb.filter(x => x.kod).forEach(x => { (say[x.kod] = say[x.kod] || []).push(x); });
      for (const k in say) if (say[k].length > 1) ekle({ tip: 'CAKISMA', kod: k, ad: say[k].map(x => x.ad).join(' / '), not: say[k].length + ' satırda yazılmış', fRef: say[k].map(x => x.ref) });

      // Tahminler onaya sunulur.
      fb.filter(x => x.tahmin).forEach(x => ekle({ tip: 'TAHMIN', kod: x.tahmin.kod, ad: x.ad, not: '"' + x.tahmin.ad.trim() + '" (' + x.tahmin.kaynak + ') ile eşleşti', anahtarAd: sik(x.ad), fRef: [x.ref] }));

      // Siparişte eşdeğeri olan eski kod.
      sb.filter(x => eskiKodlar.has(x.kod)).forEach(x => ekle({ tip: 'ESKIKOD', kod: x.kod, kod2: es[x.kod], ad: x.ad, not: es[x.kod] + ' olarak geçilmeliydi', sRef: [x.ref] }));

      const G = new Map();
      const topla = (x, taraf) => {
        if (!x.kod) return;
        const k = ortak(x.kod);
        const g = G.get(k) || { kod: k, fKod: new Set(), sKod: new Set(), f: 0, s: 0, fB: new Set(), sB: new Set(), fAd: '', sAd: '', var: { f: false, s: false }, fRef: [], sRef: [] };
        g[taraf] += x.miktar; g.var[taraf] = true; g[taraf + 'Ref'].push(x.ref);
        g[taraf + 'Kod'].add(x.kod); g[taraf + 'B'].add(x.birim);
        if (!g[taraf + 'Ad']) g[taraf + 'Ad'] = x.ad;
        G.set(k, g);
      };
      fb.forEach(x => topla(x, 'f')); sb.forEach(x => topla(x, 's'));

      const eksik = [], fazla = [];
      for (const g of G.values()) {
        const fk = [...g.fKod].join('/'), sk = [...g.sKod].join('/');
        const esd = g.var.f && g.var.s && fk !== sk ? fk + ' ≡ ' + sk : '';
        const ad = g.sAd || g.fAd;
        const ref = { fRef: g.fRef, sRef: g.sRef };
        if (g.var.f && !g.var.s) eksik.push(Object.assign({ tip: 'EKSIK', kod: fk, ad: g.fAd, form: g.f, fBirim: [...g.fB].join('/') }, ref));
        else if (!g.var.f && g.var.s) fazla.push(Object.assign({ tip: 'FAZLA', kod: sk, ad: g.sAd, siparis: g.s, sBirim: [...g.sB].join('/') }, ref));
        else if (g.f === g.s) dogru.push(Object.assign({ kod: sk, ad, miktar: g.s, birim: [...g.sB].join('/'), not: esd ? 'Eşdeğer kod: ' + esd : '' }, ref));
        else {
          const birimFarkli = [...g.fB].join() !== [...g.sB].join();
          ekle(Object.assign({ tip: birimFarkli ? 'BIRIM' : 'ADET', kod: sk, ad, form: g.f, siparis: g.s, fBirim: [...g.fB].join('/'), sBirim: [...g.sB].join('/'), not: esd ? 'Eşdeğer kod: ' + esd : '' }, ref));
        }
      }
      // Aynı adetli bir eksik ve bir fazla: muhtemel kod hatası.
      for (const e of eksik.slice()) {
        const i = fazla.findIndex(z => z.siparis === e.form);
        if (i < 0) continue;
        const z = fazla.splice(i, 1)[0];
        eksik.splice(eksik.indexOf(e), 1);
        ekle({ tip: 'KODHATA', kod: e.kod, kod2: z.kod, ad: e.ad, ad2: z.ad, form: e.form, siparis: z.siparis, fRef: e.fRef, sRef: z.sRef });
      }
      eksik.forEach(ekle); fazla.forEach(ekle);
      bolumler.push({ ad: b, sorun, dogru });
    }

    for (const b of bolumler) b.acik = b.sorun.filter(x => !x.onayli).length;
    bolumler.sort((a, b) => (b.acik - a.acik) || a.ad.localeCompare(b.ad, 'tr'));
    return { bolumler, birlesik: birlestir(siparis), dogruSatir: bolumler.reduce((t, b) => t + b.dogru.length, 0) };
  }

  // ---------- Birleşik liste ----------
  function birlestir(siparis) {
    const M = new Map();
    for (const x of siparis) {
      const g = M.get(x.kod) || { kod: x.kod, ad: x.ad, ad2: x.ad2, toplam: 0, parcalar: [], birimler: new Set() };
      g.toplam += x.miktar; g.parcalar.push({ bolum: x.bolumHam, miktar: x.miktar }); g.birimler.add(x.birim);
      M.set(x.kod, g);
    }
    const satirlar = [...M.values()].map(g => Object.assign(g, { birim: [...g.birimler].join('/'), birimUyari: g.birimler.size > 1 }))
      .sort((a, b) => (b.toplam - a.toplam) || (Number(a.kod) - Number(b.kod)));
    const toplam = siparis.reduce((t, x) => t + x.miktar, 0);
    return { satirlar, kaynakSatir: siparis.length, toplam, kontrol: satirlar.reduce((t, x) => t + x.toplam, 0) };
  }

  const varsayilanAyar = () => ({ bolumler: BOLUMLER.slice(), eslesmeler: Object.assign({}, ESLESMELER), esdeger: Object.assign({}, ESDEGER), ogrenilen: {} });

  const SK = { formlariOku, siparisOku, sorular, karsilastir, birlestir, bolumCoz, varsayilanAyar, benzerlik, sik, birim };
  if (typeof module !== 'undefined' && module.exports) module.exports = SK; else root.SK = SK;
})(typeof window !== 'undefined' ? window : globalThis);
