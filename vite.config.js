import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// URL твоего бэкенда на Railway
const API_URL = 'https://systematica-erp-backend-production.up.railway.app';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // все запросы на /ai_chat будут перенаправляться на прод-бэкенд
      '/ai_chat': {
        target: API_URL,
        changeOrigin: true,
        secure: false, // для dev, если backend без валидного SSL
      },
    },
  },
});
