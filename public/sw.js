/* Service worker de Al Toque: mantiene la app viva sin internet.
 * Estrategia:
 * - Páginas: primero red; si no hay red, muestra la copia guardada de esa
 *   misma página (o el inicio si nunca se visitó).
 * - Archivos que no cambian (/_next/static, íconos): primero lo guardado.
 * - Todo lo demás (datos de Next, API): siempre a la red, sin guardar.
 */
const VERSION = "altoque-v3";
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

  // Datos en vivo (el panel, el seguimiento, los estados): SIEMPRE a la red.
  // Nunca se guardan en el cache, si no el panel mostraria una foto vieja.
  if (url.pathname.startsWith("/api/")) return;

  // Páginas: red primero; cada página se guarda con su propia dirección.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CORE_CACHE);
            cache.put(url.pathname, response.clone()).catch(() => {});
          }
          return response;
        } catch {
          // Sin red: la misma página guardada, o el inicio como último recurso.
          const cache = await caches.open(CORE_CACHE);
          const same = await cache.match(url.pathname);
          if (same) return same;
          const home = await cache.match("/");
          if (home) return home;
          throw new Error("sin conexion y sin copia guardada");
        }
      })(),
    );
    return;
  }

  // Archivos que nunca cambian (con versión en el nombre): guardado primero.
  const immutable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/apple-icon.png" ||
    url.pathname === "/favicon.ico";
  if (!immutable) return; // Todo lo demás va directo a la red.

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
