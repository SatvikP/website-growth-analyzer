import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure build works on Railway
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // TODO: Update this to your Railway backend URL in production
    // For development, proxy API calls to local backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  // For production build served by Express
  base: './'
})