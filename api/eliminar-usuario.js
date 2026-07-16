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

  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'Falta el userId' })
  }

  // No permitir que un admin se borre a sí mismo
  if (userId === callerUser.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' })
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  // Si la cuenta ya no existe en auth, se considera éxito (el objetivo es que no quede)
  if (error && !/not found/i.test(error.message)) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}
