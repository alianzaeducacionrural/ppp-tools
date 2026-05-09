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
      .select('*, municipios(nombre), instituciones(nombre)')
      .order('created_at', { ascending: false })

    if (filtros.grado) {
      query = query.eq('grado', filtros.grado)
    }
    if (filtros.tipo_proyecto) {
      query = query.eq('tipo_proyecto', filtros.tipo_proyecto)
    }

    const { data, error } = await query

    if (error) {
      toast.error('Error al cargar estudiantes')
      setLoading(false)
      return
    }

    let resultado = data || []

    if (filtros.municipio) {
      resultado = resultado.filter(e =>
        e.municipios?.nombre?.toLowerCase().includes(filtros.municipio.toLowerCase())
      )
    }
    if (filtros.institucion) {
      resultado = resultado.filter(e =>
        e.instituciones?.nombre?.toLowerCase().includes(filtros.institucion.toLowerCase())
      )
    }

    setEstudiantes(resultado)
    setLoading(false)
  }

  async function handleDelete(id) {
    if (confirm('¿Eliminar este estudiante? También se eliminarán sus evidencias.')) {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id)
      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Estudiante eliminado')
        cargarEstudiantes()
      }
    }
  }

  const hayFiltros = filtros.municipio || filtros.institucion || filtros.grado || filtros.tipo_proyecto

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4a3222] mb-6">Gestión de Estudiantes</h2>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Municipio"
            value={filtros.municipio}
            onChange={(e) => setFiltros({ ...filtros, municipio: e.target.value })}
            className="px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
          />
          <input
            type="text"
            placeholder="Institución"
            value={filtros.institucion}
            onChange={(e) => setFiltros({ ...filtros, institucion: e.target.value })}
            className="px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
          />
          <select
            value={filtros.grado}
            onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}
            className="px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222]"
          >
            <option value="">Todos los grados</option>
            {[4,5,6,7,8,9,10,11].map(g => (
              <option key={g} value={g}>{g}°</option>
            ))}
          </select>
          <select
            value={filtros.tipo_proyecto}
            onChange={(e) => setFiltros({ ...filtros, tipo_proyecto: e.target.value })}
            className="px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222]"
          >
            <option value="">Todos los proyectos</option>
            <option value="cafe">☕ Escuela y Café</option>
            <option value="alimentacion">🌽 Seguridad Alimentaria</option>
          </select>
        </div>
        {hayFiltros && (
          <button
            onClick={() => setFiltros({ municipio: '', institucion: '', grado: '', tipo_proyecto: '' })}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            🧹 Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#a68a64]">Cargando estudiantes...</div>
      ) : estudiantes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-8 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-[#a68a64]">No hay estudiantes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f5efe6]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Documento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Municipio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Institución</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Grado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Proyecto</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b4c3a]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr key={est.id} className="border-t border-[#e8dcca] hover:bg-[#f5efe6] transition">
                  <td className="px-4 py-3 font-medium text-[#4a3222]">{est.nombre_completo}</td>
                  <td className="px-4 py-3 text-sm text-[#6b4c3a]">{est.numero_documento}</td>
                  <td className="px-4 py-3 text-[#6b4c3a]">{est.municipios?.nombre || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-[#6b4c3a]" title={est.instituciones?.nombre}>
                      {est.instituciones?.nombre || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6b4c3a]">{est.grado}°</td>
                  <td className="px-4 py-3 text-[#6b4c3a]">
                    {est.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setPasswordModal({ open: true, usuario: est })}
                      className="text-[#6b4c3a] hover:text-[#4a3222] mr-3 text-sm font-medium inline-flex items-center gap-1"
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
