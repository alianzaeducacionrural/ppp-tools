import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Replica en desarrollo las funciones serverless de /api (que en producción las corre Vercel)
function localApiPlugin(env) {
  const rutas = {
    '/api/crear-padrino': async (supabaseAdmin, body) => {
      const { email, password, nombre } = body
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: nombre }
      })
      if (error) return { status: 400, payload: { error: error.message } }
      return { status: 200, payload: { userId: data.user.id } }
    },
    '/api/eliminar-usuario': async (supabaseAdmin, body) => {
      const { userId } = body
      if (!userId) return { status: 400, payload: { error: 'Falta el userId' } }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error && !/not found/i.test(error.message)) {
        return { status: 400, payload: { error: error.message } }
      }
      return { status: 200, payload: { ok: true } }
    }
  }

  return {
    name: 'local-api',
    configureServer(server) {
      for (const [ruta, handler] of Object.entries(rutas)) {
        server.middlewares.use(ruta, (req, res) => {
          const responder = (status, payload) => {
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(payload))
          }

          if (req.method !== 'POST') {
            return responder(405, { error: 'Método no permitido' })
          }
          if (!req.headers.authorization?.startsWith('Bearer ')) {
            return responder(401, { error: 'No autorizado' })
          }
          if (!env.SUPABASE_SERVICE_ROLE_KEY) {
            return responder(500, { error: 'SUPABASE_SERVICE_ROLE_KEY no configurado en .env local' })
          }

          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              const { createClient } = await import('@supabase/supabase-js')
              const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
              const { status, payload } = await handler(supabaseAdmin, JSON.parse(body || '{}'))
              responder(status, payload)
            } catch (err) {
              responder(500, { error: err.message })
            }
          })
        })
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), localApiPlugin(env)],
    server: {
      hmr: false,
      watch: { usePolling: false }
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000
    }
  }
})
