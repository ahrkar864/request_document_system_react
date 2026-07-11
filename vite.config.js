import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Default to localhost:8000 if VITE_API_URL is not set
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      host: true,
      watch: {
        usePolling: true,
        interval: 1000,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      // chunk size warning limit တင်ကြိုတိုးပေးထား (warning ရှောင်ဖို့)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // React core - တစ်ခါဆွဲရင် ကျန်တာအကုန် သုံးနေရမယ်၊ often-changed code နဲ့ မရောပါနဲ့
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],

            // Mantine UI library - size ကြီးလို့ သီးသန့်ခွဲထား
            'mantine-vendor': [
              '@mantine/core',
              '@mantine/hooks',
              '@mantine/dates',
              '@mantine/form',
            ],

            // Icons + alert library - project ထဲမှာ တွေ့ရတဲ့ package အမည်တွေအတိုင်း ပြင်ပါ
            'ui-utils-vendor': ['react-icons', 'sweetalert2'],
          },
        },
      },
    },
  }
})