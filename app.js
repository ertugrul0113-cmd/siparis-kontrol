(function () {
  'use strict';
  const SURUM = '0.1.1 · 10.11.2026';
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
  const D = { form: null, formDosya: '', sip: null, sipDosya: '', cevap: { form: {} }, durum: { onay: {}, red: {} }, sonuc: null, filtre: 0, acikBolum: null, ara: '', yukleniyor: '' };

  function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.z); toast.z = setTimeout(() => t.classList.remove('on'), 2600); }

  // ---------- Gezinme ----------
  const T = [0, 1, 2, 3].map(i => $('t' + i));
  let aktif = 0;
  function sekme(i) {
    aktif = i; geri(true); sayfaKapat();
    T.forEach((t, j) => t.className = 'scr' + (j === i ? '' : ' off'));
    document.querySelectorAll('#tb button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  }
  function ileri() { T[1].className = 'scr pl'; $('d1').className = 'scr'; $('d1').scrollTop = 0; }
  function geri(sessiz) { $('d1').className = 'scr pr'; if (!sessiz) T[1].className = 'scr'; }
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
      D.durum = { onay: {}, red: {} }; D.sonuc = null;
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
  function cizHepsi() { ciz0(); ciz1(); if (D.acikBolum) cizDetay(); ciz2(); ciz3(); }

  // ---------- 0: İstek form / liste ----------
  function yuklemeGrubu(baslik, tur, dosya, bilgi) {
    const yuk = D.yukleniyor === tur;
    return `<div class="sh">${baslik}</div><div class="gr">
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
      <div class="sh">${R.dogruSatir} satır doğru · ${tum} bölüm</div>
      <div class="gr">${L.map(b => {
        const ilk = b.sorun.filter(x => !x.onayli).sort((a, c) => SIRA.indexOf(a.tip) - SIRA.indexOf(c.tip))[0];
        return `<div class="cl tp" data-b="${esc(b.ad)}"><div class="f1">${esc(b.ad)}<div class="sm">${b.acik ? b.acik + ' sorun' : 'Hepsi doğru'} · ${b.dogru.length} doğru satır</div></div>${ilk ? etiket(ilk) : '<span class="ip i-g">Onaylandı</span>'}${IC.chev}</div>`;
      }).join('') || '<div class="cl sm">Bu grupta bölüm yok</div>'}</div>`;
    T[1].querySelectorAll('.sg button').forEach(b => b.onclick = () => { D.filtre = +b.dataset.v; ciz1(); });
    T[1].querySelectorAll('[data-b]').forEach(e => e.onclick = () => { D.acikBolum = e.dataset.b; cizDetay(); ileri(); });
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
      const ic = `<div class="cl${onaylanir ? ' sf' : ''}" ${onaylanir ? 'data-sw="' + i + '"' : ''}>${etiket(s)}<div class="f1" style="font-size:15px">${esc(m1)}<div class="sm">${esc(m2)}</div></div>${sag}</div>`;
      return onaylanir ? `<div class="sw"><button class="sa" data-onay="${i}"><span style="font-size:20px">✓</span>Doğru</button>${ic}</div>` : ic;
    };
    const kaydir = sorunlar.some(s => (s.tip === 'ADET' || s.tip === 'BIRIM') && !s.onayli);
    $('d1').innerHTML = `<div class="nb"><button class="bk" id="geri"><span style="font-size:28px;line-height:20px">&#x2039;</span>Rapor</button>${esc(b.ad)}</div>
      <div class="sh">${b.acik ? b.acik + ' sorun' : 'Sorun yok'}${kaydir ? ' · adet ve birim farklarını sola kaydırarak onaylayabilirsin' : ''}</div>
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
  }
  function tazele() { D.sonuc.bolumler.forEach(b => b.sorun.forEach(s => { s.onayli = !!D.durum.onay[s.id]; })); ciz1(); cizDetay(); }

  function kaydirmaKur(f) {
    let x0 = null, y0 = 0, dx = 0, acik = false, yatay = null;
    f.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; yatay = null; f.style.transition = 'none'; });
    f.addEventListener('pointermove', e => {
      if (x0 === null) return;
      if (yatay === null && (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8)) { yatay = Math.abs(e.clientX - x0) > Math.abs(e.clientY - y0); if (yatay) f.setPointerCapture(e.pointerId); }
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
      <div class="cl"><span class="xl">${IC.xls}</span><div class="f1" style="font-size:15px">Duzeltilmis_Siparis_${t}.xlsx<div class="sm">${D.sip.length} satır · düzeltme özelliği sonraki aşamada</div></div></div></div>
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
  function ciz3() {
    const e = Object.entries(ayar.eslesmeler), q = Object.entries(ayar.esdeger), o = Object.entries(ayar.ogrenilen);
    const grup = (ad, satirlar, bos) => `<div class="sh">${ad}</div><div class="gr">${satirlar.join('') || '<div class="cl sm">' + bos + '</div>'}</div>`;
    T[3].innerHTML = `<div class="lt">Ayarlar</div>
      ${grup('Bölüm eşleşmeleri (' + e.length + ')', e.map(([k, v]) => `<div class="cl"><span class="f1" style="font-size:15px">${esc(k)}</span><span class="sm">→ ${esc(v)}</span></div>`), 'Yok')}
      ${grup('Eşdeğer kodlar (' + q.length + ')', q.map(([k, v]) => `<div class="cl"><span class="f1" style="font-size:15px">${esc(k)} → ${esc(v)}</span></div>`), 'Yok')}
      ${grup('Öğrenilmiş kodlar (' + o.length + ')', o.map(([k, v]) => `<div class="cl"><span class="f1" style="font-size:15px">${esc(k)}</span><span class="sm">${esc(v)}</span></div>`), 'Henüz yok. Kodsuz satır tahminlerini onayladıkça burada birikir.')}
      ${grup('Bölüm listesi (' + ayar.bolumler.length + ')', ayar.bolumler.map(b => `<div class="cl" style="font-size:15px">${esc(b)}</div>`), '')}
      <div class="sm" style="margin:12px 16px">Bu listeleri düzenleme ve silme bir sonraki aşamada eklenecek.</div>
      <div class="gr" style="margin-top:20px"><button class="cl tp" id="sifirla" style="width:100%;color:var(--red);justify-content:center">Öğrenilenleri sıfırla</button></div>
      <div class="sm" style="text-align:center;margin:20px 0 8px">Sürüm ${SURUM}</div>`;
    $('sifirla').onclick = () => {
      if (!confirm('Eşleşmeler, eşdeğer kodlar ve öğrenilmiş kodlar başlangıç haline dönsün mü?')) return;
      ayar = SK.varsayilanAyar(); ayarKaydet(); if (D.sonuc) hesapla(); else ciz3(); toast('Ayarlar sıfırlandı.');
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
