const CACHE_NAME = "ucup-v1";
const OFFLINE_URLS = ["/", "/matches", "/standings"];

// 1. Installation et mise en cache initiale
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// 2. Nettoyage des anciens caches lors de l'activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// 3. Gestion du mode hors-ligne (Stratégie Réseau puis Cache)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// 4. Réception et affichage des notifications Push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "UCUP 2026",
    body: "",
    url: "/",
  };

  try {
    payload = { ...payload, ...event.data.json() };
  } catch (err) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url: payload.url || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// 5. Action lors du clic sur la notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si le site est déjà ouvert dans un onglet, on le met au premier plan
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Sinon, on ouvre une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});