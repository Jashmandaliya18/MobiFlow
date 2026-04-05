import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/raw': 'http://localhost:5000',
      '/manufacturing': 'http://localhost:5000',
      '/qc': 'http://localhost:5000',
      '/inventory': 'http://localhost:5000',
      '/order': 'http://localhost:5000',
      '/dispatch': 'http://localhost:5000',
      '/dashboard': 'http://localhost:5000',
      '/reports': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
      '/users': 'http://localhost:5000'
    }
  }
})
