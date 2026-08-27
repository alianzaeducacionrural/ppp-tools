import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { PASSWORD_POR_DEFECTO } from '../../lib/resetearPassword'
import toast from 'react-hot-toast'

// Pantalla obligatoria que aparece cuando un admin restableció la contraseña del
// usuario (user_metadata.debe_cambiar_password = true). No deja pasar hasta que
// cree una contraseña nueva, distinta de la de por defecto.
export function CrearNuevaPassword() {
  const { user, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password === PASSWORD_POR_DEFECTO) {
      toast.error('Elige una contraseña diferente a la temporal')
      return
    }
    if (password !== confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    // Cambia la contraseña y baja el flag en un solo paso.
    const { error } = await supabase.auth.updateUser({
      password,
      data: { debe_cambiar_password: false }
    })

    if (error) {
      toast.error('No se pudo guardar: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('¡Contraseña actualizada! Ya puedes continuar')
    // Recargar para que la sesión tome la metadata nueva (el flag ya en false)
    // y el guard deje pasar al panel correspondiente.
    setTimeout(() => window.location.reload(), 800)
  }

  async function handleSalir() {
    await logout()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-sm">
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center text-3xl border border-white/20">
            🔐
          </div>
          <h2 className="text-white font-bold text-lg mt-3">Crea tu nueva contraseña</h2>
          <p className="text-white/60 text-xs mt-1">
            Tu contraseña fue restablecida. Por seguridad, crea una nueva para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {user?.email && (
            <div className="text-center">
              <p className="text-xs text-[#a68a64]">Cuenta</p>
              <p className="text-sm font-medium text-[#4a3222] break-words">{user.email}</p>
            </div>
          )}

          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium text-sm">Nueva contraseña</label>
            <input
              type={mostrar ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none placeholder-[#a68a64]"
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium text-sm">Confirmar contraseña</label>
            <input
              type={mostrar ? 'text' : 'password'}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none placeholder-[#a68a64]"
              placeholder="Repite la nueva contraseña"
              required
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#6b4c3a] cursor-pointer select-none">
            <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
            Mostrar contraseñas
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><span className="animate-spin">⏳</span> Guardando...</> : '✅ Guardar y continuar'}
          </button>

          <button
            type="button"
            onClick={handleSalir}
            className="w-full text-xs text-[#a68a64] hover:text-[#6b4c3a] transition"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
