(function () {
  'use strict';
  const SURUM = '0.2 · 10.11.2026';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IC = {
    check: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    table: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M10 4v16"/></svg>',
    cam: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    chev: '<span class="ch">&#x203A;</span>',
    help: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/></svg>',
    mail: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    xls: '<svg class="ic" style="width:30px;height:30px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 12l4 5M13 12l-4 5"/></svg>',
    search: '<svg class="ic" style="width:18px;height:18px;color:var(--t2)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>'
  };

  // ---------- Kalıcı ayarlar ----------
  const ANAHTAR = 'siparis-kontrol-ayar-v1';
  function ayarYukle() {
    const v = SK.varsayilanAyar();
    try { const k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); if (k) return Object.assign(v, k); } catch (e) { }
    return v;
  }
  function ayarKaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(ayar)); } catch (e) { } }
  let ayar = ayarYukle();

  // ---------- Oturum durumu (onaylar kaydedilmez) ----------
  const D = { form: null, formDosya: '', sip: null, sipDosya: '', cevap: { form: {} }, durum: { onay: {}, red: {} }, sonuc: null, filtre: 0, acikBolum: null, ara: '', yukleniyor: '', kayit: [], gecmis: [], ayarSayfa: null };

  function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.z); toast.z = setTimeout(() => t.classList.remove('on'), 2600); }

  // ---------- Gezinme ----------
  const T = [0, 1, 2, 3].map(i => $('t' + i));
  let aktif = 0;
  function sekme(i) {
    aktif = i; geri(true); ayarGeri(true); sayfaKapat();
    T.forEach((t, j) => t.className = 'scr' + (j === i ? '' : ' off'));
    document.querySelectorAll('#tb button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  }
  function ileri() { T[1].className = 'scr pl'; $('d1').className = 'scr'; $('d1').scrollTop = 0; }
  function geri(sessiz) { $('d1').className = 'scr pr'; if (!sessiz) T[1].className = 'scr'; }
  function ayarIleri() { T[3].className = 'scr pl'; $('d3').className = 'scr'; $('d3').scrollTop = 0; }
  function ayarGeri(sessiz) { D.ayarSayfa = null; $('d3').className = 'scr pr'; if (!sessiz) T[3].className = 'scr'; }
  document.querySelectorAll('#tb button').forEach(b => b.onclick = () => sekme(+b.dataset.i));
  function sayfaAc(html) { $('st').innerHTML = '<div class="gb"></div>' + html; $('ov').classList.add('on'); $('st').classList.add('on'); }
  function sayfaKapat() { $('ov').classList.remove('on'); $('st').classList.remove('on'); }
  $('ov').onclick = () => { if (!bekleyenSoru()) sayfaKapat(); };

  // ---------- Excel okuma ----------
  function tabloOku(dosya) {
    return dosya.arrayBuffer().then(buf => {
      const wb = XLSX.read(buf, { type: 'array' });
      let satirlar = [];
      wb.SheetNames.forEach(n => { satirlar = satirlar.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: true })); satirlar.push([]); });
      return satirlar;
    });
  }
  $('fForm').onchange = e => dosyaAl(e.target, 'form');
  $('fSip').onchange = e => dosyaAl(e.target, 'sip');
  function dosyaAl(inp, tur) {
    const f = inp.files[0]; inp.value = '';
    if (!f) return;
    D.yukleniyor = tur; ciz0();
    tabloOku(f).then(rows => {
      if (tur === 'form') {
        const x = SK.formlariOku(rows);
        if (!x.length) throw new Error('Bu dosyada istek formu bulunamadı. "Malzeme Numarası" ve "Miktar" başlıklı tablo arandı.');
        D.form = x; D.formDosya = f.name; D.cevap = { form: {} };
      } else { D.sip = SK.siparisOku(rows); D.sipDosya = f.name; }
      D.durum = { onay: {}, red: {} }; D.sonuc = null; D.kayit = []; D.gecmis = [];
    }).catch(err => toast(err.message || 'Dosya okunamadı.')).then(() => { D.yukleniyor = ''; ciz0(); if (D.form && D.sip) setTimeout(baslat, 500); });
  }

  // ---------- Bölüm soruları ----------
  function bekleyenSoru() { return D.form && D.sip ? SK.sorular(D.form, D.sip, ayar, D.cevap)[0] : null; }
  function baslat() {
    const q = bekleyenSoru();
    if (q) { soruGoster(q); return; }
    sayfaKapat(); hesapla(); sekme(1);
  }
  function soruGoster(q) {
    const toplam = SK.sorular(D.form, D.sip, ayar, D.cevap).length;
    const baslik = q.tur === 'form' ? 'Bu formun bölümü yazılmamış' : '"' + esc(q.anahtar) + '" hangi bölüm?';
    const alt = q.tur === 'form'
      ? 'Formdaki ilk kalemler: ' + esc(q.ornek.join(', ')) + (q.ipucu ? '<br>Açıklama: ' + esc(q.ipucu) : '')
      : esc(q.taraf) + ' içinde geçiyor. Seçimin hatırlanacak.';
    sayfaAc(`<div style="display:flex;gap:10px;align-items:flex-start;color:var(--oT);margin-bottom:6px">${IC.help}<div><div style="font-weight:600;font-size:17px">${baslik}</div><div class="sm" style="margin-top:4px">${alt}</div></div></div>
      <div class="sm" style="margin:0 4px 8px">${toplam} soru kaldı</div>
      <div class="gr" style="margin-bottom:10px"><input class="ti" id="bAra" placeholder="Bölüm ara"></div>
      <div class="gr" id="bSec"></div>
      <div class="sh">Listede yok mu?</div>
      <div class="gr"><div class="cl"><input class="ti" id="bYeni" style="padding:0" placeholder="Yeni bölüm adı"><button class="lb" id="bEkle">Ekle</button></div></div>`);
    const liste = () => {
      const a = SK.sik($('bAra').value);
      $('bSec').innerHTML = ayar.bolumler.filter(b => !a || SK.sik(b).includes(a)).map(b => `<div class="cl tp" data-b="${esc(b)}"><span class="f1">${esc(b)}</span>${IC.chev}</div>`).join('') || '<div class="cl sm">Eşleşen bölüm yok</div>';
      $('bSec').querySelectorAll('[data-b]').forEach(e => e.onclick = () => cevapla(q, e.dataset.b));
    };
    $('bAra').oninput = liste; liste();
    $('bEkle').onclick = () => {
      const ad = $('bYeni').value.trim().toLocaleUpperCase('tr-TR');
      if (!ad) { toast('Önce bölüm adını yaz.'); return; }
      if (!ayar.bolumler.some(b => SK.sik(b) === SK.sik(ad))) ayar.bolumler.push(ad);
      cevapla(q, ad);
    };
  }
  function cevapla(q, bolum) {
    if (q.tur === 'form') D.cevap.form[q.anahtar] = bolum;
    else if (SK.sik(q.anahtar) !== SK.sik(bolum)) ayar.eslesmeler[q.anahtar] = bolum;
    ayarKaydet();
    baslat();
  }

  // ---------- Hesap ----------
  function hesapla() { D.sonuc = SK.karsilastir(D.form, D.sip, ayar, D.cevap, D.durum); cizHepsi(); }
  function cizHepsi() { ciz0(); ciz1(); if (D.acikBolum) cizDetay(); ciz2(); ciz3(); cizAyarDetay(); }

  // ---------- 0: İstek form / liste ----------
  function yuklemeGrubu(baslik, tur, dosya, bilgi) {
    const yuk = D.yukleniyor === tur;
    return `<div class="shk">${baslik}</div><div class="gr">
      ${yuk ? '<div class="cl"><span class="sp"></span><span class="f1">Okunuyor…</span></div>' : dosya ? `<div class="cl"><span style="color:var(--green)">${IC.check}</span><div class="f1">${esc(dosya)}<div class="sm">${bilgi}</div></div></div>` : ''}
      <div class="cl tp xl" data-f="${tur}">${IC.table}<span class="f1">Excel seç</span>${IC.chev}</div>
      <div class="cl tp ft" data-foto="1">${IC.cam}<span class="f1">Fotoğraf çek</span>${IC.chev}</div></div>`;
  }
  function ciz0() {
    const fs = D.form ? D.form.length + ' form · ' + D.form.reduce((t, f) => t + f.kalemler.length, 0) + ' satır' : '';
    T[0].innerHTML = `<div class="lt" style="color:var(--blue)">Sipariş kontrol</div>
      ${yuklemeGrubu('İstek formları', 'form', D.formDosya, fs)}
      ${yuklemeGrubu('Sipariş listesi', 'sip', D.sipDosya, D.sip ? D.sip.length + ' satır' : '')}
      <div class="sm" style="text-align:center;margin-top:18px">${D.form && D.sip ? (bekleyenSoru() ? '<button class="lb" id="soruAc">Bekleyen bölüm sorusunu cevapla</button>' : 'Karşılaştırma hazır, Rapor sekmesine bakabilirsin') : 'İkisi de yüklenince rapor kendiliğinden açılır'}</div>`;
    T[0].querySelectorAll('[data-f]').forEach(e => e.onclick = () => $(e.dataset.f === 'form' ? 'fForm' : 'fSip').click());
    T[0].querySelectorAll('[data-foto]').forEach(e => e.onclick = () => toast('Fotoğraftan okuma bir sonraki aşamada eklenecek.'));
    if ($('soruAc')) $('soruAc').onclick = baslat;
  }

  // ---------- 1: Rapor ----------
  const ETIKET = { EKSIK: ['Eksik', 'r'], FAZLA: ['Fazla', 'r'], CAKISMA: ['Kod çakışması', 'r'], KODHATA: ['Kod hatası?', 'p'], ESKIKOD: ['Eski kod', 'p'], ADET: ['Adet farkı', 'o'], BIRIM: ['Birim farkı', 'o'], TAHMIN: ['Tahmin', 'b'], KODSUZ: ['Kodsuz', 'n'], FORMYOK: ['Form yok', 'n'] };
  const SIRA = ['CAKISMA', 'EKSIK', 'FAZLA', 'KODHATA', 'ESKIKOD', 'TAHMIN', 'KODSUZ', 'BIRIM', 'ADET', 'FORMYOK'];
  const etiket = s => s.onayli ? '<span class="ip i-g">Onaylandı</span>' : `<span class="ip i-${ETIKET[s.tip][1]}">${ETIKET[s.tip][0]}</span>`;

  function ciz1() {
    const R = D.sonuc;
    if (!R) { T[1].innerHTML = '<div class="lt">Rapor</div><div class="bos">İstek formlarını ve sipariş listesini yükleyince rapor burada görünür.</div>'; $('bdg').hidden = true; return; }
    R.bolumler.forEach(b => { b.acik = b.sorun.filter(x => !x.onayli).length; });
    const sor = R.bolumler.filter(b => b.acik).length, tum = R.bolumler.length;
    $('bdg').textContent = sor; $('bdg').hidden = !sor;
    const L = R.bolumler.filter(b => D.filtre === 2 || (D.filtre === 0 ? b.acik : !b.acik));
    const seg = (i, ad, n, renk) => `<button data-v="${i}" class="${D.filtre === i ? 'on' : ''}">${ad} <b style="${renk}">${n}</b></button>`;
    T[1].innerHTML = `<div class="lt">Rapor</div>
      <div class="sg">${seg(0, 'Sorunlu', sor, 'background:var(--red);color:#fff')}${seg(1, 'Onaylanan', tum - sor, 'background:var(--green);color:#fff')}${seg(2, 'Tümü', tum, 'background:var(--fill2)')}</div>
      ${D.kayit.length ? `<div class="sh">Düzeltmeler (${D.kayit.length})</div><div class="gr">${D.kayit.slice().reverse().map(k => `<div class="cl" style="font-size:14px"><span class="sm" style="flex:none">${k.saat}</span><span class="f1">${esc(k.metin)}</span></div>`).join('')}<button class="cl tp lb" id="geriAl" style="width:100%;justify-content:center">Son düzeltmeyi geri al</button></div>` : ''}
      <div class="sh">${R.dogruSatir} satır doğru · ${tum} bölüm</div>
      <div class="gr">${L.map(b => {
        const ilk = b.sorun.filter(x => !x.onayli).sort((a, c) => SIRA.indexOf(a.tip) - SIRA.indexOf(c.tip))[0];
        return `<div class="cl tp" data-b="${esc(b.ad)}"><div class="f1">${esc(b.ad)}<div class="sm">${b.acik ? b.acik + ' sorun' : 'Hepsi doğru'} · ${b.dogru.length} doğru satır</div></div>${ilk ? etiket(ilk) : '<span class="ip i-g">Onaylandı</span>'}${IC.chev}</div>`;
      }).join('') || '<div class="cl sm">Bu grupta bölüm yok</div>'}</div>`;
    T[1].querySelectorAll('.sg button').forEach(b => b.onclick = () => { D.filtre = +b.dataset.v; ciz1(); });
    T[1].querySelectorAll('[data-b]').forEach(e => e.onclick = () => { D.acikBolum = e.dataset.b; cizDetay(); ileri(); });
    if ($('geriAl')) $('geriAl').onclick = geriAl;
  }

  // ---------- Düzeltme ----------
  const saat = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function anlik() { D.gecmis.push({ form: JSON.stringify(D.form), sip: JSON.stringify(D.sip), n: D.kayit.length }); }
  function kaydet(metinler) { const s = saat(); metinler.forEach(m => D.kayit.push({ saat: s, metin: m })); }
  function geriAl() {
    const g = D.gecmis.pop(); if (!g) return;
    D.form = JSON.parse(g.form); D.sip = JSON.parse(g.sip); D.kayit.length = g.n;
    hesapla(); toast('Son düzeltme geri alındı.');
  }
  function duzeltAc(s, b) {
    const fr = (s.fRef || []).map(r => ({ r, k: D.form[r[0]].kalemler[r[1]] }));
    const sr = (s.sRef || []).map(i => ({ i, k: D.sip[i] }));
    const q = [];
    const yap = (ad, fn) => q.push({ ad, fn });
    if (s.tip === 'EKSIK' && fr.length) yap('Siparişe ekle (' + s.form + ')', () => {
      const k = fr[0].k;
      D.sip.push({ kod: s.kod.split('/')[0], ad: k.ad, ad2: '', miktar: s.form, birim: k.birim, birimHam: k.birimHam || k.birim, bolumHam: b, satir: 0 });
      return [b + ': ' + s.kod + ' ' + k.ad + ' siparişe eklendi (' + s.form + ')'];
    });
    if (s.tip === 'FAZLA' && sr.length) yap('Siparişten çıkar', () => {
      sr.map(x => x.i).sort((a, c) => c - a).forEach(i => D.sip.splice(i, 1));
      return [b + ': ' + s.kod + ' ' + s.ad + ' siparişten çıkarıldı (' + s.siparis + ')'];
    });
    if (s.tip === 'KODHATA') {
      yap('Siparişteki kodu ' + s.kod + ' yap', () => { sr.forEach(x => { x.k.kod = s.kod; }); return [b + ': siparişte kod ' + s.kod2 + ' → ' + s.kod]; });
      yap('Formdaki kodu ' + s.kod2 + ' yap', () => { fr.forEach(x => { x.k.kod = s.kod2; }); return [b + ': formda kod ' + s.kod + ' → ' + s.kod2]; });
    }
    if ((s.tip === 'ADET' || s.tip === 'BIRIM') && sr.length === 1) yap('Siparişi ' + s.form + ' yap', () => { const e = sr[0].k.miktar; sr[0].k.miktar = s.form; return [b + ': ' + s.kod + ' sipariş adedi ' + e + ' → ' + s.form]; });
    if (s.tip === 'ESKIKOD') yap('Siparişte ' + s.kod2 + ' yap', () => { sr.forEach(x => { x.k.kod = s.kod2; }); return [b + ': siparişte eski kod ' + s.kod + ' → ' + s.kod2]; });

    const [m1, m2] = satirMetni(s);
    const satir = (taraf, idx, k, silinir) => `<div class="cl" style="flex-wrap:wrap;gap:8px">
        <div style="flex-basis:100%;font-size:14px;display:flex;gap:8px;align-items:center"><span class="ip i-${taraf === 'f' ? 'b' : 'n'}">${taraf === 'f' ? 'Form' : 'Sipariş'}</span><span class="f1" data-ad="${taraf}${idx}">${esc(k.ad)}</span>${silinir ? `<button class="sil" data-sil="${idx}">Sil</button>` : ''}</div>
        <label class="fi" style="flex:2">Kod<input data-${taraf}k="${idx}" value="${esc(k.kod)}" inputmode="numeric"></label>
        <label class="fi" style="flex:1">Adet<input data-${taraf}m="${idx}" value="${k.miktar}" inputmode="decimal"></label></div>`;
    sayfaAc(`<div style="display:flex;gap:8px;align-items:center">${etiket(s)}<span class="sm">${esc(b)}</span></div>
      <div style="font-weight:600;font-size:17px;margin-top:8px">${esc(m1)}</div><div class="sm">${esc(m2)}</div>
      ${q.length ? '<div class="sha" style="margin-left:2px">Hızlı düzeltme</div><div class="qa">' + q.map((x, i) => `<button data-q="${i}">${esc(x.ad)}</button>`).join('') + '</div>' : ''}
      ${fr.length + sr.length ? '<div class="sha" style="margin-left:2px">Elle düzelt</div><div class="gr">' + fr.map((x, i) => satir('f', i, x.k, false)).join('') + sr.map((x, i) => satir('s', i, x.k, true)).join('') + '</div>' : ''}
      <div class="sm" style="margin:10px 4px">Sipariş listesindeki düzeltmeler mail ile gönderilen Excel'e yansır. Formdaki düzeltmeler sadece bu karşılaştırmada geçerlidir.</div>
      ${fr.length + sr.length ? '<button class="pb" id="dzKaydet">Kaydet</button>' : ''}<button class="lb" id="dzVaz" style="display:block;width:100%;margin-top:16px">Vazgeç</button>`);
    const silinen = new Set();
    $('st').querySelectorAll('[data-sil]').forEach(e => e.onclick = () => {
      const i = +e.dataset.sil; silinen.has(i) ? silinen.delete(i) : silinen.add(i);
      e.textContent = silinen.has(i) ? 'Geri al' : 'Sil';
      $('st').querySelector('[data-ad="s' + i + '"]').classList.toggle('ust', silinen.has(i));
    });
    $('st').querySelectorAll('[data-q]').forEach(e => e.onclick = () => { anlik(); kaydet(q[+e.dataset.q].fn()); sayfaKapat(); hesapla(); toast('Düzeltildi.'); });
    $('dzVaz').onclick = sayfaKapat;
    if ($('dzKaydet')) $('dzKaydet').onclick = () => {
      const oku = (sel, i) => $('st').querySelector('[data-' + sel + '="' + i + '"]').value.trim();
      const deg = [], uygula = [];
      let hata = '';
      const kontrol = (taraf, x, i, yer) => {
        const kod = oku(taraf + 'k', i).replace(/\D/g, ''), m = Number(oku(taraf + 'm', i).replace(',', '.'));
        if (isNaN(m) || m < 0) { hata = 'Adet bir sayı olmalı.'; return; }
        if (kod !== String(x.k.kod || '')) { deg.push(b + ': ' + yer + ' ' + (x.k.ad || '') + ' kod ' + (x.k.kod || 'boş') + ' → ' + (kod || 'boş')); uygula.push(() => { x.k.kod = kod; }); }
        if (m !== x.k.miktar) { deg.push(b + ': ' + yer + ' ' + (x.k.kod || x.k.ad) + ' adet ' + x.k.miktar + ' → ' + m); uygula.push(() => { x.k.miktar = m; }); }
      };
      fr.forEach((x, i) => kontrol('f', x, i, 'formda'));
      sr.forEach((x, i) => { if (!silinen.has(i)) kontrol('s', x, i, 'siparişte'); });
      if (hata) { toast(hata); return; }
      silinen.forEach(i => deg.push(b + ': ' + sr[i].k.kod + ' ' + sr[i].k.ad + ' siparişten silindi'));
      if (!deg.length) { sayfaKapat(); return; }
      anlik();
      uygula.forEach(f => f());
      [...silinen].map(i => sr[i].i).sort((a, c) => c - a).forEach(i => D.sip.splice(i, 1));
      kaydet(deg); sayfaKapat(); hesapla(); toast('Düzeltildi.');
    };
  }

  function satirMetni(s) {
    const fb = s.fBirim ? ' ' + s.fBirim : '', sb = s.sBirim ? ' ' + s.sBirim : '';
    switch (s.tip) {
      case 'EKSIK': return [s.kod + ' ' + s.ad, 'Formda ' + s.form + fb + ' · siparişte yok'];
      case 'FAZLA': return [s.kod + ' ' + s.ad, 'Formda yok · siparişte ' + s.siparis + sb];
      case 'KODHATA': return ['Form ' + s.kod + ' → sipariş ' + s.kod2, s.ad + ' · ' + s.form + ' / ' + s.siparis];
      case 'ADET': case 'BIRIM': return [s.kod + ' ' + s.ad, 'Form ' + s.form + fb + ' · Sipariş ' + s.siparis + sb + (s.not ? ' · ' + s.not : '')];
      case 'CAKISMA': return [s.kod + ' ' + s.ad, s.not];
      case 'TAHMIN': return [s.ad + ' → ' + s.kod, s.not];
      case 'ESKIKOD': return [s.kod + ' ' + s.ad, s.not];
      case 'KODSUZ': return [s.ad, 'Formda ' + s.form + fb + ' · kod yazılmamış'];
      case 'FORMYOK': return ['Bu bölümün formu yüklenmedi', s.not];
    }
    return [s.tip, ''];
  }

  function cizDetay() {
    const b = D.sonuc && D.sonuc.bolumler.find(x => x.ad === D.acikBolum);
    if (!b) return;
    const sorunlar = b.sorun.slice().sort((a, c) => (a.onayli - c.onayli) || (SIRA.indexOf(a.tip) - SIRA.indexOf(c.tip)));
    const satir = (s, i) => {
      const [m1, m2] = satirMetni(s);
      const onaylanir = (s.tip === 'ADET' || s.tip === 'BIRIM') && !s.onayli;
      let sag = '';
      if (onaylanir) sag = `<button class="lb" data-onay="${i}">Doğru</button>`;
      if (s.tip === 'TAHMIN' && !s.onayli) sag = `<button class="lb" data-th="${i}" style="color:var(--green);font-weight:600">✔</button><button class="lb" data-tr="${i}" style="color:var(--red);font-weight:600;margin-left:12px">✖</button>`;
      if (s.tip === 'KODHATA' && !s.onayli) sag = `<button class="lb" data-es="${i}" style="font-size:13px;text-align:right">Eşdeğer<br>kaydet</button>`;
      const ic = `<div class="cl tp${onaylanir ? ' sf' : ''}" data-dz="${i}" ${onaylanir ? 'data-sw="' + i + '"' : ''}>${etiket(s)}<div class="f1" style="font-size:15px">${esc(m1)}<div class="sm">${esc(m2)}</div></div>${sag}<span class="ch">&#x203A;</span></div>`;
      return onaylanir ? `<div class="sw"><button class="sa" data-onay="${i}"><span style="font-size:20px">✓</span>Doğru</button>${ic}</div>` : ic;
    };
    const kaydir = sorunlar.some(s => (s.tip === 'ADET' || s.tip === 'BIRIM') && !s.onayli);
    $('d1').innerHTML = `<div class="nb"><button class="bk" id="geri"><span style="font-size:28px;line-height:20px">&#x2039;</span>Rapor</button>${esc(b.ad)}</div>
      <div class="sh">${b.acik ? b.acik + ' sorun · düzeltmek için satıra dokun' : 'Sorun yok'}${kaydir ? ' · adet ve birim farklarını sola kaydırarak onaylayabilirsin' : ''}</div>
      ${sorunlar.length ? '<div class="gr">' + sorunlar.map(satir).join('') + '</div>' : ''}
      <div class="sh">Doğru olanlar (${b.dogru.length})</div>
      <div class="gr">${b.dogru.map(d => `<div class="cl"><span style="color:var(--green)">✓</span><div class="f1" style="font-size:15px">${esc(d.kod)} ${esc(d.ad)}${d.not ? '<div class="sm">' + esc(d.not) + '</div>' : ''}</div><span class="sm">${d.miktar} ${esc(d.birim)}</span></div>`).join('') || '<div class="cl sm">Yok</div>'}</div>`;
    $('geri').onclick = () => { D.acikBolum = null; geri(); };
    const bul = i => sorunlar[+i];
    $('d1').querySelectorAll('[data-onay]').forEach(e => e.onclick = () => { D.durum.onay[bul(e.dataset.onay).id] = true; tazele(); toast('Onaylandı. Sadece bu karşılaştırma için geçerli.'); });
    $('d1').querySelectorAll('[data-th]').forEach(e => e.onclick = () => { const s = bul(e.dataset.th); ayar.ogrenilen[s.anahtarAd] = s.kod; ayarKaydet(); D.durum.onay[s.id] = true; hesapla(); toast('Tahmin onaylandı ve hatırlanacak.'); });
    $('d1').querySelectorAll('[data-tr]').forEach(e => e.onclick = () => { const s = bul(e.dataset.tr); D.durum.red[b.ad + '|' + s.anahtarAd + '|' + s.kod] = true; hesapla(); toast('Tahmin reddedildi.'); });
    $('d1').querySelectorAll('[data-es]').forEach(e => e.onclick = () => {
      const s = bul(e.dataset.es);
      if (!confirm(s.kod + ' kodu bundan sonra ' + s.kod2 + ' ile eşdeğer sayılsın mı?')) return;
      ayar.esdeger[s.kod] = s.kod2; ayarKaydet(); hesapla(); toast('Eşdeğer kod kaydedildi.');
    });
    $('d1').querySelectorAll('[data-sw]').forEach(kaydirmaKur);
    $('d1').querySelectorAll('[data-dz]').forEach(e => e.addEventListener('click', ev => {
      if (ev.target.closest('button') || e.dataset.surukle === '1') return;
      duzeltAc(bul(e.dataset.dz), b.ad);
    }));
  }
  function tazele() { D.sonuc.bolumler.forEach(b => b.sorun.forEach(s => { s.onayli = !!D.durum.onay[s.id]; })); ciz1(); cizDetay(); }

  function kaydirmaKur(f) {
    let x0 = null, y0 = 0, dx = 0, acik = false, yatay = null;
    f.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; yatay = null; f.dataset.surukle = acik ? '1' : '0'; f.style.transition = 'none'; });
    f.addEventListener('pointermove', e => {
      if (x0 === null) return;
      if (yatay === null && (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8)) { yatay = Math.abs(e.clientX - x0) > Math.abs(e.clientY - y0); if (yatay) { f.dataset.surukle = '1'; f.setPointerCapture(e.pointerId); } }
      if (!yatay) return;
      dx = Math.min(0, Math.max(-110, e.clientX - x0 + (acik ? -88 : 0)));
      f.style.transform = `translateX(${dx}px)`;
    });
    const bit = () => { if (x0 === null) return; x0 = null; f.style.transition = ''; if (yatay) { acik = dx < -44; f.style.transform = acik ? 'translateX(-88px)' : ''; } };
    f.addEventListener('pointerup', bit); f.addEventListener('pointercancel', bit);
  }

  // ---------- 2: Birleşik liste ----------
  function ciz2() {
    const R = D.sonuc;
    if (!D.sip) { T[2].innerHTML = '<div class="lt">Birleşik liste</div><div class="bos">Sipariş listesini yükleyince birleşik liste burada görünür.</div>'; return; }
    const B = R ? R.birlesik : SK.birlestir(D.sip);
    const tamam = B.toplam === B.kontrol;
    T[2].innerHTML = `<div class="lt">Birleşik liste</div>
      <div class="se">${IC.search}<input id="ara" placeholder="Kod ya da ürün ara" value="${esc(D.ara)}" autocomplete="off"></div>
      <div class="gr" style="margin-top:14px;background:${tamam ? 'var(--gB)' : 'var(--rB)'}"><div class="cl" style="background:none;color:${tamam ? 'var(--gT)' : 'var(--rT)'}">${IC.check}<div class="f1"><div style="font-weight:600">${B.kaynakSatir} satır → ${B.satirlar.length} satır</div><div style="font-size:13px">Toplam ${B.toplam} adet · ${tamam ? 'sipariş listesiyle aynı' : 'TOPLAM TUTMUYOR'}</div></div></div></div>
      <div class="sh" id="mh"></div><div class="gr" id="ml"></div>
      <button class="pb" id="gonder">${IC.mail}Mail ile gönder</button>`;
    const cizListe = () => {
      const q = D.ara.trim().toLocaleLowerCase('tr-TR');
      const L = q ? B.satirlar.filter(r => r.kod.includes(q) || (r.ad + ' ' + r.ad2).toLocaleLowerCase('tr-TR').includes(q)) : B.satirlar;
      $('mh').textContent = q ? L.length + ' sonuç' : 'Toplam adede göre';
      $('ml').innerHTML = L.map((r, i) => `<div class="cl tp" data-i="${i}" style="align-items:flex-start"><div class="f1">${esc(r.ad)}${r.ad2 ? ' <span class="sm">' + esc(r.ad2) + '</span>' : ''}<div class="sm">${esc(r.kod)} · ${esc(r.birim)}${r.birimUyari ? ' <span class="ip i-r">Birimler karışık</span>' : ''}</div><div class="det" id="dt${i}">${r.parcalar.map(p => esc(p.bolum) + ' ' + p.miktar).join(' · ')}</div></div><div style="max-width:42%"><div class="num">${r.toplam}</div><div class="sm" style="text-align:right;word-break:break-all">${r.parcalar.length > 1 ? '= ' + r.parcalar.map(p => p.miktar).join('+') : 'tek satır'}</div></div></div>`).join('') || '<div class="cl sm">Sonuç yok</div>';
      $('ml').querySelectorAll('[data-i]').forEach(e => e.onclick = () => { const d = $('dt' + e.dataset.i); d.style.maxHeight = d.style.maxHeight ? '' : d.scrollHeight + 'px'; });
    };
    $('ara').oninput = e => { D.ara = e.target.value; cizListe(); };
    cizListe();
    $('gonder').onclick = () => gonderSayfasi(B);
  }

  // ---------- Mail ile gönderme ----------
  const tarih = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); };
  function dosyalar(B) {
    const t = tarih();
    const b1 = [['Kod', 'Ürün adı', 'Toplam adet']].concat(B.satirlar.map(r => [Number(r.kod), r.ad, r.toplam]));
    const b2 = [['Mlz No.', 'Malzeme Tanımı 1', 'Malzeme Tanımı 2', 'Sipariş Miktarı', 'İşlem Ö.B.', 'Açıklama 1']].concat(D.sip.map(x => [Number(x.kod), x.ad, x.ad2, x.miktar, x.birimHam, x.bolumHam]));
    const yap = (rows, sayfa, ad, gen) => {
      const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = gen.map(w => ({ wch: w }));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sayfa);
      return new File([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], ad, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    };
    return [yap(b1, 'Birleşik liste', 'Birlesik_Liste_' + t + '.xlsx', [10, 40, 12]), yap(b2, 'Sipariş', 'Duzeltilmis_Siparis_' + t + '.xlsx', [10, 34, 26, 10, 8, 22])];
  }
  function gonderSayfasi(B) {
    const t = tarih();
    sayfaAc(`<div style="font-size:17px;font-weight:600;text-align:center">Gönderilecek dosyalar</div><div class="sm" style="text-align:center;margin:4px 0 16px">Kontrol edip onayla</div>
      <div class="gr"><div class="cl"><span class="xl">${IC.xls}</span><div class="f1" style="font-size:15px">Birlesik_Liste_${t}.xlsx<div class="sm">${B.satirlar.length} satır · ${B.toplam} adet</div></div></div>
      <div class="cl"><span class="xl">${IC.xls}</span><div class="f1" style="font-size:15px">Duzeltilmis_Siparis_${t}.xlsx<div class="sm">${D.sip.length} satır · ${D.kayit.length} düzeltme</div></div></div></div>
      <button class="pb" id="mailAc">Mail'i aç</button><button class="lb" id="vazgec" style="display:block;width:100%;margin-top:16px">Vazgeç</button>`);
    $('vazgec').onclick = sayfaKapat;
    $('mailAc').onclick = () => {
      const f = dosyalar(B);
      if (navigator.canShare && navigator.canShare({ files: f })) {
        navigator.share({ files: f, title: 'Sipariş listesi ' + t }).then(sayfaKapat).catch(e => { if (e.name !== 'AbortError') toast('Paylaşım açılamadı.'); });
      } else {
        f.forEach(x => { const a = document.createElement('a'); a.href = URL.createObjectURL(x); a.download = x.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
        sayfaKapat(); toast('Bu cihaz paylaşımı desteklemiyor, dosyalar indirildi.');
      }
    };
  }

  // ---------- 3: Ayarlar ----------
  const AYAR = {
    bolum: { ad: 'Bölüm listesi', aciklama: 'Fabrikadaki bölümler. Program tanımadığı bir ad görünce sadece bu listeden seçtirir.' },
    eslesme: { ad: 'Bölüm eşleşmeleri', aciklama: 'Listelerde farklı yazılan bölüm adlarının hangi bölüme sayılacağı. Örnek: MEDE KIDS → MEDE.' },
    esdeger: { ad: 'Eşdeğer kodlar', aciklama: 'Formda eski kod yazılsa da siparişte yenisiyle geçilen ürünler. Eşleşirse doğru sayılır; siparişte eski kod görülürse uyarılır.' },
    ogrenilen: { ad: 'Öğrenilmiş kodlar', aciklama: 'Kodu boş yazılan ürünler için onayladığın tahminler. Program bu adları bir dahaki sefere sormadan bu kodla eşleştirir.' }
  };
  const sayi = t => t === 'bolum' ? ayar.bolumler.length : Object.keys(t === 'eslesme' ? ayar.eslesmeler : t === 'esdeger' ? ayar.esdeger : ayar.ogrenilen).length;
  function ayarDegisti() { ayarKaydet(); if (D.sonuc) hesapla(); else { ciz3(); cizAyarDetay(); } }

  function ciz3() {
    T[3].innerHTML = `<div class="lt">Ayarlar</div>
      <div class="sha">Listeler</div>
      <div class="gr">${Object.keys(AYAR).map(t => `<div class="cl tp" data-ay="${t}" style="font-size:18px"><span class="f1">${AYAR[t].ad}</span><span class="sm" style="font-size:16px">${sayi(t)}</span>${IC.chev}</div>`).join('')}</div>
      <div class="sha">Sıfırlama</div>
      <div class="gr"><button class="cl tp" id="sifirla" style="width:100%;color:var(--red);justify-content:center;font-size:17px">Başlangıç ayarlarına dön</button></div>
      <div class="sm" style="margin:8px 16px">Bölüm listesi, eşleşmeler, eşdeğer kodlar ve öğrenilmiş kodlar ilk kurulumdaki haline döner.</div>
      <div class="sm" style="text-align:center;margin:24px 0 8px">Sürüm ${SURUM}</div>`;
    T[3].querySelectorAll('[data-ay]').forEach(e => e.onclick = () => { D.ayarSayfa = e.dataset.ay; cizAyarDetay(); ayarIleri(); });
    $('sifirla').onclick = () => {
      if (!confirm('Bütün listeler ilk kurulumdaki haline dönsün mü? Eklediğin bölümler ve öğrenilenler silinir.')) return;
      ayar = SK.varsayilanAyar(); ayarDegisti(); toast('Başlangıç ayarlarına dönüldü.');
    };
  }

  function cizAyarDetay() {
    const t = D.ayarSayfa; if (!t) return;
    const sil = (etiket, yap) => () => { if (confirm(etiket + ' silinsin mi?')) { yap(); ayarDegisti(); toast('Silindi.'); } };
    let satirlar = [], ekle = '';
    if (t === 'bolum') {
      satirlar = ayar.bolumler.map((b, i) => ({ html: `<span class="f1">${esc(b)}</span>`, sil: sil(b, () => ayar.bolumler.splice(i, 1)) }));
      ekle = `<div class="cl"><input class="ti" id="y1" style="padding:0" placeholder="Yeni bölüm adı"><button class="lb" id="ekle">Ekle</button></div>`;
    } else if (t === 'eslesme') {
      satirlar = Object.entries(ayar.eslesmeler).map(([k, v]) => ({ html: `<div class="f1">${esc(k || '(boş)')}<div class="sm">→ ${esc(v)}</div></div>`, sil: sil(k, () => delete ayar.eslesmeler[k]) }));
      ekle = `<div class="cl" style="flex-wrap:wrap;gap:8px"><label class="fi" style="flex-basis:100%">Listede yazan<input id="y1" placeholder="MEDE KIDS"></label>
        <label class="fi" style="flex:1">Sayılacağı bölüm<select id="y2" style="height:36px;border:.5px solid var(--sep);border-radius:8px;background:var(--bg);color:var(--t1);font:inherit;font-size:16px;padding:0 8px">${ayar.bolumler.map(b => `<option>${esc(b)}</option>`).join('')}</select></label>
        <button class="lb" id="ekle" style="align-self:flex-end;padding-bottom:8px">Ekle</button></div>`;
    } else if (t === 'esdeger') {
      satirlar = Object.entries(ayar.esdeger).map(([k, v]) => ({ html: `<span class="f1">${esc(k)} → ${esc(v)}</span>`, sil: sil(k + ' → ' + v, () => delete ayar.esdeger[k]) }));
      ekle = `<div class="cl" style="gap:8px"><label class="fi" style="flex:1">Formdaki kod<input id="y1" inputmode="numeric" placeholder="152958"></label><label class="fi" style="flex:1">Siparişteki kod<input id="y2" inputmode="numeric" placeholder="179920"></label><button class="lb" id="ekle" style="align-self:flex-end;padding-bottom:8px">Ekle</button></div>`;
    } else {
      satirlar = Object.entries(ayar.ogrenilen).map(([k, v]) => ({ html: `<div class="f1">${esc(k)}<div class="sm">→ ${esc(v)}</div></div>`, sil: sil(k, () => delete ayar.ogrenilen[k]) }));
    }
    $('d3').innerHTML = `<div class="nb"><button class="bk" id="ayGeri"><span style="font-size:28px;line-height:20px">&#x2039;</span>Ayarlar</button>${AYAR[t].ad}</div>
      <div class="sm" style="margin:8px 4px 0">${AYAR[t].aciklama}</div>
      ${ekle ? '<div class="sha">Yeni ekle</div><div class="gr">' + ekle + '</div>' : ''}
      <div class="sha">${AYAR[t].ad} (${satirlar.length})</div>
      <div class="gr">${satirlar.map((s, i) => `<div class="cl" style="font-size:16px">${s.html}<button class="sil" data-s="${i}">Sil</button></div>`).join('') || '<div class="cl sm">Henüz yok.</div>'}</div>`;
    $('ayGeri').onclick = () => { ayarGeri(); ciz3(); };
    $('d3').querySelectorAll('[data-s]').forEach(e => e.onclick = satirlar[+e.dataset.s].sil);
    if (!$('ekle')) return;
    $('ekle').onclick = () => {
      const a = $('y1').value.trim(), b = $('y2') ? $('y2').value.trim() : '';
      if (t === 'bolum') {
        const ad = a.toLocaleUpperCase('tr-TR');
        if (!ad) return toast('Önce bölüm adını yaz.');
        if (ayar.bolumler.some(x => SK.sik(x) === SK.sik(ad))) return toast('Bu bölüm zaten listede.');
        ayar.bolumler.push(ad);
      } else if (t === 'eslesme') {
        if (!a) return toast('Önce listede yazan adı gir.');
        ayar.eslesmeler[a.toLocaleUpperCase('tr-TR')] = b;
      } else {
        const k1 = a.replace(/\D/g, ''), k2 = b.replace(/\D/g, '');
        if (!k1 || !k2) return toast('İki kodu da rakamla gir.');
        if (k1 === k2) return toast('İki kod aynı olamaz.');
        ayar.esdeger[k1] = k2;
      }
      ayarDegisti(); toast('Eklendi.');
    };
  }

  cizHepsi();

  // Otomatik güncelleme: yeni sürüm yayınlanınca uygulama kendini bir kez yeniler.
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const vardi = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => { });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (vardi && !D.form && !D.sip) location.reload(); });
  }
})();
