import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  const token = authHeader.slice(7)

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verify the caller is an admin
  const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !callerUser) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const adminEmails = (process.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(callerUser.email?.toLowerCase())) {
    return res.status(403).json({ error: 'Sin permisos de administrador' })
  }

  const { email, password, nombre } = req.body
  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nombre }
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ userId: data.user.id })
}
