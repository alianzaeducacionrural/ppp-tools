import { supabase } from './supabase'

// Contraseña por defecto al restablecer desde el panel de admin.
// Debe coincidir con la del endpoint (api/resetear-password.js).
export const PASSWORD_POR_DEFECTO = '12345678'

/**
 * Restablece la contraseña de un usuario a la de por defecto (solo admin).
 * Además marca la cuenta para exigir una nueva contraseña en el primer ingreso.
 *
 * Devuelve { ok, error }. No lanza excepciones.
 */
export async function resetearPassword(userId) {
  if (!userId) return { ok: false, error: 'Este usuario no tiene una cuenta de acceso.' }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: 'Sesión expirada, vuelve a iniciar sesión.' }

    const response = await fetch('/api/resetear-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok) return { ok: false, error: result.error || 'No se pudo restablecer la contraseña.' }
    return { ok: true, error: null }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
