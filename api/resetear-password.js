import { createClient } from '@supabase/supabase-js'

// Contraseña por defecto al restablecer. Debe coincidir con la del cliente
// (src/lib/resetearPassword.js) para el mensaje que ve el admin.
const PASSWORD_POR_DEFECTO = '12345678'

// Restablece la contraseña de un usuario a la de por defecto y marca su cuenta
// para que deba crear una nueva la próxima vez que inicie sesión. Solo un admin
// puede invocarlo. El flag vive en user_metadata.debe_cambiar_password.
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

  // Verificar que quien llama es admin
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

  // No tiene sentido que un admin se restablezca a sí mismo por esta vía
  if (userId === callerUser.id) {
    return res.status(400).json({ error: 'No puedes restablecer tu propia contraseña aquí' })
  }

  // Traer la metadata actual para no perderla al escribir el flag
  const { data: existente, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (getError || !existente?.user) {
    return res.status(404).json({ error: 'No se encontró la cuenta de acceso de este usuario' })
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: PASSWORD_POR_DEFECTO,
    user_metadata: { ...(existente.user.user_metadata || {}), debe_cambiar_password: true }
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}
