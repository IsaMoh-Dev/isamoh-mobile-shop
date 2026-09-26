import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward all /api calls to the Express backend during development
      '/api': {
        target:      'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
      // Forward /assets (images) to the backend which serves the PHP assets folder
      '/assets': {
        target:      'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  build: {
    outDir:        '../backend/public/client',
    emptyOutDir:   true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts';
          if (id.includes('swiper')) return 'swiper';
        },
      },
    },
  },
});
