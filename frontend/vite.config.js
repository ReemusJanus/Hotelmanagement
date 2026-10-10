import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  preview: { port: 5200, strictPort: true },
  server: {
    port: 5200,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:6000',
        changeOrigin: true
      },
      '/ws': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:6000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}));
