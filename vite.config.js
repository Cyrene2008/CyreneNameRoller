import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const buildHash = new Date().toISOString().slice(0, 10).replace(/-/g, '')

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0
  },
  server: {
    port: 5173
  },
  json: {
    stringify: true
  },
  define: {
    '__BUILD_HASH__': JSON.stringify(buildHash)
  }
})
