import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@engine': '/src/engine',
      '@game': '/src/game',
      '@ui': '/src/ui',
      '@workers': '/src/workers',
      '@assets': '/src/assets'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: [],
    globals: true
  }
});
