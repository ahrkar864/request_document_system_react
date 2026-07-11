// ===== CONFIG =====
const CACHE_VERSION = 'v2'; // ⬅️ ဒီနံပါတ်ကို deploy တိုင်း +1 လုပ်ပါ (v1 -> v2 -> v3...)
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${CACHE_VERSION}`;

// Install အချိန်မှာ ချက်ချင်း cache လုပ်ချင်တဲ့ shell files (hashed filename မပါတဲ့ static ones)
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ===== INSTALL =====
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
    }).then(() => {
      // install ပြီးချင်းမှာ activate ချက်ချင်းသွားချင်ရင် skipWaiting ခေါ်ပါ
      return self.skipWaiting();
    })
  );
});

// ===== ACTIVATE =====
// Cache ဟောင်း (version မတူတော့တဲ့) တွေကိုသာ ဖျက်ပါတယ် — အားလုံးကို မဖျက်ပါဘူး
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const CURRENT_CACHES = [STATIC_CACHE, RUNTIME_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.includes(name))
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim()) // active tab တွေကို ချက်ချင်း control ယူ
  );
});

// ===== FETCH =====
self.addEventListener('fetch', (event) => {
  const { request } = event;

  let requestUrl;
  try {
    requestUrl = new URL(request.url);
  } catch (e) {
    return; // parse မရရင် ဘာမှမလုပ်ဘဲ network ကို ဖြတ်လွှင့်ခွင့်ပြုပါ
  }

  // GET request မဟုတ်ရင် skip (POST/PUT စတာတွေကို SW မထိပါနဲ့)
  if (request.method !== 'GET') return;

  // API / dynamic backend files တွေကို SW မထိပါနဲ့ — အမြဲ network ကနေပဲ
  if (
    requestUrl.pathname.startsWith('/api/') ||
    requestUrl.pathname.includes('/public-files/') ||
    requestUrl.pathname.startsWith('/storage/') ||
    requestUrl.pathname.endsWith('/manifest.json') ||
    requestUrl.pathname.endsWith('/sw.js')
  ) {
    return;
  }

  // cross-origin request တွေကို ဖြတ်လွှင့်ခွင့်ပြုပါ
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // HTML navigation (page reload) → Network-first (content အသစ်ရအောင်)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // JS / CSS / hashed build assets (Vite: filename-hash.js) → Cache-first
  // Hashed filename ဖြစ်လို့ content ပြောင်းရင် filename ပါ ပြောင်းသွားမယ်၊ ဒါကြောင့် ထာဝစဉ် cache လို့ရတယ်
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        }).catch((err) => {
          throw err;
        });
      })
    );
    return;
  }

  // Image → Cache-first (fallback network)
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // အခြား asset တွေ → Stale-while-revalidate (cache ကို ချက်ချင်းပြသ၊ background မှာ update)
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch((err) => {
        if (cached) return cached;
        throw err;
      });

      return cached || fetchPromise;
    })
  );
});

// ===== PUSH NOTIFICATION =====
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/PRO1logo.png',
    badge: '/PRO1logo.png',
    url: '/',
  };

  try {
    if (event.data) {
      notificationData = event.data.json();
      console.log('[Service Worker] Notification data:', notificationData);
    }
  } catch (error) {
    console.error('[Service Worker] Error parsing notification data:', error);
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/PRO1logo.png',
    badge: notificationData.badge || '/PRO1logo.png',
    data: {
      url: notificationData.url || '/',
      dateOfArrival: Date.now(),
    },
    requireInteraction: false,
    tag: 'form-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open Form', icon: '/PRO1logo.png' },
      { action: 'close', title: 'Dismiss', icon: '/PRO1logo.png' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
