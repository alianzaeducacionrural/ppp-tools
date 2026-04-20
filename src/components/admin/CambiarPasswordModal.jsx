import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export function CambiarPasswordModal({ usuario, userType, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      // Método 1: Usar la función SQL que creamos
      const { data, error } = await supabase.rpc('cambiar_password', {
        user_email: usuario.email,
        nueva_password: newPassword
      })

      if (error) {
        console.error('Error al cambiar contraseña:', error)
        toast.error('Error: ' + error.message)
      } else {
        toast.success(`Contraseña actualizada para ${usuario.nombre_completo || usuario.nombre}`)
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cambiar la contraseña')
    }

    setLoading(false)
  }

  const nombreUsuario = usuario.nombre_completo || usuario.nombre || 'el usuario'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          <span className="text-2xl">🔑</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500">{nombreUsuario}</p>
            <p className="text-xs text-gray-400">{usuario.email}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-400 mt-1">La contraseña debe tener al menos 6 caracteres</p>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Repite la nueva contraseña"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : (
                '✅ Guardar contraseña'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800 flex items-start gap-2">
            <span>⚠️</span>
            El usuario deberá usar la nueva contraseña la próxima vez que inicie sesión.
          </p>
        </div>
      </div>
    </div>
  )
}