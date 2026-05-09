import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { SidebarPadrino } from './SidebarPadrino'
import { ImageViewer } from '../comunes/ImageViewer'
import { EstadisticasPadrino } from './EstadisticasPadrino'
import { EstudiantesPadrino } from './EstudiantesPadrino'
import { PerfilPadrino } from './PerfilPadrino'
import { AyudaPadrino } from './AyudaPadrino'

// ============================================
// COMPONENTE PRINCIPAL DE EVIDENCIAS (Dashboard)
// ============================================
function DashboardEvidencias({ onRefresh }) {
  const [evidencias, setEvidencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    estado: 'pendiente',
    grado: '',
    tipo_proyecto: '',
    municipio: ''
  })
  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0 })
  const [municipios, setMunicipios] = useState([])

  useEffect(() => {
    cargarMunicipios()
  }, [])

  useEffect(() => {
    cargarEvidencias()
  }, [filtros])

  async function cargarMunicipios() {
    const { data } = await supabase.from('municipios').select('id, nombre').order('nombre')
    if (data) setMunicipios(data)
  }

  async function cargarEvidencias() {
    setLoading(true)
    
    try {
      // 1. Obtener evidencias con filtro básico
      let query = supabase
        .from('evidencias')
        .select('*')
        .order('fecha_envio', { ascending: false })

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado)
      }

      const { data: evidenciasData, error: evidenciasError } = await query

      if (evidenciasError) {
        console.error('Error cargando evidencias:', evidenciasError)
        toast.error('Error al cargar las evidencias')
        setLoading(false)
        return
      }

      if (!evidenciasData || evidenciasData.length === 0) {
        setEvidencias([])
        setStats({ pendientes: 0, aprobadas: 0, rechazadas: 0 })
        setLoading(false)
        return
      }

      // 2. Obtener IDs de estudiantes y retos únicos
      const estudianteIds = [...new Set(evidenciasData.map(e => e.estudiante_id))]
      const retoIds = [...new Set(evidenciasData.map(e => e.reto_id))]
      const evidenciaIds = evidenciasData.map(e => e.id)

      // 3+4+6. Cargar en paralelo: estudiantes, retos y archivos
      const [
        { data: estudiantesData },
        { data: retosData },
        { data: archivosData }
      ] = await Promise.all([
        supabase
          .from('estudiantes')
          .select('id, nombre_completo, municipio_id, institucion_id, grado, tipo_proyecto, avatar_id, instituciones (nombre), municipios (nombre)')
          .in('id', estudianteIds),
        supabase
          .from('retos')
          .select('id, texto, tipo_evidencia, instruccion_evidencia, nivel_id')
          .in('id', retoIds),
        supabase
          .from('evidencias_archivos')
          .select('*')
          .in('evidencia_id', evidenciaIds)
      ])

      // 5. Cargar niveles (depende de retosData)
      const nivelIds = [...new Set(retosData?.map(r => r.nivel_id) || [])]
      const { data: nivelesData } = await supabase
        .from('niveles')
        .select('id, nombre, numero_nivel')
        .in('id', nivelIds)

      // Crear mapas para acceso rápido
      const estudiantesMap = Object.fromEntries(estudiantesData?.map(e => [e.id, e]) || [])
      const retosMap = Object.fromEntries(retosData?.map(r => [r.id, r]) || [])
      const nivelesMap = Object.fromEntries(nivelesData?.map(n => [n.id, n]) || [])
      const archivosMap = {}
      archivosData?.forEach(a => {
        if (!archivosMap[a.evidencia_id]) archivosMap[a.evidencia_id] = []
        archivosMap[a.evidencia_id].push(a)
      })

      // Combinar datos
      const evidenciasCompletas = evidenciasData.map(ev => ({
        ...ev,
        estudiante: estudiantesMap[ev.estudiante_id],
        reto: retosMap[ev.reto_id] ? {
          ...retosMap[ev.reto_id],
          nivel: nivelesMap[retosMap[ev.reto_id].nivel_id]
        } : null,
        evidencias_archivos: archivosMap[ev.id] || []
      }))

      // Aplicar filtros adicionales
      let filtradas = evidenciasCompletas
      
      if (filtros.grado) {
        filtradas = filtradas.filter(e => e.estudiante?.grado === filtros.grado)
      }
      if (filtros.tipo_proyecto) {
        filtradas = filtradas.filter(e => e.estudiante?.tipo_proyecto === filtros.tipo_proyecto)
      }
      if (filtros.municipio) {
        filtradas = filtradas.filter(e => e.estudiante?.municipio_id === parseInt(filtros.municipio))
      }
      
      setEvidencias(filtradas)
      
      // Calcular estadísticas
      setStats({
        pendientes: evidenciasData.filter(e => e.estado === 'pendiente').length,
        aprobadas: evidenciasData.filter(e => e.estado === 'aprobado').length,
        rechazadas: evidenciasData.filter(e => e.estado === 'rechazado').length
      })
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar las evidencias')
    }
    
    setLoading(false)
  }

  const handleRefresh = () => {
    cargarEvidencias()
    if (onRefresh) onRefresh()
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#4a3222] flex items-center gap-2">
          📋 Panel de Padrino
        </h1>
        <p className="text-sm text-[#a68a64] mt-0.5">Revisa y califica las evidencias de los estudiantes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-amber-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg mb-2">⏳</div>
          <p className="text-2xl font-bold text-[#4a3222]">{stats.pendientes}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-0.5">Pendientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg mb-2">✅</div>
          <p className="text-2xl font-bold text-[#4a3222]">{stats.aprobadas}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-0.5">Aprobadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-lg mb-2">❌</div>
          <p className="text-2xl font-bold text-[#4a3222]">{stats.rechazadas}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-0.5">Rechazadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#e8dcca] p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Estado', key: 'estado', opts: [
              { v: 'pendiente', l: '⏳ Pendientes' },
              { v: 'aprobado',  l: '✅ Aprobadas'  },
              { v: 'rechazado', l: '❌ Rechazadas' },
              { v: '',          l: '📋 Todas'       },
            ]},
            { label: 'Grado', key: 'grado', opts: [
              { v: '', l: 'Todos los grados' },
              ...[4,5,6,7,8,9,10,11].map(g => ({ v: String(g), l: `${g}°` }))
            ]},
            { label: 'Proyecto', key: 'tipo_proyecto', opts: [
              { v: '',             l: 'Todos'                 },
              { v: 'cafe',         l: '☕ Escuela y Café'     },
              { v: 'alimentacion', l: '🌽 Seg. Alimentaria'   },
            ]},
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">{label}</label>
              <select
                value={filtros[key]}
                onChange={(e) => setFiltros(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition"
              >
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Municipio</label>
            <select
              value={filtros.municipio}
              onChange={(e) => setFiltros(prev => ({ ...prev, municipio: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition"
            >
              <option value="">Todos</option>
              {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f5efe6]">
          <button
            onClick={() => setFiltros({ estado: 'pendiente', grado: '', tipo_proyecto: '', municipio: '' })}
            className="text-xs text-[#6b4c3a] hover:text-[#4a3222] transition font-medium"
          >
            Limpiar filtros
          </button>
          <button
            onClick={handleRefresh}
            className="text-xs text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center gap-1 font-medium"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Lista de evidencias */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#e8dcca] p-5 animate-pulse">
              <div className="h-4 bg-[#e8dcca] rounded-full w-1/2 mb-3" />
              <div className="h-3 bg-[#f5efe6] rounded-full w-3/4 mb-2" />
              <div className="h-3 bg-[#f5efe6] rounded-full w-2/3" />
            </div>
          ))}
        </div>
      ) : evidencias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8dcca] p-12 text-center">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-sm font-semibold text-[#4a3222]">No hay evidencias con esos filtros</p>
          <p className="text-xs text-[#a68a64] mt-1">Prueba cambiando los criterios de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evidencias.map((evidencia) => (
            <TarjetaEvidencia
              key={evidencia.id}
              evidencia={evidencia}
              onActualizar={cargarEvidencias}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// COMPONENTE TARJETA EVIDENCIA
// ==========================================
function TarjetaEvidencia({ evidencia, onActualizar }) {
  const [puntuacion, setPuntuacion] = useState(evidencia.puntuacion || '')
  const [comentario, setComentario] = useState(evidencia.comentario_padrino || '')
  const [loading, setLoading] = useState(false)
  const [comentarioError, setComentarioError] = useState(false)

  const estudiante = evidencia.estudiante
  const reto = evidencia.reto

  const getEstadoColor = () => {
    switch (evidencia.estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'aprobado': return 'bg-green-100 text-green-800 border-green-200'
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getEstadoTexto = () => {
    switch (evidencia.estado) {
      case 'pendiente': return '⏳ Pendiente'
      case 'aprobado': return '✅ Aprobado'
      case 'rechazado': return '❌ Rechazado'
      default: return evidencia.estado
    }
  }

  async function handleAprobar() {
    if (!puntuacion) {
      toast.error('Debes asignar una puntuación (0-100)')
      return
    }
    const puntuacionNum = parseInt(puntuacion)
    if (isNaN(puntuacionNum) || puntuacionNum < 0 || puntuacionNum > 100) {
      toast.error('La puntuación debe estar entre 0 y 100')
      return
    }

    setLoading(true)
    setComentarioError(false)
    
    const { data: userData } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('evidencias')
      .update({
        estado: 'aprobado',
        puntuacion: puntuacionNum,
        comentario_padrino: comentario || null,
        fecha_revision: new Date().toISOString(),
        padrino_id: userData.user?.id
      })
      .eq('id', evidencia.id)

    if (error) {
      toast.error('Error al aprobar la evidencia')
      console.error(error)
    } else {
      toast.success('✅ Evidencia aprobada exitosamente')
      onActualizar()
    }
    
    setLoading(false)
  }

  async function handleRechazar() {
    if (!comentario.trim()) {
      setComentarioError(true)
      toast.error('Debes escribir un comentario explicando el motivo del rechazo')
      return
    }
    setComentarioError(false)

    setLoading(true)
    
    const { data: userData } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('evidencias')
      .update({
        estado: 'rechazado',
        comentario_padrino: comentario,
        fecha_revision: new Date().toISOString(),
        padrino_id: userData.user?.id
      })
      .eq('id', evidencia.id)

    if (error) {
      toast.error('Error al rechazar la evidencia')
      console.error(error)
    } else {
      toast.success('❌ Evidencia rechazada')
      onActualizar()
    }
    
    setLoading(false)
  }

  const imagenesEvidencia = evidencia.evidencias_archivos?.filter(a => a.tipo_archivo === 'imagen').map(a => a.url) || []
  const videosEvidencia = evidencia.evidencias_archivos?.filter(a => a.tipo_archivo === 'video') || []

  const estadoStyle = {
    pendiente: { pill: 'bg-amber-50 text-amber-700 border border-amber-200',  bar: 'bg-amber-400' },
    aprobado:  { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bar: 'bg-emerald-500' },
    rechazado: { pill: 'bg-red-50 text-red-600 border border-red-200',         bar: 'bg-red-500' },
  }[evidencia.estado] || { pill: 'bg-[#f5efe6] text-[#6b4c3a] border border-[#e8dcca]', bar: 'bg-[#d4c4a8]' }

  return (
    <div className="bg-white rounded-2xl border border-[#e8dcca] overflow-hidden hover:shadow-md transition-shadow">
      {/* Franja de color por estado */}
      <div className={`h-1 ${estadoStyle.bar}`} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#f5efe6] bg-gradient-to-r from-[#faf7f3] to-white">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[#4a3222] text-sm">{estudiante?.nombre_completo}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${estadoStyle.pill}`}>
                {getEstadoTexto()}
              </span>
            </div>
            <p className="text-xs text-[#a68a64] flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span>📍 {estudiante?.municipios?.nombre || 'N/A'}</span>
              <span>🏫 {estudiante?.instituciones?.nombre || 'N/A'}</span>
              <span>📚 {estudiante?.grado}°</span>
              <span>{estudiante?.tipo_proyecto === 'cafe' ? '☕ Café' : '🌽 Alimentaria'}</span>
            </p>
          </div>
          <p className="text-xs text-[#a68a64] flex-shrink-0">
            {new Date(evidencia.fecha_envio).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-4">
        {/* Info del reto */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">
            Nivel {reto?.nivel?.numero_nivel} — {reto?.nivel?.nombre}
          </p>
          <p className="text-sm text-[#4a3222] font-medium leading-snug">{reto?.texto}</p>
          {reto?.instruccion_evidencia && (
            <p className="text-xs text-[#6b4c3a] mt-1 italic leading-relaxed">
              💡 "{reto.instruccion_evidencia}"
            </p>
          )}
        </div>

        {/* Respuesta */}
        <div className="bg-[#faf7f3] rounded-xl p-4 border border-[#f0e8dc]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-2">Respuesta del estudiante</p>
          {evidencia.texto_respuesta && (
            <p className="text-xs text-[#6b4c3a] whitespace-pre-wrap leading-relaxed mb-3">{evidencia.texto_respuesta}</p>
          )}
          {imagenesEvidencia.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-[#a68a64] mb-2">🖼️ Imágenes</p>
              <ImageViewer images={imagenesEvidencia} />
            </div>
          )}
          {videosEvidencia.length > 0 && (
            <div>
              <p className="text-xs text-[#a68a64] mb-2">🎥 Videos</p>
              {videosEvidencia.map((video, idx) => (
                <video key={idx} src={video.url} controls className="rounded-xl max-h-48 w-full mb-2" />
              ))}
            </div>
          )}
          {!evidencia.texto_respuesta && imagenesEvidencia.length === 0 && videosEvidencia.length === 0 && (
            <p className="text-xs text-[#a68a64] italic">No se ha subido contenido</p>
          )}
        </div>

        {/* Formulario de calificación */}
        {evidencia.estado === 'pendiente' && (
          <div className="space-y-3 pt-2 border-t border-[#f5efe6]">
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">
                  Puntuación (0–100)
                </label>
                <input
                  type="number"
                  value={puntuacion}
                  onChange={(e) => setPuntuacion(e.target.value)}
                  min="0"
                  max="100"
                  className="w-28 px-3 py-2 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition"
                  placeholder="0-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">
                Comentario{' '}
                {!comentario && <span className="text-red-400 normal-case font-normal">(obligatorio si rechazas)</span>}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => { setComentario(e.target.value); setComentarioError(false) }}
                className={`w-full px-3 py-2 text-xs border rounded-xl bg-[#faf7f3] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] resize-none transition ${
                  comentarioError ? 'border-red-400 ring-red-200' : 'border-[#e8dcca]'
                }`}
                rows="3"
                placeholder="Retroalimentación para el estudiante..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAprobar}
                disabled={loading}
                className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✅'} Aprobar
              </button>
              <button
                onClick={handleRechazar}
                disabled={loading}
                className="flex-1 sm:flex-none bg-red-500 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 disabled:opacity-50 transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '❌'} Rechazar
              </button>
            </div>
          </div>
        )}

        {/* Resultado de revisión */}
        {evidencia.estado !== 'pendiente' && evidencia.comentario_padrino && (
          <div className={`p-4 rounded-xl border ${
            evidencia.estado === 'aprobado'
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
          }`}>
            <p className="text-xs font-bold text-[#4a3222] mb-1">
              {evidencia.estado === 'aprobado' ? '✅ Comentario del padrino' : '❌ Motivo de rechazo'}
            </p>
            <p className="text-xs text-[#6b4c3a] leading-relaxed">{evidencia.comentario_padrino}</p>
            {evidencia.puntuacion != null && (
              <p className="text-xs font-semibold text-emerald-700 mt-2">⭐ Puntuación: {evidencia.puntuacion}/100</p>
            )}
            {evidencia.fecha_revision && (
              <p className="text-[10px] text-[#a68a64] mt-1">
                Revisado el {new Date(evidencia.fecha_revision).toLocaleDateString('es-CO')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL DEL DASHBOARD PADRINO
// ==========================================
export default function DashboardPadrino() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }, [logout, navigate])

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <SidebarPadrino
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        user={user}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} pb-16 md:pb-0`}>
        <Routes>
          <Route path="/" element={<DashboardEvidencias />} />
          <Route path="/estadisticas" element={<EstadisticasPadrino />} />
          <Route path="/estudiantes" element={<EstudiantesPadrino />} />
          <Route path="/perfil" element={<PerfilPadrino />} />
          <Route path="/ayuda" element={<AyudaPadrino />} />
          <Route path="*" element={<Navigate to="/padrino" replace />} />
        </Routes>
      </div>
    </div>
  )
}