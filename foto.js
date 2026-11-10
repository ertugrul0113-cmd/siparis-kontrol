// Fotoğraftan okuma: görüntüyü temizler ve okunan satırları istek formu / sipariş listesi kalemlerine çevirir.
// Tarayıcıda window.FOTO, Node'da module.exports. Okuma motoru (Tesseract) app.js tarafından çağrılır.
(function (root) {
  'use strict';

  // Gri tona çevir, gölgeyi gider (Sauvola eşikleme), tablo çizgilerini sil. Girdi: RGBA dizisi.
  function temizle(rgba, w, h) {
    const g = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    const W = w + 1, I = new Float64Array(W * (h + 1)), I2 = new Float64Array(W * (h + 1));
    for (let y = 0; y < h; y++) {
      let s = 0, s2 = 0;
      for (let x = 0; x < w; x++) {
        const v = g[y * w + x]; s += v; s2 += v * v;
        I[(y + 1) * W + x + 1] = I[y * W + x + 1] + s; I2[(y + 1) * W + x + 1] = I2[y * W + x + 1] + s2;
      }
    }
    const r = Math.max(10, Math.round(Math.min(w, h) / 60)), k = 0.2, R = 128;
    const b = new Uint8Array(w * h); // 1 = mürekkep
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r), n = (x1 - x0 + 1) * (y1 - y0 + 1);
        const A = (y1 + 1) * W + x1 + 1, B = y0 * W + x1 + 1, C = (y1 + 1) * W + x0, D = y0 * W + x0;
        const m = (I[A] - I[B] - I[C] + I[D]) / n, sd = Math.sqrt(Math.max(0, (I2[A] - I2[B] - I2[C] + I2[D]) / n - m * m));
        b[y * w + x] = g[y * w + x] < m * (1 + k * (sd / R - 1)) ? 1 : 0;
      }
    }
    // Uzun yatay ve dikey çizgileri sil (tablo çizgileri). Harfler bu kadar uzun olmaz.
    const yatay = Math.round(w * 0.06), dikey = Math.round(h * 0.035);
    const sil = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      let bas = -1;
      for (let x = 0; x <= w; x++) {
        const v = x < w && b[y * w + x];
        if (v && bas < 0) bas = x;
        if (!v && bas >= 0) { if (x - bas >= yatay) for (let i = bas; i < x; i++) sil[y * w + i] = 1; bas = -1; }
      }
    }
    for (let x = 0; x < w; x++) {
      let bas = -1;
      for (let y = 0; y <= h; y++) {
        const v = y < h && b[y * w + x];
        if (v && bas < 0) bas = y;
        if (!v && bas >= 0) { if (y - bas >= dikey) for (let i = bas; i < y; i++) sil[i * w + x] = 1; bas = -1; }
      }
    }
    // Çizgiye yapışık 1-2 piksellik kenarları da temizle.
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (sil[i]) continue;
      if (b[i] && ((sil[i - 1] && sil[i + 1]) || (sil[i - w] && sil[i + w]))) sil[i] = 2;
    }
    // Kâğıt kenarı, masa ve gölge lekeleri: mürekkebi çok yoğun sütun ve satırlar yazı değildir.
    for (let x = 0; x < w; x++) {
      let n = 0; for (let y = 0; y < h; y++) if (b[y * w + x] && !sil[y * w + x]) n++;
      if (n > h * 0.18) for (let y = 0; y < h; y++) sil[y * w + x] = 3;
    }
    for (let y = 0; y < h; y++) {
      let n = 0; for (let x = 0; x < w; x++) if (b[y * w + x] && !sil[y * w + x]) n++;
      if (n > w * 0.3) for (let x = 0; x < w; x++) sil[y * w + x] = 3;
    }
    // Küçük lekeler (tek başına 1-3 piksellik noktalar).
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!b[i] || sil[i]) continue;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && b[i + dy * w + dx] && !sil[i + dy * w + dx]) k++;
      if (k === 0) sil[i] = 4;
    }
    const t = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) t[i] = b[i] && !sil[i] ? 1 : 0;
    return harfDisiniSil(t, w, h);
  }

  // Birbirine değen mürekkep parçalarını bulur; harf boyutunda olmayanları (çizgi kırıntısı, leke, kenar) siler.
  function harfDisiniSil(t, w, h) {
    const etiket = new Int32Array(w * h), P = [], yigin = new Int32Array(w * h);
    let n = 0;
    for (let i = 0; i < w * h; i++) {
      if (!t[i] || etiket[i]) continue;
      n++; let sp = 0, alan = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
      yigin[sp++] = i; etiket[i] = n;
      while (sp) {
        const j = yigin[--sp], x = j % w, y = (j / w) | 0; alan++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x > 0 && t[j - 1] && !etiket[j - 1]) { etiket[j - 1] = n; yigin[sp++] = j - 1; }
        if (x < w - 1 && t[j + 1] && !etiket[j + 1]) { etiket[j + 1] = n; yigin[sp++] = j + 1; }
        if (y > 0 && t[j - w] && !etiket[j - w]) { etiket[j - w] = n; yigin[sp++] = j - w; }
        if (y < h - 1 && t[j + w] && !etiket[j + w]) { etiket[j + w] = n; yigin[sp++] = j + w; }
      }
      P[n] = { alan, g: x1 - x0 + 1, y: y1 - y0 + 1 };
    }
    // Tipik harf yüksekliği: orta boy parçaların yükseklik ortancası.
    const yk = P.filter(p => p && p.alan > 15 && p.y > 6 && p.g < p.y * 3 && p.y < h * 0.05).map(p => p.y).sort((a, b) => a - b);
    const hy = yk[yk.length >> 1] || 20;
    const tut = new Uint8Array(n + 1);
    for (let k = 1; k <= n; k++) {
      const p = P[k];
      const cokKucuk = p.alan < 5 || (p.y < hy * 0.15 && p.g < hy * 0.15);
      const cokUzun = p.y > hy * 2.6;
      const yatayCizgi = p.g > hy * 2 && p.y < hy * 0.35;
      const dikeyCizgi = p.y > hy * 1.25 && p.g < hy * 0.2;
      tut[k] = cokKucuk || cokUzun || yatayCizgi || dikeyCizgi ? 0 : 1;
    }
    const o = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) o[i] = etiket[i] && tut[etiket[i]] ? 1 : 0;
    o.harfY = hy;
    return o;
  }

  // Fotoğraf eğikse satırlar birbirine karışır: yatay izdüşümü en keskin yapan açıyı bul ve düzelt.
  function egimBul(t, w, h) {
    let enA = 0, enP = -1;
    for (let a = -5; a <= 5.001; a += 0.25) {
      const r = a * Math.PI / 180, s = Math.sin(r), c = Math.cos(r), say = new Float64Array(h * 2);
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (t[y * w + x]) { const yy = Math.round(y * c - x * s) + h / 2; if (yy >= 0 && yy < h * 2) say[yy | 0]++; }
      let p = 0; for (let i = 0; i < say.length; i++) p += say[i] * say[i];
      if (p > enP) { enP = p; enA = a; }
    }
    return enA;
  }
  function dondur(t, w, h, a) {
    if (!a) return t;
    const r = a * Math.PI / 180, s = Math.sin(r), c = Math.cos(r), o = new Uint8Array(w * h), cx = w / 2, cy = h / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = Math.round(c * (x - cx) - s * (y - cy) + cx), sy = Math.round(s * (x - cx) + c * (y - cy) + cy);
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) o[y * w + x] = t[sy * w + sx];
    }
    return o;
  }

  // Sayfayı yazı satırlarına böler: mürekkep olan satır bantları.
  function bantlar(t, w, h, hy) {
    hy = hy || 20;
    const say = new Int32Array(h);
    for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < w; x++) n += t[y * w + x]; say[y] = n; }
    // Eşik: yazılı satırların tipik mürekkep miktarının küçük bir kesri (çizgi kırıntıları bunun altında kalır).
    const dolu = Array.from(say).filter(v => v > 0).sort((a, b) => a - b);
    const p75 = dolu[Math.floor(dolu.length * 0.75)] || 0;
    const esik = Math.max(2, hy * 0.25, p75 * 0.2), B = [];
    let bas = -1, bos = 0;
    for (let y = 0; y <= h; y++) {
      const var_ = y < h && say[y] > esik;
      if (var_) { if (bas < 0) bas = y; bos = 0; }
      else if (bas >= 0 && ++bos >= 2) { B.push([bas, y - bos + 1]); bas = -1; bos = 0; }
    }
    // Birden fazla satır birleşmiş bloklar: en az mürekkepli yerden böl.
    const bol = (a, b) => {
      if (b - a <= hy * 1.9) return [[a, b]];
      let enY = -1, en = Infinity;
      for (let y = a + Math.round(hy * 0.7); y < b - Math.round(hy * 0.7); y++) if (say[y] < en) { en = say[y]; enY = y; }
      return enY < 0 ? [[a, b]] : bol(a, enY).concat(bol(enY + 1, b));
    };
    const parca = [];
    B.forEach(([a, b]) => parca.push(...bol(a, b)));
    return parca.filter(b => b[1] - b[0] >= hy * 0.4 && b[1] - b[0] <= hy * 2.2).map(([a, b]) => {
      let x0 = w, x1 = 0;
      for (let y = a; y < b; y++) for (let x = 0; x < w; x++) if (t[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      const p = Math.max(3, Math.round(hy * 0.2));
      return { y0: Math.max(0, a - p), y1: Math.min(h, b + p), x0: Math.max(0, x0 - hy), x1: Math.min(w, x1 + hy) };
    }).filter(b => b.x1 > b.x0);
  }

  // Bir bandı okuma motoruna verilecek beyaz zemin siyah yazı RGBA görüntüye çevirir.
  // Kenarına beyaz pay eklenir; okuma motoru kenara yapışık yazıyı kötü okur.
  function bantResmi(t, w, b) {
    const pay = Math.round((b.y1 - b.y0) * 0.3), bw = b.x1 - b.x0, bh = b.y1 - b.y0, W = bw + pay * 2, Hh = bh + pay * 2;
    const o = new Uint8ClampedArray(W * Hh * 4).fill(255);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      if (!t[(b.y0 + y) * w + b.x0 + x]) continue;
      const i = ((y + pay) * W + x + pay) * 4;
      o[i] = o[i + 1] = o[i + 2] = 0;
    }
    return { data: o, width: W, height: Hh };
  }

  // Tam hazırlık: temizle, eğimi düzelt, satır bantlarını çıkar.
  function hazirla(rgba, w, h) {
    let t = temizle(rgba, w, h);
    const hy = t.harfY, a = egimBul(t, w, h);
    t = dondur(t, w, h, a);
    return { t, w, h, egim: a, harfY: hy, bantlar: bantlar(t, w, h, hy) };
  }

  const BIRIMLER = ['ADET', 'ADT', 'AD', 'PAKET', 'PKT', 'PK', 'TOP', 'TP', 'KOLİ', 'KOLI', 'ÇİFT', 'CIFT', 'CF', 'ÇF', 'KG', 'KU', 'KT', 'BD', 'LT'];
  const up = s => String(s || '').toLocaleUpperCase('tr-TR');
  const birimMi = s => BIRIMLER.includes(up(s).replace(/[^A-ZÇĞİÖŞÜ]/g, ''));
  // Okuma motorunun rakamlarda sık yaptığı harf karışıklıkları.
  const rakamla = s => s.replace(/[Oo]/g, '0').replace(/[lI|İ]/g, '1').replace(/[S$]/g, '5').replace(/[B]/g, '8').replace(/[Z]/g, '2').replace(/[G]/g, '6');
  const kodMu = s => /^\d{2,7}$/.test(rakamla(s.replace(/[^\dA-Za-zİ|$]/g, '')));
  const kodAl = s => rakamla(s.replace(/[^\dA-Za-zİ|$]/g, ''));

  const BRX = '(ADET|ADT|AD|PAKET|PKT|PK|TOP|TP|KOL[İI]|[ÇC][İI]FT|[CÇ]F|KG|KU|KT|BD|LT)';
  const temizBas = s => s.replace(/^[^0-9A-Za-zÇĞİÖŞÜçğıöşü]+/, '').trim();
  const temizSon = s => s.replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü.)]+$/, '').trim();

  // Satır metnini parçalarına ayırır: kod | ad | adet | birim | bölüm
  function satirCoz(metin, tur) {
    let t = metin
      .replace(/(\d)[İIl|!](?=[A-ZÇĞÖŞÜ]{2})/g, '$1 ')       // "3İYEMEKHANE" → "3 YEMEKHANE" (çizgi İ diye okunmuş)
      .replace(/[|\[\]{}()“”"_»«!:;,©>]/g, ' ')
      .replace(/(\d)\.(?=[A-Za-zÇĞİÖŞÜ]|\s)/g, '$1 ')
      .replace(/(\d)\/(?=[A-Za-zÇĞİÖŞÜ])/g, '$1 ')
      .replace(/(^|\s)([SZGOIl])(AD|ADET|PK|PKT|TP|KG|CF|KU|BD)(?=\s|\.|$)/g, (m, a, h, b) => a + ({ S: 5, Z: 2, G: 6, O: 0, I: 1, l: 1 }[h]) + ' ' + b)
      .replace(/\s+/g, ' ').trim();
    if (!t) return null;
    // Kod: ilk 4 parçada duran 3-7 haneli sayı (öncesindeki kısa lekeler atılır, sonrasına yapışık yazı ayrılır).
    let kod = '';
    const p = t.split(' ');
    for (let i = 0; i < Math.min(4, p.length); i++) {
      const m = p[i].match(/^(\d{3,7})([A-Za-zÇĞİÖŞÜçğıöşü'].*)?$/);
      if (m) { kod = m[1]; p.splice(0, i + 1, ...(m[2] ? [m[2]] : [])); t = p.join(' '); break; }
      if (p[i].length > 3) break;
    }
    // Adet + birim: sağdan aranır. Önce "sayı birim" ya da "birim sayı" kalıbı, yoksa son tam sayı.
    const U = t.toLocaleUpperCase('tr-TR');
    let m = null, re = new RegExp('(?:^|\\s)(\\d{1,5})\\s*' + BRX + '(?=\\s|$|[^A-ZÇĞİÖŞÜ])', 'g'), x;
    while ((x = re.exec(U))) m = { i: x.index, son: x.index + x[0].length, miktar: x[1], birim: x[2] };
    if (!m) {
      re = new RegExp('(?:^|\\s)' + BRX + '\\s*(\\d{1,5})(?=\\s|$)', 'g');
      while ((x = re.exec(U))) m = { i: x.index, son: x.index + x[0].length, miktar: x[2], birim: x[1] };
    }
    if (!m) {
      re = /(?:^|\s)(\d{1,5})(?=\s|$)/g;
      while ((x = re.exec(U))) m = { i: x.index, son: x.index + x[0].length, miktar: x[1], birim: '' };
    }
    if (!m) return null;
    const ad = temizSon(temizBas(t.slice(0, m.i)));
    const bolum = temizSon(temizBas(t.slice(m.son)));
    if (!ad && !kod) return null;
    return { kod, ad, miktar: Number(m.miktar), birim: m.birim, bolum };
  }

  // Tesseract satırlarından kalemleri çıkarır. Güveni düşük satırlar işaretlenir.
  function cozumle(satirlar, tur) {
    const kalemler = [];
    let formNo = 0, bolumSon = '';
    for (const s of satirlar) {
      const u = up(s.text);
      if (u.includes('İSTEK FORMU') || u.includes('ISTEK FORMU')) { formNo++; bolumSon = ''; continue; }
      if (/MALZEME\s*(NUMARASI|TANIMI)|MLZ\s*NO|SİPARİŞ\s*Mİ|TALEBİ|AMİRİNİN|YEDEK PARÇA|GENEL MD/.test(u)) continue;
      const c = satirCoz(s.text, tur);
      if (!c) continue;
      if (tur === 'form') { if (c.bolum) bolumSon = c.bolum; else c.bolum = bolumSon; }
      c.guven = Math.round(s.confidence);
      c.form = Math.max(1, formNo);
      c.supheli = c.guven < 55 || !c.kod;
      kalemler.push(c);
    }
    return kalemler;
  }

  const FOTO = { temizle, hazirla, bantResmi, satirCoz, cozumle };
  if (typeof module !== 'undefined' && module.exports) module.exports = FOTO; else root.FOTO = FOTO;
})(typeof window !== 'undefined' ? window : globalThis);
