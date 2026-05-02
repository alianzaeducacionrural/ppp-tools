import { useEffect, useState } from 'react'
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

      // 3. Cargar estudiantes
      const { data: estudiantesData } = await supabase
        .from('estudiantes')
        .select(`
          id,
          nombre_completo,
          municipio_id,
          institucion_id,
          grado,
          tipo_proyecto,
          avatar_id,
          instituciones (nombre),
          municipios (nombre)
        `)
        .in('id', estudianteIds)

      // 4. Cargar retos con sus niveles
      const { data: retosData } = await supabase
        .from('retos')
        .select(`
          id,
          texto,
          tipo_evidencia,
          instruccion_evidencia,
          nivel_id
        `)
        .in('id', retoIds)

      // 5. Cargar niveles de los retos
      const nivelIds = [...new Set(retosData?.map(r => r.nivel_id) || [])]
      const { data: nivelesData } = await supabase
        .from('niveles')
        .select('id, nombre, numero_nivel')
        .in('id', nivelIds)

      // 6. Cargar archivos de evidencias
      const { data: archivosData } = await supabase
        .from('evidencias_archivos')
        .select('*')
        .in('evidencia_id', evidenciasData.map(e => e.id))

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
          📋 Panel de Padrino
        </h1>
        <p className="text-[#a68a64] mt-1">Revisa y califica las evidencias de los estudiantes</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Pendientes</p>
              <p className="text-3xl font-bold">{stats.pendientes}</p>
            </div>
            <span className="text-4xl">⏳</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Aprobadas</p>
              <p className="text-3xl font-bold">{stats.aprobadas}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Rechazadas</p>
              <p className="text-3xl font-bold">{stats.rechazadas}</p>
            </div>
            <span className="text-4xl">❌</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-[#e8dcca]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-[#6b4c3a] mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
            >
              <option value="pendiente">⏳ Pendientes</option>
              <option value="aprobado">✅ Aprobadas</option>
              <option value="rechazado">❌ Rechazadas</option>
              <option value="">📋 Todas</option>
            </select>
          </div>
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
              value={filtros.municipio}
              onChange={(e) => setFiltros({ ...filtros, municipio: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
            >
              <option value="">Todos</option>
              {municipios.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <button
            onClick={() => setFiltros({ estado: 'pendiente', grado: '', tipo_proyecto: '', municipio: '' })}
            className="text-sm text-[#6b4c3a] hover:text-[#4a3222] transition"
          >
            🧹 Limpiar filtros
          </button>
          <button
            onClick={handleRefresh}
            className="text-sm text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center gap-1"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Lista de evidencias */}
      {loading ? (
        <div className="text-center py-12 text-[#a68a64]">
          <div className="text-4xl animate-pulse mb-2">⏳</div>
          <p>Cargando evidencias...</p>
        </div>
      ) : evidencias.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#e8dcca]">
          <span className="text-6xl mb-4 block">📭</span>
          <p className="text-[#a68a64] text-lg">No hay evidencias que coincidan con los filtros</p>
          <p className="text-sm text-[#a68a64] mt-2">Prueba cambiando los criterios de búsqueda</p>
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

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca] transition-all hover:shadow-lg">
      {/* Header */}
      <div className="p-5 border-b bg-gradient-to-r from-[#f5efe6] to-white">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[#4a3222] text-lg">{estudiante?.nombre_completo}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor()}`}>
                {getEstadoTexto()}
              </span>
            </div>
            <p className="text-sm text-[#a68a64] flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span>📍 {estudiante?.municipios?.nombre || 'N/A'}</span>
              <span>🏫 {estudiante?.instituciones?.nombre || 'N/A'}</span>
              <span>📚 {estudiante?.grado}°</span>
              <span>{estudiante?.tipo_projektor === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}</span>
            </p>
          </div>
          <div className="text-right text-sm text-[#a68a64]">
            <p>📅 {new Date(evidencia.fecha_envio).toLocaleDateString('es-CO')}</p>
            <p>🕐 {new Date(evidencia.fecha_envio).toLocaleTimeString('es-CO')}</p>
          </div>
        </div>
      </div>

      {/* Contenido del reto */}
      <div className="p-5">
        <div className="mb-4">
          <p className="text-sm text-[#a68a64] mb-1">
            Nivel {reto?.nivel?.numero_nivel}: <span className="font-medium text-[#4a3222]">{reto?.nivel?.nombre}</span>
          </p>
          <p className="text-[#4a3222]">
            <span className="font-medium">📌 Reto:</span> {reto?.texto}
          </p>
          {reto?.instruccion_evidencia && (
            <p className="text-sm text-[#6b4c3a] mt-1 flex items-start gap-1">
              <span>💡</span>
              <span className="italic">"{reto.instruccion_evidencia}"</span>
            </p>
          )}
        </div>
        
        {/* Respuesta del estudiante */}
        <div className="bg-[#f5efe6] rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-[#4a3222] mb-2 flex items-center gap-1">
            📝 Respuesta del estudiante:
          </p>
          {evidencia.texto_respuesta && (
            <p className="text-[#6b4c3a] whitespace-pre-wrap mb-3">{evidencia.texto_respuesta}</p>
          )}
          {imagenesEvidencia.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-[#a68a64] mb-2">🖼️ Imágenes:</p>
              <ImageViewer images={imagenesEvidencia} />
            </div>
          )}
          {videosEvidencia.length > 0 && (
            <div>
              <p className="text-sm text-[#a68a64] mb-2">🎥 Videos:</p>
              {videosEvidencia.map((video, idx) => (
                <video key={idx} src={video.url} controls className="rounded-lg max-h-48 w-full mb-2" />
              ))}
            </div>
          )}
          {!evidencia.texto_respuesta && imagenesEvidencia.length === 0 && videosEvidencia.length === 0 && (
            <p className="text-[#a68a64] italic">No se ha subido contenido aún</p>
          )}
        </div>

        {/* Formulario de calificación */}
        {evidencia.estado === 'pendiente' && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-[#4a3222] mb-2">
                ⭐ Puntuación (0 - 100)
              </label>
              <input
                type="number"
                value={puntuacion}
                onChange={(e) => setPuntuacion(e.target.value)}
                min="0"
                max="100"
                className="w-32 px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]"
                placeholder="0-100"
              />
              <p className="text-xs text-[#a68a64] mt-1">Calificación del 0 al 100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4a3222] mb-2">
                💬 Comentario {!comentario && <span className="text-red-500 text-xs">(obligatorio si se rechaza)</span>}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6b4c3a] resize-none ${
                  comentarioError ? 'border-red-500 ring-red-200' : 'border-[#e8dcca]'
                }`}
                rows="3"
                placeholder="Escribe aquí tu retroalimentación para el estudiante..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAprobar}
                disabled={loading}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : '✅'} Aprobar
              </button>
              <button
                onClick={handleRechazar}
                disabled={loading}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : '❌'} Rechazar
              </button>
            </div>
          </div>
        )}

        {/* Mostrar comentario si ya fue revisado */}
        {evidencia.estado !== 'pendiente' && evidencia.comentario_padrino && (
          <div className={`mt-4 p-4 rounded-xl ${evidencia.estado === 'aprobado' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-sm font-medium mb-1 flex items-center gap-1">
              {evidencia.estado === 'aprobado' ? '✅ Comentario del padrino:' : '❌ Comentario del padrino:'}
            </p>
            <p className="text-[#6b4c3a]">{evidencia.comentario_padrino}</p>
            {evidencia.puntuacion && (
              <p className="text-sm mt-2 text-green-700">⭐ Puntuación: {evidencia.puntuacion}/100</p>
            )}
            {evidencia.fecha_revision && (
              <p className="text-xs text-[#a68a64] mt-2">
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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <SidebarPadrino 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        onLogout={handleLogout}
        user={user}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
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