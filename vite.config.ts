import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Avoids browser CORS when calling Seerist World of Data from the
      // dev server. Mount under /seerist-proxy/* and rewrite to the real
      // host. Production deployments need an equivalent reverse proxy.
      '/seerist-proxy': {
        target: 'https://app.seerist.com',
        changeOrigin: true,
        secure: true,
        rewrite: (urlPath) => urlPath.replace(/^\/seerist-proxy/, '/hyperionapi'),
      },
    },
  },
})
