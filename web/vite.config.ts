/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API runs on its own port in development. Proxying /api through Vite keeps
// the browser on one origin, so no CORS setup is needed locally.
const apiTarget = process.env.IDLEHOLD_API_URL ?? 'http://localhost:5085'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The first test in a file pays for the first render in a fresh jsdom. With every file running at
    // once on a busy machine that can pass Vitest's 5 s default, though no test is slow on its own.
    testTimeout: 15_000,
  },
})
