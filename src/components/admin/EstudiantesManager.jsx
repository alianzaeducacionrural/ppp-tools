import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { CambiarPasswordModal } from './CambiarPasswordModal'

export function EstudiantesManager() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    municipio: '',
    institucion: '',
    grado: '',
    tipo_proyecto: ''
  })
  const [passwordModal, setPasswordModal] = useState({ open: false, usuario: null })

  useEffect(() => {
    cargarEstudiantes()
  }, [filtros])

  async function cargarEstudiantes() {
    setLoading(true)

    let query = supabase
      .from('estudiantes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filtros.municipio) {
      query = query.ilike('municipio', `%${filtros.municipio}%`)
    }
    if (filtros.institucion) {
      query = query.ilike('institucion', `%${filtros.institucion}%`)
    }
    if (filtros.grado) {
      query = query.eq('grado', filtros.grado)
    }
    if (filtros.tipo_proyecto) {
      query = query.eq('tipo_proyecto', filtros.tipo_proyecto)
    }

    const { data, error } = await query

    if (error) {
      toast.error('Error al cargar estudiantes')
    } else {
      setEstudiantes(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (confirm('¿Eliminar este estudiante? También se eliminarán sus evidencias.')) {
      const { error } = await supabase
        .from('estudiantes')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Estudiante eliminado')
        cargarEstudiantes()
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Gestión de Estudiantes</h2>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Municipio"
            value={filtros.municipio}
            onChange={(e) => setFiltros({...filtros, municipio: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Institución"
            value={filtros.institucion}
            onChange={(e) => setFiltros({...filtros, institucion: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          <select
            value={filtros.grado}
            onChange={(e) => setFiltros({...filtros, grado: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">Todos los grados</option>
            {[4,5,6,7,8,9,10,11].map(g => (
              <option key={g} value={g}>{g}°</option>
            ))}
          </select>
          <select
            value={filtros.tipo_proyecto}
            onChange={(e) => setFiltros({...filtros, tipo_proyecto: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">Todos los proyectos</option>
            <option value="cafe">☕ Escuela y Café</option>
            <option value="alimentacion">🌽 Seguridad Alimentaria</option>
          </select>
        </div>
        {(filtros.municipio || filtros.institucion || filtros.grado || filtros.tipo_proyecto) && (
          <button
            onClick={() => setFiltros({ municipio: '', institucion: '', grado: '', tipo_proyecto: '' })}
            className="mt-3 text-sm text-red-600 hover:text-red-700"
          >
            🧹 Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando estudiantes...</div>
      ) : estudiantes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-gray-500">No hay estudiantes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Documento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Municipio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Institución</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Grado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Proyecto</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr key={est.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-3">{est.nombre_completo}</td>
                  <td className="px-4 py-3 text-sm">{est.numero_documento}</td>
                  <td className="px-4 py-3">{est.municipio}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate" title={est.institucion}>{est.institucion}</div>
                  </td>
                  <td className="px-4 py-3">{est.grado}°</td>
                  <td className="px-4 py-3">
                    {est.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
                   </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setPasswordModal({ open: true, usuario: est })}
                      className="text-blue-600 hover:text-blue-800 mr-3 text-sm flex items-center gap-1 inline-flex"
                      title="Cambiar contraseña"
                    >
                      🔑 Cambiar pass
                    </button>
                    <button
                      onClick={() => handleDelete(est.id)}
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

      {/* Modal para cambiar contraseña */}
      {passwordModal.open && (
        <CambiarPasswordModal
          usuario={passwordModal.usuario}
          userType="estudiante"
          onClose={() => setPasswordModal({ open: false, usuario: null })}
          onSuccess={cargarEstudiantes}
        />
      )}
    </div>
  )
}