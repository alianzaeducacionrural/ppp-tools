import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { CambiarPasswordModal } from './CambiarPasswordModal'

export function PadrinosManager() {
  const [padrinos, setPadrinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [passwordModal, setPasswordModal] = useState({ open: false, usuario: null })
  const [formData, setFormData] = useState({ email: '', nombre: '', password: '' })

  useEffect(() => {
    cargarPadrinos()
  }, [])

  async function cargarPadrinos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('padrinos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error al cargar padrinos: ' + error.message)
    } else {
      setPadrinos(data || [])
    }
    setLoading(false)
  }

  async function handleAgregarPadrino(e) {
    e.preventDefault()

    if (!formData.email || !formData.nombre || !formData.password) {
      toast.error('Completa todos los campos')
      return
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Sesión expirada, vuelve a iniciar sesión')
      setLoading(false)
      return
    }

    // Create auth user server-side so the admin session is never replaced
    const response = await fetch('/api/crear-padrino', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ email: formData.email, password: formData.password, nombre: formData.nombre })
    })

    const result = await response.json()

    if (!response.ok) {
      toast.error('Error al crear usuario: ' + result.error)
      setLoading(false)
      return
    }

    const { error: padrinoError } = await supabase
      .from('padrinos')
      .insert({ user_id: result.userId, email: formData.email, nombre: formData.nombre, activo: true })

    if (padrinoError) {
      toast.error('Error al registrar padrino: ' + padrinoError.message)
    } else {
      toast.success(`Padrino ${formData.nombre} creado exitosamente`)
      setFormData({ email: '', nombre: '', password: '' })
      await cargarPadrinos()
    }
    setLoading(false)
  }

  async function handleEliminarPadrino(id) {
    if (!confirm('¿Eliminar este padrino? Esta acción no se puede deshacer.')) return
    setLoading(true)
    const { error } = await supabase.from('padrinos').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar padrino: ' + error.message)
    } else {
      toast.success('Padrino eliminado')
      await cargarPadrinos()
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4a3222] mb-6">Gestión de Padrinos</h2>

      {/* Formulario para agregar padrino */}
      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-6 mb-6">
        <h3 className="font-semibold text-[#4a3222] text-lg mb-4 flex items-center gap-2">
          <span>👤</span> Agregar nuevo padrino
        </h3>

        <form onSubmit={handleAgregarPadrino} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#6b4c3a] mb-1 font-medium">Nombre completo *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="block text-[#6b4c3a] mb-1 font-medium">Correo electrónico *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
                placeholder="padrino@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="block text-[#6b4c3a] mb-1 font-medium">Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none placeholder-[#a68a64]"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#6b4c3a] text-white px-6 py-2 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? '⏳ Creando...' : '+ Agregar padrino'}
          </button>
        </form>
      </div>

      {/* Lista de padrinos */}
      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8dcca] bg-[#f5efe6]">
          <h3 className="font-semibold text-[#4a3222]">Padrinos registrados</h3>
          <p className="text-sm text-[#a68a64] mt-1">
            Los padrinos pueden revisar y calificar las evidencias de los estudiantes
          </p>
        </div>

        {loading && padrinos.length === 0 ? (
          <div className="text-center py-12 text-[#a68a64]">Cargando padrinos...</div>
        ) : padrinos.filter(p => p.nombre !== 'Administrador').length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">👥</span>
            <p className="text-[#a68a64]">No hay padrinos registrados</p>
            <p className="text-sm text-[#a68a64] mt-1">Completa el formulario arriba para agregar el primer padrino</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5efe6]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Correo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Fecha registro</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Estado</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[#6b4c3a]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8dcca]">
                {padrinos.filter(p => p.nombre !== 'Administrador').map((padrino) => (
                  <tr key={padrino.id} className="hover:bg-[#f5efe6] transition">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[#4a3222]">{padrino.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#6b4c3a]">{padrino.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#6b4c3a]">
                      {new Date(padrino.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        padrino.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {padrino.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setPasswordModal({ open: true, usuario: padrino })}
                        className="text-[#6b4c3a] hover:text-[#4a3222] mr-3 text-sm font-medium inline-flex items-center gap-1"
                      >
                        🔑 Cambiar pass
                      </button>
                      <button
                        onClick={() => handleEliminarPadrino(padrino.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-[#f5efe6] border border-[#e8dcca] rounded-xl">
        <h4 className="font-medium text-[#4a3222] mb-2 flex items-center gap-2">
          <span>ℹ️</span> Información para padrinos
        </h4>
        <ul className="text-sm text-[#6b4c3a] space-y-1">
          <li>• Los padrinos pueden iniciar sesión con el correo y contraseña que les asignaste</li>
          <li>• Al iniciar sesión, verán automáticamente el panel de revisión de evidencias</li>
          <li>• Los padrinos pueden aprobar/rechazar evidencias y asignar puntuaciones</li>
          <li>• Puedes cambiar la contraseña de cualquier padrino usando el botón 🔑</li>
        </ul>
      </div>

      {passwordModal.open && (
        <CambiarPasswordModal
          usuario={passwordModal.usuario}
          userType="padrino"
          onClose={() => setPasswordModal({ open: false, usuario: null })}
          onSuccess={cargarPadrinos}
        />
      )}
    </div>
  )
}
