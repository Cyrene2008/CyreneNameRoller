import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const now = new Date()
const buildHash = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}`

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
