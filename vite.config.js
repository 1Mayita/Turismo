import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Rutas de Bolivia',
        short_name: 'Rutas Bolivia',
        description: 'Destinos, eventos, gastronomía y alojamientos para recorrer Bolivia.',
        lang: 'es-BO',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#0E2233',
        categories: ['travel', 'navigation'],
        icons: [
          { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/downloads\//],
        globPatterns: ['**/*.{css,html,ico,js,png,svg,webp,woff2}'],
        // Fuentes y fotos se guardan al verlas, para que la app instalada
        // se vea igual con poca señal.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fuentes', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: /^https:\/\/(commons\.wikimedia\.org|upload\.wikimedia\.org|res\.cloudinary\.com)\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fotos', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
})