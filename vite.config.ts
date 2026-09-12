import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // maplibre-gl loads its tile-parsing code in a Web Worker; Vite's dependency pre-bundler
  // rewrites that worker's module URL and breaks it (404 on maplibre-gl-worker.mjs), which
  // silently stalls GeoJSON sources forever (raster tiles are unaffected — they don't use
  // the worker). Excluding it serves the package unbundled so its own worker loading works.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
