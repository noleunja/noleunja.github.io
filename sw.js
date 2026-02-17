const CACHE_NAME = 'calculator-web-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // Best-effort pre-cache of the app shell.
      await cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/pwa-icon.svg',
        '/pwa-maskable.svg',
        '/vite.svg',
      ])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA-style navigation fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cached = await caches.match('/index.html')
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(CACHE_NAME)
          cache.put('/index.html', fresh.clone())
          return fresh
        } catch {
          return cached ?? Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached

      const response = await fetch(request)
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
      return response
    })(),
  )
})
