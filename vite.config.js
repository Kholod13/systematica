import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // важно для корректной работы на Railway
  server: {
    port: 5173,       // локальный dev порт
    strictPort: true, // чтобы не менялся порт
  },
});
