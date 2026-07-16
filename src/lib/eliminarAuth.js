import { supabase } from './supabase'

/**
 * Elimina la cuenta de autenticación de un usuario.
 *
 * Sin esto, al borrar a alguien desde el panel de admin su cuenta seguiría
 * existiendo en Auth y no podría volver a registrarse con el mismo correo
 * ("User already registered"), quedando bloqueado en "Sin rol asignado".
 *
 * Devuelve { ok, error }. No lanza excepciones: el borrado de los datos ya
 * ocurrió, así que un fallo aquí se reporta pero no revierte nada.
 */
export async function eliminarCuentaAuth(userId) {
  if (!userId) return { ok: true, error: null }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: 'Sesión expirada' }

    const response = await fetch('/api/eliminar-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok) return { ok: false, error: result.error || 'Error al eliminar la cuenta' }
    return { ok: true, error: null }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
