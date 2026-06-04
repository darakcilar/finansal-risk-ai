import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // 1. Log çekme ve temizleme istekleri -> Python'a (5002)
      '/api/logs': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      },
      // 2. YENİ EKLENEN: Login istekleri -> Python'a (5002)
      '/api/login': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      },
      // 3. Kalan tüm analiz (predict) istekleri -> Node.js'e (5001)
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
})