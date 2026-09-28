import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4444",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4444",
        changeOrigin: true,
      },
      "/profiles": {
        target: "http://localhost:4444",
        changeOrigin: true,
      },
    },
  },
})
