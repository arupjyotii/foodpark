import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /* VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'RestaurantOS',
        short_name: 'RestOS',
        description: 'Production-grade restaurant management system',
        theme_color: '#020617',
      }
    }) */
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
