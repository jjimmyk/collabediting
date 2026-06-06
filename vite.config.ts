import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseUrl =
    env.VITE_SUPABASE_URL ??
    env.NEXT_PUBLIC_SUPABASE_URL ??
    env.SUPABASE_URL ??
    ''

  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    ''

  const appUrl =
    env.VITE_APP_URL ??
    env.APP_URL ??
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : env.VERCEL_URL
        ? `https://${env.VERCEL_URL}`
        : '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_APP_URL': JSON.stringify(appUrl),
    },
    server: {
      proxy: {
        '/seerist-proxy': {
          target: 'https://app.seerist.com',
          changeOrigin: true,
          secure: true,
          rewrite: (urlPath) => urlPath.replace(/^\/seerist-proxy/, '/hyperionapi'),
        },
      },
    },
  }
})
