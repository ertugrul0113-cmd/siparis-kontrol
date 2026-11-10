// Otomatik güncelleme: internet varken her açılışta dosyaların en yenisi alınır,
// internet yoksa son kaydedilen sürüm açılır. Telefona yeniden kurmak gerekmez.
const ONBELLEK = 'siparis-kontrol';
const DOSYALAR = ['./', 'index.html', 'app.js', 'logic.js', 'vendor/xlsx.full.min.js', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(DOSYALAR.map(d => new Request(d, { cache: 'reload' })))));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' })
      .then(yanit => {
        if (yanit.ok) { const kopya = yanit.clone(); caches.open(ONBELLEK).then(c => c.put(r, kopya)); }
        return yanit;
      })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(k => k || caches.match('index.html')))
  );
});
