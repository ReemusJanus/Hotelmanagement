import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port: 5200,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5100',
        changeOrigin: true
      },
      '/ws': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5100',
        ws: true,
        changeOrigin: true
      }
    }
  }
}));
