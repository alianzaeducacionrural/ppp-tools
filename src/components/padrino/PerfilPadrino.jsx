import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const INPUT_CLS = 'w-full px-3 py-2.5 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition'
const LABEL_CLS = 'block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1'

export function PerfilPadrino() {
  const [loading, setLoading]                   = useState(false)
  const [editando, setEditando]                 = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [formData, setFormData]                 = useState({ nombre: '', email: '' })
  const [passwordData, setPasswordData]         = useState({ nueva: '', confirmar: '' })
  const [user, setUser]                         = useState(null)
  const [padrino, setPadrino]                   = useState(null)

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      const { data } = await supabase
        .from('padrinos')
        .select('*')
        .eq('user_id', authUser.id)
        .single()
      if (data) {
        setPadrino(data)
        setFormData({ nombre: data.nombre || '', email: authUser.email })
      }
    }
    cargarDatos()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('padrinos')
      .update({ nombre: formData.nombre })
      .eq('user_id', user.id)
    if (error) {
      toast.error('Error al actualizar perfil')
    } else {
      toast.success('Perfil actualizado')
      setPadrino(prev => ({ ...prev, nombre: formData.nombre }))
      setEditando(false)
    }
    setLoading(false)
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (passwordData.nueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordData.nueva !== passwordData.confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwordData.nueva })
    if (error) {
      toast.error('Error al cambiar contraseña')
    } else {
      toast.success('Contraseña actualizada')
      setCambiandoPassword(false)
      setPasswordData({ nueva: '', confirmar: '' })
    }
    setLoading(false)
  }

  const nombreMostrado = padrino?.nombre || user?.email?.split('@')[0] || 'Padrino'

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">

      {/* Banner de perfil */}
      <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] rounded-2xl shadow-lg p-5 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 text-[80px] opacity-[0.05] leading-none select-none">👨‍🏫</div>
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
            👨‍🏫
          </div>
          <div>
            <p className="text-xs opacity-60 uppercase tracking-widest font-semibold mb-0.5">Padrino</p>
            <h2 className="text-xl font-bold leading-tight">{nombreMostrado}</h2>
            <p className="text-xs opacity-60 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Sección de datos */}
      {!editando && !cambiandoPassword && (
        <>
          <div className="bg-white rounded-2xl border border-[#e8dcca] overflow-hidden">
            <div className="bg-gradient-to-r from-[#f5efe6] to-white px-5 py-3.5 border-b border-[#e8dcca]">
              <h3 className="text-sm font-bold text-[#4a3222]">Información de la cuenta</h3>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#e8dcca]">
                <p className={LABEL_CLS}>👤 Nombre</p>
                <p className="text-sm font-medium text-[#4a3222]">{padrino?.nombre || 'No especificado'}</p>
              </div>
              <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#e8dcca]">
                <p className={LABEL_CLS}>📧 Correo</p>
                <p className="text-sm font-medium text-[#4a3222] truncate">{user?.email}</p>
              </div>
              <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#e8dcca]">
                <p className={LABEL_CLS}>👔 Rol</p>
                <p className="text-sm font-medium text-[#4a3222]">Padrino</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEditando(true)}
              className="flex-1 bg-[#6b4c3a] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4a3222] transition"
            >
              ✏️ Editar perfil
            </button>
            <button
              onClick={() => setCambiandoPassword(true)}
              className="flex-1 bg-white text-[#6b4c3a] py-2.5 rounded-xl text-sm font-semibold border border-[#e8dcca] hover:border-[#d4c4a8] hover:bg-[#faf7f3] transition"
            >
              🔑 Cambiar contraseña
            </button>
          </div>
        </>
      )}

      {/* Formulario de edición */}
      {editando && (
        <div className="bg-white rounded-2xl border border-[#e8dcca] overflow-hidden">
          <div className="bg-gradient-to-r from-[#f5efe6] to-white px-5 py-3.5 border-b border-[#e8dcca]">
            <h3 className="text-sm font-bold text-[#4a3222]">Editar perfil</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className={LABEL_CLS}>Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className={INPUT_CLS}
                required
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Correo (no editable)</label>
              <input type="email" value={formData.email} disabled className={`${INPUT_CLS} opacity-60 cursor-not-allowed`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition">
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditando(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#e8dcca] text-[#6b4c3a] hover:bg-[#faf7f3] transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario de contraseña */}
      {cambiandoPassword && (
        <div className="bg-white rounded-2xl border border-[#e8dcca] overflow-hidden">
          <div className="bg-gradient-to-r from-[#f5efe6] to-white px-5 py-3.5 border-b border-[#e8dcca]">
            <h3 className="text-sm font-bold text-[#4a3222]">Cambiar contraseña</h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
            <div>
              <label className={LABEL_CLS}>Nueva contraseña</label>
              <input
                type="password"
                value={passwordData.nueva}
                onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                className={`${INPUT_CLS} ${passwordData.nueva && passwordData.nueva.length < 6 ? 'border-red-300' : ''}`}
                placeholder="Mínimo 6 caracteres"
                required
              />
              {passwordData.nueva && passwordData.nueva.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>
            <div>
              <label className={LABEL_CLS}>Confirmar contraseña</label>
              <input
                type="password"
                value={passwordData.confirmar}
                onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                className={`${INPUT_CLS} ${passwordData.confirmar && passwordData.confirmar !== passwordData.nueva ? 'border-red-300' : ''}`}
                placeholder="Repite la contraseña"
                required
              />
              {passwordData.confirmar && passwordData.confirmar !== passwordData.nueva && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition">
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
              <button type="button" onClick={() => setCambiandoPassword(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#e8dcca] text-[#6b4c3a] hover:bg-[#faf7f3] transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
