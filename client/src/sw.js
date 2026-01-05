import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// PWA용 프리캐싱 설정 (VitePWA가 자동으로 __WB_MANIFEST를 채워줍니다)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 서비스 워커 제어권을 즉시 획득
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/**
 * 웹 푸시 알림 수신
 */
self.addEventListener('push', (event) => {
  console.log('📬 Push 수신:', event);
  try {
    const data = event.data ? event.data.json() : {};
    const {
      title = '알림',
      body = '',
      icon = '/assets/icon-192x192.svg',
      badge = '/assets/favicon.svg',
      data: extraData = {},
    } = data;

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge,
        vibrate: [200, 100, 200],
        tag: 'push-notification',
        data: extraData,
      })
    );
  } catch (error) {
    console.error('❌ Push 처리 오류:', error);
  }
});

/**
 * 알림 클릭 시 동작
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

