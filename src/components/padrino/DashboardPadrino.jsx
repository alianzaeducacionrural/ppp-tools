import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ImageViewer } from '../comunes/ImageViewer'
import { SkeletonTable } from '../comunes/Skeleton'

export function DashboardPadrino() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [evidencias, setEvidencias] = useState([])
  const [filtros, setFiltros] = useState({
    municipio: '',
    institucion: '',
    grado: '',
    tipo_proyecto: '',
    estado: 'pendiente'
  })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0 })

  useEffect(() => {
    cargarEvidencias()
  }, [filtros])

  async function cargarEvidencias() {
    setLoading(true)
    
    let query = supabase
      .from('evidencias')
      .select(`
        *,
        estudiante:estudiante_id (
          nombre_completo,
          municipio,
          institucion,
          sede,
          grado,
          tipo_proyecto,
          numero_documento
        ),
        reto:reto_id (
          texto,
          tipo_evidencia,
          nivel:nivel_id (
            nombre,
            numero_nivel
          )
        )
      `)
      .order('fecha_envio', { ascending: false })

    // Aplicar filtros
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error cargando evidencias:', error)
      toast.error('Error al cargar las evidencias')
    } else {
      const evidenciasData = data || []
      setEvidencias(evidenciasData)
      
      // Filtrar por municipio, institución, grado, proyecto (post-query por la relación)
      let filtradas = evidenciasData
      if (filtros.municipio) {
        filtradas = filtradas.filter(e => e.estudiante?.municipio?.toLowerCase().includes(filtros.municipio.toLowerCase()))
      }
      if (filtros.institucion) {
        filtradas = filtradas.filter(e => e.estudiante?.institucion?.toLowerCase().includes(filtros.institucion.toLowerCase()))
      }
      if (filtros.grado) {
        filtradas = filtradas.filter(e => e.estudiante?.grado === filtros.grado)
      }
      if (filtros.tipo_proyecto) {
        filtradas = filtradas.filter(e => e.estudiante?.tipo_proyecto === filtros.tipo_proyecto)
      }
      
      setEvidencias(filtradas)
      
      // Calcular estadísticas
      const pendientes = evidenciasData.filter(e => e.estado === 'pendiente').length
      const aprobadas = evidenciasData.filter(e => e.estado === 'aprobado').length
      const rechazadas = evidenciasData.filter(e => e.estado === 'rechazado').length
      setStats({ pendientes, aprobadas, rechazadas })
    }
    
    setLoading(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">👨‍🏫</span>
                Panel de Padrino
              </h1>
              <p className="text-green-100 mt-1">Revisión de evidencias de estudiantes</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <span>🚪</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-800">{stats.pendientes}</p>
              </div>
              <span className="text-4xl">⏳</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm font-medium">Aprobadas</p>
                <p className="text-3xl font-bold text-green-800">{stats.aprobadas}</p>
              </div>
              <span className="text-4xl">✅</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-5 border border-red-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 text-sm font-medium">Rechazadas</p>
                <p className="text-3xl font-bold text-red-800">{stats.rechazadas}</p>
              </div>
              <span className="text-4xl">❌</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-5 sticky top-4">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔍</span> Filtros
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="pendiente">⏳ Pendientes</option>
                    <option value="aprobado">✅ Aprobados</option>
                    <option value="rechazado">❌ Rechazados</option>
                    <option value="">📋 Todos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">Municipio</label>
                  <input
                    type="text"
                    value={filtros.municipio}
                    onChange={(e) => setFiltros({...filtros, municipio: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="Ej: Manizales"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">Institución</label>
                  <input
                    type="text"
                    value={filtros.institucion}
                    onChange={(e) => setFiltros({...filtros, institucion: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="Nombre de la institución"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">Grado</label>
                  <select
                    value={filtros.grado}
                    onChange={(e) => setFiltros({...filtros, grado: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    {[4,5,6,7,8,9,10,11].map(g => (
                      <option key={g} value={g}>{g}°</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">Proyecto</label>
                  <select
                    value={filtros.tipo_proyecto}
                    onChange={(e) => setFiltros({...filtros, tipo_proyecto: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="cafe">☕ Escuela y Café</option>
                    <option value="alimentacion">🌽 Seguridad Alimentaria</option>
                  </select>
                </div>

                <button
                  onClick={() => setFiltros({ municipio: '', institucion: '', grado: '', tipo_proyecto: '', estado: 'pendiente' })}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  🧹 Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Lista de evidencias */}
          <div className="lg:col-span-3">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : evidencias.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <span className="text-6xl mb-4 block">📭</span>
                <p className="text-gray-500 text-lg">No hay evidencias que coincidan con los filtros</p>
                <p className="text-gray-400 text-sm mt-2">Prueba cambiando los criterios de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">
                  Mostrando {evidencias.length} evidencia{evidencias.length !== 1 ? 's' : ''}
                </p>
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
        </div>
      </div>
    </div>
  )
}

// Componente para cada evidencia
function TarjetaEvidencia({ evidencia, onActualizar }) {
  const [puntuacion, setPuntuacion] = useState(evidencia.puntuacion || '')
  const [comentario, setComentario] = useState(evidencia.comentario_padrino || '')
  const [loading, setLoading] = useState(false)

  const estudiante = evidencia.estudiante
  const reto = evidencia.reto

  async function handleAprobar() {
    if (!puntuacion) {
      toast.error('Debes asignar una puntuación (1 a 5)')
      return
    }

    setLoading(true)
    
    const { error } = await supabase
      .from('evidencias')
      .update({
        estado: 'aprobado',
        puntuacion: parseInt(puntuacion),
        comentario_padrino: comentario || null,
        fecha_revision: new Date().toISOString()
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
    if (!comentario) {
      toast.error('Debes escribir un comentario explicando el motivo del rechazo')
      return
    }

    setLoading(true)
    
    const { error } = await supabase
      .from('evidencias')
      .update({
        estado: 'rechazado',
        comentario_padrino: comentario,
        fecha_revision: new Date().toISOString()
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

  const getEstadoColor = () => {
    switch (evidencia.estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'aprobado': return 'bg-green-100 text-green-800 border-green-200'
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100'
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

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${getEstadoColor().replace('bg-', 'border-')} animate-fade-in`}>
      {/* Header */}
      <div className="p-5 border-b bg-gray-50">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{estudiante?.nombre_completo}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
              <span>📍 {estudiante?.municipio}</span>
              <span>•</span>
              <span>🏫 {estudiante?.institucion}</span>
              <span>•</span>
              <span>📚 {estudiante?.grado}°</span>
            </p>
            <p className="text-sm text-gray-500">
              {estudiante?.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor()}`}>
              {getEstadoTexto()}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(evidencia.fecha_envio).toLocaleDateString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-1">
            <strong className="text-gray-700">Nivel {reto?.nivel?.numero_nivel}:</strong> {reto?.nivel?.nombre}
          </p>
          <p className="text-gray-700">
            <strong>📌 Reto:</strong> {reto?.texto}
          </p>
        </div>
        
        {/* Respuesta del estudiante */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
            <span>📝</span> Respuesta del estudiante:
          </p>
          {evidencia.texto_respuesta && (
            <p className="text-gray-700 whitespace-pre-wrap">{evidencia.texto_respuesta}</p>
          )}
          {evidencia.imagenes && evidencia.imagenes.length > 0 && (
            <ImageViewer images={evidencia.imagenes} />
          )}
          {!evidencia.texto_respuesta && (!evidencia.imagenes || evidencia.imagenes.length === 0) && (
            <p className="text-gray-400 italic">No se ha subido contenido aún</p>
          )}
        </div>

        {/* Formulario de revisión */}
        {evidencia.estado === 'pendiente' && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">⭐ Puntuación (1 a 5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPuntuacion(p)}
                      className={`w-10 h-10 rounded-lg font-bold transition ${
                        puntuacion == p 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">
                💬 Comentario {!comentario && <span className="text-red-500 text-xs">(obligatorio si se rechaza)</span>}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
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
                {loading ? '...' : '✅ Aprobar'}
              </button>
              <button
                onClick={handleRechazar}
                disabled={loading}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? '...' : '❌ Rechazar'}
              </button>
            </div>
          </div>
        )}

        {/* Mostrar comentario si ya fue revisado */}
        {evidencia.estado !== 'pendiente' && evidencia.comentario_padrino && (
          <div className={`mt-4 p-4 rounded-lg ${evidencia.estado === 'aprobado' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-sm font-medium mb-1 flex items-center gap-1">
              {evidencia.estado === 'aprobado' ? '✅ Comentario del padrino:' : '❌ Comentario del padrino:'}
            </p>
            <p className="text-gray-700">{evidencia.comentario_padrino}</p>
            {evidencia.puntuacion && (
              <p className="text-sm mt-2 text-gray-600">⭐ Puntuación: {evidencia.puntuacion}/5</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPadrino