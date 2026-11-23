// MICOLABO minimal PWA service worker. No offline caching to avoid stale scripts.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
