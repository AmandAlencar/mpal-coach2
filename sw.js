// Muda a versão aqui para forçar atualização em todos os dispositivos
const CACHE = 'mpal-coach-v2';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting(); // assume controle imediatamente
});

self.addEventListener('activate', e => {
  // Apaga todos os caches antigos
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // força reload nos clientes abertos
});

self.addEventListener('fetch', e => {
  // Firebase e CDNs: sempre busca na rede (nunca cacheia)
  if (e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic')) {
    return;
  }
  // Para o index.html: sempre busca versão nova da rede primeiro
  if (e.request.url.endsWith('/') || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Demais assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
