import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { CambiarPasswordModal } from './CambiarPasswordModal'

const SELECT_CLS = 'px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] bg-white disabled:opacity-50 disabled:cursor-not-allowed w-full'

const FILTROS_INICIALES = { municipio_id: '', busqueda: '' }

export function DocentesManager() {
  const [docentes, setDocentes] = useState([])
  const [proyectosPorDocente, setProyectosPorDocente] = useState({})
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [passwordModal, setPasswordModal] = useState({ open: false, usuario: null })

  useEffect(() => {
    supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setMunicipios(data || []))
  }, [])

  useEffect(() => {
    cargarDocentes()
  }, [filtros.municipio_id])

  async function cargarDocentes() {
    setLoading(true)

    let query = supabase
      .from('docentes')
      .select('*, municipios(nombre), instituciones(nombre)')
      .order('created_at', { ascending: false })

    if (filtros.municipio_id) query = query.eq('municipio_id', filtros.municipio_id)

    const { data, error } = await query

    if (error) {
      toast.error('Error al cargar docentes')
      setLoading(false)
      return
    }

    setDocentes(data || [])

    if (data?.length) {
      const { data: proyectos } = await supabase
        .from('proyectos_dirigidos')
        .select('docente_id, estado')
        .in('docente_id', data.map(d => d.id))

      const conteo = {}
      ;(proyectos || []).forEach(p => {
        conteo[p.docente_id] = conteo[p.docente_id] || { total: 0, aprobados: 0 }
        conteo[p.docente_id].total += 1
        if (p.estado === 'aprobado') conteo[p.docente_id].aprobados += 1
      })
      setProyectosPorDocente(conteo)
    } else {
      setProyectosPorDocente({})
    }

    setLoading(false)
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este docente? Se borrarán todos sus proyectos dirigidos (costos, utilidades, archivos).')) return

    const { data: proyectos } = await supabase.from('proyectos_dirigidos').select('id').eq('docente_id', id)
    if (proyectos?.length) {
      const proyectoIds = proyectos.map(p => p.id)
      await supabase.from('proyecto_dirigido_archivos').delete().in('proyecto_dirigido_id', proyectoIds)
      await supabase.from('proyecto_dirigido_costos').delete().in('proyecto_dirigido_id', proyectoIds)
      await supabase.from('proyecto_dirigido_utilidades').delete().in('proyecto_dirigido_id', proyectoIds)
      await supabase.from('proyectos_dirigidos').delete().in('id', proyectoIds)
    }

    const { error } = await supabase.from('docentes').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
    } else {
      toast.success('Docente eliminado')
      cargarDocentes()
    }
  }

  const docentesFiltrados = filtros.busqueda.trim()
    ? docentes.filter(d => d.nombre_completo?.toLowerCase().includes(filtros.busqueda.trim().toLowerCase()))
    : docentes

  const hayFiltros = filtros.municipio_id || filtros.busqueda

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4a3222] mb-6">Gestión de Docentes</h2>

      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            placeholder="Buscar por nombre..."
            className={SELECT_CLS}
          />
          <select
            value={filtros.municipio_id}
            onChange={(e) => setFiltros(prev => ({ ...prev, municipio_id: e.target.value }))}
            className={SELECT_CLS}
          >
            <option value="">Todos los municipios</option>
            {municipios.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {hayFiltros && (
          <button onClick={limpiarFiltros} className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium">
            🧹 Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#a68a64]">Cargando docentes...</div>
      ) : docentesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-8 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-[#a68a64]">No hay docentes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f5efe6]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Correo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Municipio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Institución</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Proyectos</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b4c3a]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.map((doc) => {
                const conteo = proyectosPorDocente[doc.id]
                return (
                  <tr key={doc.id} className="border-t border-[#e8dcca] hover:bg-[#f5efe6] transition">
                    <td className="px-4 py-3 font-medium text-[#4a3222]">{doc.nombre_completo}</td>
                    <td className="px-4 py-3 text-sm text-[#6b4c3a]">{doc.email}</td>
                    <td className="px-4 py-3 text-[#6b4c3a]">{doc.municipios?.nombre || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate text-[#6b4c3a]" title={doc.instituciones?.nombre}>
                        {doc.instituciones?.nombre || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b4c3a] text-sm">
                      {conteo ? `${conteo.aprobados}/${conteo.total} aprobados` : 'Sin proyectos'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setPasswordModal({ open: true, usuario: doc })}
                        className="text-[#6b4c3a] hover:text-[#4a3222] mr-3 text-sm font-medium inline-flex items-center gap-1"
                        title="Cambiar contraseña"
                      >
                        🔑 Contraseña
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {passwordModal.open && (
        <CambiarPasswordModal
          usuario={passwordModal.usuario}
          userType="docente"
          onClose={() => setPasswordModal({ open: false, usuario: null })}
          onSuccess={cargarDocentes}
        />
      )}
    </div>
  )
}
