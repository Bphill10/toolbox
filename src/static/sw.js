/* Network-only service worker: it exists so browsers offer "Install", and caches nothing, so the
   installed app always shows the latest deploy. No fetch handler: every request goes to the network. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
