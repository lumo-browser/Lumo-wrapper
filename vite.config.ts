import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features'),
      '@services': path.resolve(__dirname, './src/services'),
      '@automation': path.resolve(__dirname, './src/automation'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@browser': path.resolve(__dirname, './src/browser'),
      '@memory': path.resolve(__dirname, './src/memory'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
