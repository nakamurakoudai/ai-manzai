/* MICOLABO PWA: offline page fallback, no caching third-party/ad or user content. */
const CACHE_NAME = 'micolabo-shell-20261123-v1';
const SHELL = ['/', '/terms.html', '/privacy.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(SHELL.map(url => cache.add(url)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('micolabo-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => { if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, clone)); } return res; }).catch(() => caches.match(req).then(cached => cached || caches.match('/'))));
    return;
  }
  if (!SHELL.includes(url.pathname)) return;
  event.respondWith(fetch(req).then(res => { if(res.ok) {const clone=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req,clone));} return res;}).catch(()=>caches.match(req)));
});
