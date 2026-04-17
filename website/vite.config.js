import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip only — brotli adds too much build time on the server
    viteCompression({ algorithm: 'gzip', threshold: 1024 }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Use esbuild (default) instead of terser — much faster, still good minification
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Only split heavy libraries, NOT react/react-dom (causes empty chunk in Vite)
          'map-vendor': ['leaflet', 'react-leaflet'],
          'router': ['react-router-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react'],
    exclude: ['leaflet', 'react-leaflet'],
  },
  server: {
    hmr: true,
    proxy: {
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
        headers: {
          'User-Agent': 'PropastraAdminDash/1.0 (contact@propastra.com)'
        }
      }
    }
  },
})
