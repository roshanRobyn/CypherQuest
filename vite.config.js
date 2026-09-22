import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // admin.html is a second, standalone page (the organizer dashboard),
      // not part of the React app. Vite's production build only emits
      // pages listed here — without this, admin.html works in `vite dev`
      // (which serves any root static file) but 404s in the deployed
      // `dist/` build (e.g. on Vercel).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
})
