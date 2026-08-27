import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { eliminarCuentaAuth } from '../../lib/eliminarAuth'
import { resetearPassword, PASSWORD_POR_DEFECTO } from '../../lib/resetearPassword'
import { EstudianteInfoModal } from './EstudianteInfoModal'

const SELECT_CLS = 'px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] bg-white disabled:opacity-50 disabled:cursor-not-allowed w-full'

const FILTROS_INICIALES = { municipio_id: '', institucion_id: '', grado: '', tipo_proyecto: '', busqueda: '' }

export function EstudiantesManager() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState([])
  const [instituciones, setInstituciones] = useState([])
  const [loadingInstituciones, setLoadingInstituciones] = useState(false)
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [infoModal, setInfoModal] = useState({ open: false, estudiante: null })
  const [reseteandoId, setReseteandoId] = useState(null)

  useEffect(() => {
    supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setMunicipios(data || []))
  }, [])

  // El buscador de texto se aplica en el cliente, así que no dispara recargas.
  useEffect(() => {
    cargarEstudiantes()
  }, [filtros.municipio_id, filtros.institucion_id, filtros.grado, filtros.tipo_proyecto])

  async function handleMunicipioChange(municipioId) {
    setFiltros(prev => ({ ...prev, municipio_id: municipioId, institucion_id: '' }))
    setInstituciones([])

    if (!municipioId) return

    setLoadingInstituciones(true)
    const { data } = await supabase
      .from('instituciones')
      .select('id, nombre')
      .eq('municipio_id', municipioId)
      .order('nombre')
    setInstituciones(data || [])
    setLoadingInstituciones(false)
  }

  async function cargarEstudiantes() {
    setLoading(true)

    let query = supabase
      .from('estudiantes')
      .select('*, municipios(nombre), instituciones(nombre), sedes(nombre)')
      .order('created_at', { ascending: false })

    if (filtros.municipio_id)   query = query.eq('municipio_id', filtros.municipio_id)
    if (filtros.institucion_id) query = query.eq('institucion_id', filtros.institucion_id)
    if (filtros.grado)          query = query.eq('grado', filtros.grado)
    if (filtros.tipo_proyecto)  query = query.eq('tipo_proyecto', filtros.tipo_proyecto)

    const { data, error } = await query

    if (error) {
      toast.error('Error al cargar estudiantes')
      setLoading(false)
      return
    }

    setEstudiantes(data || [])
    setLoading(false)
  }

  function limpiarFiltros() {
    setInstituciones([])
    setFiltros(FILTROS_INICIALES)
  }

  async function handleResetPassword(est) {
    if (!est.user_id) {
      toast.error('Este estudiante no tiene una cuenta de acceso.')
      return
    }
    if (!confirm(
      `¿Restablecer la contraseña de ${est.nombre_completo} a "${PASSWORD_POR_DEFECTO}"?\n\n` +
      `Deberá crear una contraseña nueva la próxima vez que inicie sesión.`
    )) return

    setReseteandoId(est.id)
    const { ok, error } = await resetearPassword(est.user_id)
    setReseteandoId(null)
    if (ok) toast.success(`Contraseña restablecida a "${PASSWORD_POR_DEFECTO}"`)
    else toast.error(error || 'No se pudo restablecer la contraseña')
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este estudiante? Se borrarán sus evidencias, insignias, su cuenta de acceso y todos sus datos.')) return

    // Guardar el user_id antes de borrar la fila (se necesita para eliminar la cuenta de acceso)
    const { data: estudiante } = await supabase
      .from('estudiantes')
      .select('user_id')
      .eq('id', id)
      .single()

    // Obtener IDs de evidencias del estudiante para borrar archivos
    const { data: evidencias } = await supabase
      .from('evidencias')
      .select('id')
      .eq('estudiante_id', id)

    if (evidencias?.length) {
      const evidenciaIds = evidencias.map(e => e.id)
      await supabase.from('evidencias_archivos').delete().in('evidencia_id', evidenciaIds)
      await supabase.from('evidencias').delete().in('id', evidenciaIds)
    }

    await supabase.from('insignias_obtenidas').delete().eq('estudiante_id', id)

    const { error } = await supabase.from('estudiantes').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
      return
    }

    // Sin esto la cuenta quedaría en Auth y la persona no podría volver a registrarse
    const { ok, error: authError } = await eliminarCuentaAuth(estudiante?.user_id)
    if (ok) toast.success('Estudiante eliminado')
    else toast.error('Datos borrados, pero la cuenta de acceso quedó activa: ' + authError)

    cargarEstudiantes()
  }

  const termino = filtros.busqueda.trim().toLowerCase()
  const estudiantesFiltrados = termino
    ? estudiantes.filter(e =>
        [e.nombre_completo, e.numero_documento, e.email, e.telefono]
          .some(v => v?.toLowerCase().includes(termino))
      )
    : estudiantes

  const hayFiltros = filtros.municipio_id || filtros.institucion_id || filtros.grado || filtros.tipo_proyecto || filtros.busqueda

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4a3222] mb-6">Gestión de Estudiantes</h2>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-4 mb-6">
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a68a64] text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            placeholder="Buscar por nombre, documento, correo o teléfono..."
            className="w-full pl-9 pr-9 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
          />
          {filtros.busqueda && (
            <button
              onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a68a64] hover:text-[#4a3222] text-sm"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filtros.municipio_id}
            onChange={(e) => handleMunicipioChange(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">Todos los municipios</option>
            {municipios.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>

          <select
            value={filtros.institucion_id}
            onChange={(e) => setFiltros(prev => ({ ...prev, institucion_id: e.target.value }))}
            disabled={!filtros.municipio_id || loadingInstituciones}
            className={SELECT_CLS}
          >
            <option value="">
              {loadingInstituciones
                ? 'Cargando...'
                : !filtros.municipio_id
                  ? 'Selecciona un municipio'
                  : 'Todas las instituciones'}
            </option>
            {instituciones.map(i => (
              <option key={i.id} value={i.id}>{i.nombre}</option>
            ))}
          </select>

          <select
            value={filtros.grado}
            onChange={(e) => setFiltros(prev => ({ ...prev, grado: e.target.value }))}
            className={SELECT_CLS}
          >
            <option value="">Todos los grados</option>
            {[4,5,6,7,8,9,10,11].map(g => (
              <option key={g} value={g}>{g}°</option>
            ))}
          </select>

          <select
            value={filtros.tipo_proyecto}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo_proyecto: e.target.value }))}
            className={SELECT_CLS}
          >
            <option value="">Todos los proyectos</option>
            <option value="cafe">☕ Escuela y Café</option>
            <option value="alimentacion">🌽 Seguridad Alimentaria</option>
          </select>
        </div>

        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            🧹 Limpiar filtros
          </button>
        )}
      </div>

      {!loading && (
        <p className="text-sm text-[#a68a64] mb-3">
          {estudiantesFiltrados.length} {estudiantesFiltrados.length === 1 ? 'estudiante' : 'estudiantes'}
          {hayFiltros ? ' con los filtros aplicados' : ' en total'}
        </p>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#a68a64]">Cargando estudiantes...</div>
      ) : estudiantesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-8 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-[#a68a64]">
            {hayFiltros ? 'Ningún estudiante coincide con la búsqueda' : 'No hay estudiantes registrados'}
          </p>
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
              {estudiantesFiltrados.map((est) => (
                <tr key={est.id} className="border-t border-[#e8dcca] hover:bg-[#f5efe6] transition">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setInfoModal({ open: true, estudiante: est })}
                      className="font-medium text-[#4a3222] hover:text-[#6b4c3a] hover:underline text-left"
                      title="Ver información completa"
                    >
                      {est.nombre_completo}
                    </button>
                  </td>
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
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => setInfoModal({ open: true, estudiante: est })}
                      className="text-[#6b4c3a] hover:text-[#4a3222] mr-3 text-sm font-medium inline-flex items-center gap-1"
                      title="Ver información"
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => handleResetPassword(est)}
                      disabled={reseteandoId === est.id}
                      className="text-[#6b4c3a] hover:text-[#4a3222] mr-3 text-sm font-medium inline-flex items-center gap-1 disabled:opacity-50"
                      title="Restablecer contraseña a la de por defecto"
                    >
                      {reseteandoId === est.id ? '⏳' : '🔑'} Restablecer
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

      {infoModal.open && (
        <EstudianteInfoModal
          estudiante={infoModal.estudiante}
          onClose={() => setInfoModal({ open: false, estudiante: null })}
        />
      )}
    </div>
  )
}
