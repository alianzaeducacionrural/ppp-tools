import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false, // Desactivar HMR para evitar recargas al volver a la pestaña
    watch: {
      usePolling: false
    }
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
})