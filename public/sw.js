/* Service worker de Al Toque: mantiene la app viva sin internet.
 * Estrategia:
 * - Páginas: primero red; si no hay red, muestra la última versión guardada.
 * - Archivos (íconos, estilos, scripts): primero lo guardado, si no está, descarga.
 */
const VERSION = "altoque-v1";
const CORE_CACHE = `${VERSION}-paginas`;
const ASSET_CACHE = `${VERSION}-archivos`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE_CACHE);
      await cache.addAll(["/"]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => !name.startsWith(VERSION))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: red primero, guardado como respaldo.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CORE_CACHE);
            cache.put("/", response.clone()).catch(() => {});
          }
          return response;
        } catch {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          throw new Error("sin conexion y sin copia guardada");
        }
      })(),
    );
    return;
  }

  // Archivos: guardado primero, red como respaldo.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(ASSET_CACHE);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })(),
  );
});
