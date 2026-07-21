/* Service worker de Peronismo Geselino.
   Gobierna únicamente la base donde está registrado:
   /peronismogeselino/ en modo integrado, / en modo independiente. */

const VERSION = "pg-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const BASE = new URL(self.registration.scope).pathname;

const SHELL = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icon-192.png`, `${BASE}icon-512.png`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;
  // El API siempre va a la red: la comunidad y el panel necesitan datos frescos.
  if (url.pathname.startsWith(`${BASE}api/`)) return;

  // Navegaciones: red primero, con el shell como respaldo sin conexión.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(BASE, copy));
          return response;
        })
        .catch(() => caches.match(BASE)),
    );
    return;
  }

  // Estáticos (JS/CSS con hash, imágenes, íconos): caché primero.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }),
  );
});
