import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BASE_URL } from './config';

// Do precaching
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Runtime caching
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({ 
    cacheName: 'google-fonts', 
  }),
);

registerRoute(
  ({ url }) => url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome'),
  new CacheFirst({ 
    cacheName: 'fontawesome',
   }),
);

registerRoute(
  ({ url }) => url.origin === 'https://ui-avatars.com',
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [new CacheableResponsePlugin({ 
      statuses: [0, 200], 
    })],
  })
);

registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'story-api',
  }),
);
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
  }),
);

// Maptiler API
registerRoute(
  ({ url }) => url.origin.includes('maptiler'),
  new CacheFirst({
    cacheName: 'maptiler-api',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);


// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('Service worker received a push notification.');

  event.waitUntil(
    (async () => {
      try {
        const data = event.data ? await event.data.json() : {};
        const title = data.title || 'Story App Notification';
        const options = {
          body: data.body || 'You have a new notification.',
          icon: 'images/icons/icon.png',
          badge: 'images/icons/icon.png',
        };

        if (Notification.permission === 'granted') {
          await self.registration.showNotification(title, options);
        } else {
          console.warn('Notification permission is not granted.');
        }
      } catch (error) {
        console.error('Error in push notification handler:', error);
      }
    })()
  );
});
