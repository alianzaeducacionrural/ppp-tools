import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export function PerfilPadrino() {
  const [loading, setLoading] = useState(false)
  const [editando, setEditando] = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', email: '' })
  const [passwordData, setPasswordData] = useState({ nueva: '', confirmar: '' })
  const [user, setUser] = useState(null)
  const [padrino, setPadrino] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(authUser)
    
    const { data: padrinoData } = await supabase
      .from('padrinos')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    
    if (padrinoData) {
      setPadrino(padrinoData)
      setFormData({ nombre: padrinoData.nombre || '', email: authUser.email })
    }
  }

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
      toast.success('Perfil actualizado correctamente')
      setEditando(false)
      cargarDatos()
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
      toast.success('Contraseña actualizada correctamente')
      setCambiandoPassword(false)
      setPasswordData({ nueva: '', confirmar: '' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
            👤 Mi Perfil
          </h1>
          <p className="text-[#a68a64] mt-1">Gestiona tu información personal</p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
          <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] p-6 text-center">
            <div className="text-6xl mb-2">👨‍🏫</div>
            <h2 className="text-xl font-bold text-white">{padrino?.nombre || user?.email?.split('@')[0]}</h2>
            <p className="text-[#d4c4a8] text-sm">Padrino</p>
          </div>

          <div className="p-6">
            {!editando && !cambiandoPassword && (
              <div className="flex gap-3 mb-6">
                <button onClick={() => setEditando(true)} className="bg-[#6b4c3a] text-white px-4 py-2 rounded-lg hover:bg-[#4a3222]">
                  ✏️ Editar perfil
                </button>
                <button onClick={() => setCambiandoPassword(true)} className="bg-[#a68a64] text-white px-4 py-2 rounded-lg hover:bg-[#8b6b54]">
                  🔑 Cambiar contraseña
                </button>
              </div>
            )}

            {editando && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6b4c3a] mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6b4c3a] mb-1">Correo</label>
                  <input type="email" value={formData.email} disabled className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg bg-gray-100" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setEditando(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {cambiandoPassword && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6b4c3a] mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordData.nueva}
                    onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6b4c3a] mb-1">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={passwordData.confirmar}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg">
                    {loading ? 'Guardando...' : 'Cambiar'}
                  </button>
                  <button type="button" onClick={() => setCambiandoPassword(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {!editando && !cambiandoPassword && (
              <div className="space-y-3 text-sm">
                <p><span className="text-[#a68a64]">📧 Correo:</span> {user?.email}</p>
                <p><span className="text-[#a68a64]">👤 Nombre:</span> {padrino?.nombre || 'No especificado'}</p>
                <p><span className="text-[#a68a64]">👔 Rol:</span> Padrino</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}