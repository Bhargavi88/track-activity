import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Standalone Vite config for browser-only dev (no Electron)
export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  css: {
    postcss: resolve('postcss.config.js')
  },
  server: {
    port: 5173,
    open: true
  }
})
