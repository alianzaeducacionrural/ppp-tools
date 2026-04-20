import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { CambiarPasswordModal } from './CambiarPasswordModal'

export function PadrinosManager() {
  const [padrinos, setPadrinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [passwordModal, setPasswordModal] = useState({ open: false, usuario: null })
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: ''
  })

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
      console.error('Error al cargar padrinos:', error)
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

    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.nombre
        }
      }
    })

    if (authError) {
      toast.error('Error al crear usuario: ' + authError.message)
      setLoading(false)
      return
    }

    // 2. Crear registro en tabla padrinos
    const { error: padrinoError } = await supabase
      .from('padrinos')
      .insert({
        user_id: authData.user.id,
        email: formData.email,
        nombre: formData.nombre,
        activo: true
      })

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

    const { error: padrinoError } = await supabase
      .from('padrinos')
      .delete()
      .eq('id', id)

    if (padrinoError) {
      toast.error('Error al eliminar padrino: ' + padrinoError.message)
    } else {
      toast.success('Padrino eliminado')
      await cargarPadrinos()
    }

    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Gestión de Padrinos</h2>

      {/* Formulario para agregar padrino */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="font-medium mb-4 text-lg flex items-center gap-2">
          <span>👤</span> Agregar nuevo padrino
        </h3>
        
        <form onSubmit={handleAgregarPadrino} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Nombre completo *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Correo electrónico *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="padrino@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? '⏳ Creando...' : '+ Agregar padrino'}
          </button>
        </form>
      </div>

      {/* Lista de padrinos */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-medium">Padrinos registrados</h3>
          <p className="text-sm text-gray-500 mt-1">
            Los padrinos pueden revisar y calificar las evidencias de los estudiantes
          </p>
        </div>
        
        {loading && padrinos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Cargando padrinos...</div>
          </div>
        ) : padrinos.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">👥</span>
            <p className="text-gray-500">No hay padrinos registrados</p>
            <p className="text-sm text-gray-400 mt-1">Completa el formulario arriba para agregar tu primer padrino</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {padrinos.filter(p => p.nombre !== 'Administrador').map((padrino) => (
                  <tr key={padrino.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{padrino.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">{padrino.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">
                        {new Date(padrino.created_at).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        padrino.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {padrino.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setPasswordModal({ open: true, usuario: padrino })}
                        className="text-blue-600 hover:text-blue-800 mr-3 text-sm flex items-center gap-1 inline-flex"
                        title="Cambiar contraseña"
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

      {/* Información útil */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <span>ℹ️</span> Información para padrinos
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los padrinos pueden iniciar sesión con el correo y contraseña que les asignaste</li>
          <li>• Al iniciar sesión, verán automáticamente el panel de revisión de evidencias</li>
          <li>• Los padrinos pueden aprobar/rechazar evidencias y asignar puntuaciones</li>
          <li>• Puedes cambiar la contraseña de cualquier padrino usando el botón 🔑</li>
        </ul>
      </div>

      {/* Modal para cambiar contraseña */}
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