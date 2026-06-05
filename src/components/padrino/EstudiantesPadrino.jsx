import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'
import { EstudianteDetalleModal } from './EstudianteDetalleModal'

export function EstudiantesPadrino() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState([])
  const [instituciones, setInstituciones] = useState([])
  const [vista, setVista] = useState('tarjetas') // 'tarjetas' | 'lista'
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [filtros, setFiltros] = useState({
    grado: '',
    tipo_proyecto: '',
    municipio_id: '',
    institucion_id: ''
  })

  useEffect(() => {
    cargarMunicipios()
  }, [])

  useEffect(() => {
    if (filtros.municipio_id) {
      cargarInstitucionesPorMunicipio(filtros.municipio_id)
    } else {
      setInstituciones([])
      setFiltros(prev => ({ ...prev, institucion_id: '' }))
    }
  }, [filtros.municipio_id])

  useEffect(() => {
    cargarEstudiantes()
  }, [filtros])

  async function cargarMunicipios() {
    const { data } = await supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
    if (data) setMunicipios(data)
  }

  async function cargarInstitucionesPorMunicipio(municipioId) {
    const { data } = await supabase
      .from('instituciones')
      .select('id, nombre')
      .eq('municipio_id', municipioId)
      .order('nombre')
    if (data) {
      setInstituciones(data)
    } else {
      setInstituciones([])
    }
  }

  async function cargarEstudiantes() {
    setLoading(true)

    let query = supabase
      .from('estudiantes')
      .select(`
        *,
        instituciones (nombre),
        municipios (nombre),
        sedes (nombre)
      `)
      .order('created_at', { ascending: false })

    if (filtros.grado) query = query.eq('grado', filtros.grado)
    if (filtros.tipo_proyecto) query = query.eq('tipo_proyecto', filtros.tipo_proyecto)
    if (filtros.municipio_id) query = query.eq('municipio_id', parseInt(filtros.municipio_id))
    if (filtros.institucion_id) query = query.eq('institucion_id', parseInt(filtros.institucion_id))

    const { data, error } = await query

    if (error) {
      console.error('Error cargando estudiantes:', error)
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setEstudiantes([])
      setLoading(false)
      return
    }

    // Calcular puntuacion_total desde evidencias aprobadas
    const ids = data.map(e => e.id)
    const { data: evidencias } = await supabase
      .from('evidencias')
      .select('estudiante_id, puntuacion')
      .eq('estado', 'aprobado')
      .in('estudiante_id', ids)

    const totales = {}
    ;(evidencias || []).forEach(ev => {
      totales[ev.estudiante_id] = (totales[ev.estudiante_id] || 0) + (ev.puntuacion || 0)
    })

    setEstudiantes(data.map(e => ({ ...e, puntuacion_total: totales[e.id] || 0 })))
    setLoading(false)
  }

  const limpiarFiltros = () => {
    setFiltros({ grado: '', tipo_proyecto: '', municipio_id: '', institucion_id: '' })
    setBusqueda('')
  }

  const estudiantesFiltrados = busqueda.trim()
    ? estudiantes.filter(e =>
        e.nombre_completo?.toLowerCase().includes(busqueda.trim().toLowerCase()))
    : estudiantes

  return (
    <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
            👨‍🎓 Estudiantes
          </h1>
          <p className="text-[#a68a64] mt-1">Listado de todos los estudiantes registrados</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-[#e8dcca]">
          {/* Buscador + cambio de vista */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a68a64] text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-8 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a68a64] hover:text-[#4a3222] text-sm"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex bg-[#f5efe6] rounded-lg p-1 border border-[#e8dcca] self-start">
              <button
                onClick={() => setVista('tarjetas')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  vista === 'tarjetas' ? 'bg-white text-[#4a3222] shadow-sm' : 'text-[#a68a64] hover:text-[#6b4c3a]'
                }`}
              >
                ▦ Tarjetas
              </button>
              <button
                onClick={() => setVista('lista')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  vista === 'lista' ? 'bg-white text-[#4a3222] shadow-sm' : 'text-[#a68a64] hover:text-[#6b4c3a]'
                }`}
              >
                ☰ Lista
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Grado</label>
              <select
                value={filtros.grado}
                onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
              >
                <option value="">Todos</option>
                {[4,5,6,7,8,9,10,11].map(g => (
                  <option key={g} value={g}>{g}°</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Proyecto</label>
              <select
                value={filtros.tipo_proyecto}
                onChange={(e) => setFiltros({ ...filtros, tipo_proyecto: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
              >
                <option value="">Todos</option>
                <option value="cafe">☕ Escuela y Café</option>
                <option value="alimentacion">🌽 Seguridad Alimentaria</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Municipio</label>
              <select
                value={filtros.municipio_id}
                onChange={(e) => setFiltros({ ...filtros, municipio_id: e.target.value, institucion_id: '' })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
              >
                <option value="">Todos</option>
                {municipios.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Institución</label>
              <select
                value={filtros.institucion_id}
                onChange={(e) => setFiltros({ ...filtros, institucion_id: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
                disabled={!filtros.municipio_id}
              >
                <option value="">Todas</option>
                {instituciones.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </select>
              {!filtros.municipio_id && (
                <p className="text-xs text-[#a68a64] mt-1">Selecciona un municipio primero</p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={limpiarFiltros}
              className="text-sm text-[#6b4c3a] hover:text-[#4a3222] transition"
            >
              🧹 Limpiar filtros
            </button>
            <span className="text-xs text-[#a68a64]">
              {estudiantesFiltrados.length} estudiantes encontrados
            </span>
          </div>
        </div>

        {/* Lista de estudiantes */}
        {loading ? (
          <div className="text-center py-12 text-[#a68a64]">
            <div className="text-4xl animate-pulse mb-2">👨‍🎓</div>
            <p>Cargando estudiantes...</p>
          </div>
        ) : estudiantesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#e8dcca]">
            <span className="text-6xl mb-4 block">📭</span>
            <p className="text-[#a68a64] text-lg">
              {busqueda ? 'Ningún estudiante coincide con la búsqueda' : 'No hay estudiantes que coincidan con los filtros'}
            </p>
            <p className="text-sm text-[#a68a64] mt-2">Prueba cambiando los criterios de búsqueda</p>
          </div>
        ) : vista === 'tarjetas' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estudiantesFiltrados.map((est) => {
              const avatar = getAvatarById(est.avatar_id || 1)
              return (
                <button
                  key={est.id}
                  onClick={() => setSeleccionado(est)}
                  className="text-left bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca] hover:shadow-lg hover:border-[#d4c4a8] transition group"
                >
                  <div className="p-4 border-b bg-gradient-to-r from-[#f5efe6] to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden">
                        <Avatar avatar={avatar} size="lg" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#4a3222] truncate">{est.nombre_completo}</h3>
                        <p className="text-xs text-[#a68a64] truncate">{est.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">📚 Grado:</span>
                      <span className="text-[#4a3222] font-medium">{est.grado}°</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">🌾 Proyecto:</span>
                      <span className="text-[#4a3222]">{est.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">📍 Municipio:</span>
                      <span className="text-[#4a3222]">{est.municipios?.nombre || 'N/A'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">🏫 Institución:</span>
                      <span className="text-[#4a3222] truncate">{est.instituciones?.nombre || 'N/A'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">⭐ Puntos:</span>
                      <span className="text-[#6b4c3a] font-bold">{est.puntuacion_total || 0}</span>
                    </p>
                    <p className="text-[11px] text-[#8b6b54] mt-2 font-medium group-hover:text-[#6b4c3a] flex items-center gap-1">
                      Ver detalle →
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-hidden divide-y divide-[#f0e8dc]">
            {estudiantesFiltrados.map((est) => {
              const avatar = getAvatarById(est.avatar_id || 1)
              return (
                <button
                  key={est.id}
                  onClick={() => setSeleccionado(est)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#faf7f3] transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Avatar avatar={avatar} size="md" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#4a3222] truncate text-sm">{est.nombre_completo}</h3>
                    <p className="text-xs text-[#a68a64] truncate">
                      {est.grado}° · {est.tipo_proyecto === 'cafe' ? '☕ Café' : '🌽 Alimentaria'} · {est.instituciones?.nombre || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#6b4c3a] font-bold text-sm">⭐ {est.puntuacion_total || 0}</p>
                    <p className="text-[10px] text-[#a68a64]">{est.municipios?.nombre || 'N/A'}</p>
                  </div>
                  <span className="text-[#a68a64] group-hover:text-[#6b4c3a] flex-shrink-0">›</span>
                </button>
              )
            })}
          </div>
        )}

        {seleccionado && (
          <EstudianteDetalleModal
            estudiante={seleccionado}
            onClose={() => setSeleccionado(null)}
          />
        )}
    </div>
  )
}