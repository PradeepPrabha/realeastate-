import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'jsdom', include: ['src/tests/**/*.test.ts'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (/react-router|react-dom|[\/]react[\/]|scheduler/.test(id)) return 'react'
          if (/framer-motion|motion-dom|date-fns|axios|@tanstack/.test(id)) return 'vendor'
          return undefined
        },
      },
    },
  },
})
