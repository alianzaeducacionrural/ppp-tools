import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuración del servidor de desarrollo
  server: {
    // Desactivar Hot Module Replacement para evitar recargas innecesarias
    hmr: false,
    
    // Configuración de observación de archivos
    watch: {
      // Desactivar polling (evita recargas falsas)
      usePolling: false,
      // Ignorar cambios en node_modules
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    
    // Puerto del servidor
    port: 5173,
    
    // Mostrar overlay de errores (útil para debugging)
    hmr: {
      overlay: false
    }
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'react-hot-toast'
    ],
    // Forzar optimización en desarrollo
    force: true
  },
  
  // Configuración de build para producción
  build: {
    // Source maps para debugging (false en producción)
    sourcemap: false,
    
    // Tamaño de chunk
    chunkSizeWarningLimit: 1000,
    
    // Configuración de rollup
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para mejor caché
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['react-hot-toast', 'xlsx']
        }
      }
    }
  },
  
  // Resolver alias (para importaciones más limpias)
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@context': '/src/context',
      '@lib': '/src/lib',
      '@data': '/src/data'
    }
  },
  
  // Prevenir recargas en desarrollo
  esbuild: {
    // Log de errores menos verboso
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})