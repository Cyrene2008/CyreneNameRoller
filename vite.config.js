import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
  }
})
