
// Service Worker do Pastor Virtual — permite abrir o app sem internet.
const CACHE_NAME = 'pastor-virtual-shell-v1';
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './imagens/avatar.jpg',
  './icons/icon-32.png',
  './icons/icon-192.png',
  './icons/favicon.ico',
  './icons/apple-touch-icon.png',
  './icons/pastorvirtualvirtual.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(SHELL_URLS.map(url => cache.add(url))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Só cuida de GET do mesmo domínio. Tudo que for de outro domínio
  // (IA no Worker, rádio, capa de música, Analytics, AdSense) segue
  // direto para a rede, sem passar pelo cache — essas partes já têm
  // seu próprio tratamento de erro no código do site.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/';

  if (isPage) {
    // Página principal: tenta a rede primeiro (pega atualizações),
    // e cai para a cópia salva em cache se estiver sem internet.
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(res => res || caches.match('./')))
    );
    return;
  }

  // Demais arquivos do próprio site (ícones, imagens, manifest):
  // usa o cache primeiro, e busca na rede só se ainda não tiver salvo.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});
