import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
proxy: {
      // Опционально: прокси для Kratos API (если CORS проблемы)
      '/kratos': {
        target: 'http://localhost:4433',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})