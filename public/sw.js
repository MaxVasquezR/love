// Gym Legends service worker: offline shell + runtime caching (registered only on the own website).
const VERSION = 'gl-v1'
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

async function cacheFirst(req) {
  const hit = await caches.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) (await caches.open(VERSION)).put(req, res.clone())
  return res
}

async function networkFirst(req, fallback) {
  try {
    const res = await fetch(req)
    if (res.ok) (await caches.open(VERSION)).put(fallback ?? req, res.clone())
    return res
  } catch {
    return (await caches.match(fallback ?? req)) ?? Response.error()
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(cacheFirst(req))
    return
  }
  if (url.origin !== self.location.origin) return
  // Challenge landings and preview images must always hit the server.
  if (url.pathname.startsWith('/api/') || url.pathname === '/r') return

  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, './'))
    return
  }
  // Hashed build files never change: cache forever. Everything else: fresh when online.
  e.respondWith(url.pathname.includes('/assets/') ? cacheFirst(req) : networkFirst(req))
})
