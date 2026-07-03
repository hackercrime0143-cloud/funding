
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch handler is enough to trigger PWA install prompts
});

self.addEventListener('push', (e) => {
  try {
    const data = e.data ? e.data.json() : {};
    const title = data.title || 'FastPay Alert';
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'general-alert',
      renotify: true,
      data: data
    };
    e.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = e.data ? e.data.text() : 'FastPay Alert';
    e.waitUntil(self.registration.showNotification('FastPay Alert', {
      body: text,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    }));
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
