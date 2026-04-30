import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false,
    watch: {
      usePolling: false
    }
  },
  // Eliminar la configuración de esbuild que causa la advertencia
  // O usar solo una de las opciones
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})