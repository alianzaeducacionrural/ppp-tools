import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function localApiPlugin(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/crear-padrino', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Método no permitido' }))
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { email, password, nombre } = JSON.parse(body)
            const authHeader = req.headers.authorization
            if (!authHeader?.startsWith('Bearer ')) {
              res.writeHead(401, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'No autorizado' }))
              return
            }
            if (!env.SUPABASE_SERVICE_ROLE_KEY) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurado en .env local' }))
              return
            }
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { full_name: nombre }
            })
            if (error) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: error.message }))
              return
            }
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ userId: data.user.id }))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
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