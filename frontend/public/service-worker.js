// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/image.png',
    badge: data.badge || '/icon.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'P-40 Underdogs', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
