import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ImageViewer } from '../comunes/ImageViewer'
import { Sidebar } from '../comunes/Sidebar'
import { PerfilEstudiante } from './PerfilEstudiante'
import { RankingEstudiante } from './RankingEstudiante'
import { InsigniasEstudiante } from './InsigniasEstudiante'

function DashboardEstudianteGamificado() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Estados principales
  const [estudiante, setEstudiante] = useState(null)
  const [niveles, setNiveles] = useState([])
  const [insignias, setInsignias] = useState([])
  const [loading, setLoading] = useState(true)
  const [puntuacionTotal, setPuntuacionTotal] = useState(0)
  
  // Estados de UI
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [nivelExpandido, setNivelExpandido] = useState(null)
  const [retosPorNivel, setRetosPorNivel] = useState({})
  const [cargandoRetos, setCargandoRetos] = useState({})
  const [imagenNivelAmpliada, setImagenNivelAmpliada] = useState(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  
  // Cache persistente
  const cacheRetos = useRef({})
  const cacheNiveles = useRef(null)
  const cacheEstudiante = useRef(null)
  const isReturningToTab = useRef(false)

  // Determinar qué pestaña está activa según la URL
  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/perfil') return 'perfil'
    if (path === '/ranking') return 'ranking'
    if (path === '/insignias') return 'insignias'
    if (path === '/ayuda') return 'ayuda'
    return 'inicio'
  }

  const activeTab = getActiveTab()

  // Manejar visibilidad de la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isReturningToTab.current = true
        setTimeout(() => {
          isReturningToTab.current = false
        }, 500)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Recuperar estado guardado
  useEffect(() => {
    const savedState = sessionStorage.getItem('dashboard-state')
    if (savedState) {
      try {
        const { nivelExpandido: savedNivel, sidebarOpen: savedSidebar } = JSON.parse(savedState)
        if (savedNivel) setNivelExpandido(savedNivel)
        if (savedSidebar !== undefined) setSidebarOpen(savedSidebar)
      } catch (e) {
        console.error('Error al recuperar estado:', e)
      }
    }
  }, [])

  // Guardar estado
  useEffect(() => {
    sessionStorage.setItem('dashboard-state', JSON.stringify({
      nivelExpandido,
      sidebarOpen
    }))
  }, [nivelExpandido, sidebarOpen])

  // Cargar datos principales
  const cargarDatos = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && initialLoadDone && cacheEstudiante.current && !isReturningToTab.current) {
      setEstudiante(cacheEstudiante.current)
      setNiveles(cacheNiveles.current || [])
      setPuntuacionTotal(cacheEstudiante.current?.puntuacion_total || 0)
      return
    }
    
    setLoading(true)
    
    try {
      const { data: estudianteData, error: estudianteError } = await supabase
        .from('estudiantes')
        .select('*, instituciones(nombre), municipios(nombre), sedes(nombre)')
        .eq('user_id', user.id)
        .single()

      if (estudianteError) throw estudianteError
      
      cacheEstudiante.current = estudianteData
      setEstudiante(estudianteData)
      setPuntuacionTotal(estudianteData.puntuacion_total || 0)

      if (!forceRefresh && cacheNiveles.current) {
        setNiveles(cacheNiveles.current)
      } else {
        const { data: nivelesData, error: nivelesError } = await supabase
          .from('niveles')
          .select('*')
          .eq('grado', estudianteData.grado)
          .eq('tipo_proyecto', estudianteData.tipo_proyecto)
          .order('numero_nivel', { ascending: true })

        if (nivelesError) throw nivelesError
        
        cacheNiveles.current = nivelesData
        setNiveles(nivelesData)
      }

      const { data: insigniasData } = await supabase
        .from('insignias_obtenidas')
        .select('nivel_id')
        .eq('estudiante_id', estudianteData.id)

      const nivelesCompletados = new Set(insigniasData?.map(i => i.nivel_id) || [])
      
      const nivelesConEstado = (cacheNiveles.current || []).map((nivel, idx) => ({
        ...nivel,
        completado: nivelesCompletados.has(nivel.id),
        bloqueado: idx > 0 && !nivelesCompletados.has((cacheNiveles.current || [])[idx - 1]?.id)
      }))
      
      setNiveles(nivelesConEstado)
      setInsignias(insigniasData || [])
      setInitialLoadDone(true)

    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar tus datos')
    }

    setLoading(false)
  }, [user, initialLoadDone])

  // ============================================
  // IMPORTANTE: CAMBIAR DEPENDENCIA DE user a user?.id
  // ============================================
  useEffect(() => {
    if (user?.id) {
      cargarDatos()
    }
  }, [user?.id, cargarDatos]) 

  // Cargar retos
  const cargarRetos = useCallback(async (nivelId) => {
    if (cacheRetos.current[nivelId]) {
      if (!retosPorNivel[nivelId]) {
        setRetosPorNivel(prev => ({ ...prev, [nivelId]: cacheRetos.current[nivelId] }))
      }
      return
    }
    
    setCargandoRetos(prev => ({ ...prev, [nivelId]: true }))
    
    const { data } = await supabase
      .from('retos')
      .select('*')
      .eq('nivel_id', nivelId)
      .order('orden')
    
    if (data) {
      cacheRetos.current[nivelId] = data
      setRetosPorNivel(prev => ({ ...prev, [nivelId]: data }))
    }
    
    setCargandoRetos(prev => ({ ...prev, [nivelId]: false }))
  }, [retosPorNivel])

  const toggleNivel = useCallback((nivelId) => {
    if (nivelExpandido === nivelId) {
      setNivelExpandido(null)
    } else {
      setNivelExpandido(nivelId)
      cargarRetos(nivelId)
    }
  }, [nivelExpandido, cargarRetos])

  const handleLogout = async () => {
    sessionStorage.removeItem('dashboard-state')
    cacheRetos.current = {}
    cacheNiveles.current = null
    cacheEstudiante.current = null
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const obtenerRango = (puntos) => {
    if (puntos < 200) return { nombre: 'Semilla', emoji: '🌱', color: 'bg-amber-100 text-amber-800', border: 'border-amber-200' }
    if (puntos < 500) return { nombre: 'Brotes', emoji: '🌿', color: 'bg-amber-200 text-amber-800', border: 'border-amber-300' }
    if (puntos < 1000) return { nombre: 'Cafetero Aprendiz', emoji: '☕', color: 'bg-amber-300 text-amber-900', border: 'border-amber-400' }
    if (puntos < 2000) return { nombre: 'Maestro Cafetero', emoji: '🏆', color: 'bg-yellow-200 text-yellow-800', border: 'border-yellow-300' }
    return { nombre: 'Leyenda del Café', emoji: '👑', color: 'bg-amber-400 text-amber-900', border: 'border-amber-500' }
  }

  const rango = obtenerRango(puntuacionTotal)
  const nivelesCompletados = niveles.filter(n => n.completado).length
  const porcentajeProgreso = niveles.length > 0 ? (nivelesCompletados / niveles.length) * 100 : 0

  // Componente de inicio
  const InicioContent = useCallback(() => (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#e8dcca]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#4a3222] flex items-center gap-2">
              🧙‍♂️ ¡Hola, {estudiante?.nombre_completo?.split(' ')[0]}!
            </h2>
            <p className="text-[#a68a64] mt-1 text-sm">
              {estudiante?.instituciones?.nombre} · {estudiante?.grado}° · 
              {estudiante?.tipo_proyecto === 'cafe' ? ' ☕ Escuela y Café' : ' 🌽 Seguridad Alimentaria'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full ${rango.color} ${rango.border} border flex items-center gap-2 shadow-sm`}>
            <span className="text-2xl">{rango.emoji}</span>
            <span className="font-semibold">{rango.nombre}</span>
            <span className="text-sm opacity-75">{puntuacionTotal} pts</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-[#6b4c3a] bg-[#f5efe6] rounded-lg p-3 border border-[#e8dcca]">
          <span className="text-xl">🔥</span>
          <span className="text-sm font-medium">Racha actual: 5 días consecutivos</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-[#e8dcca]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-[#4a3222] flex items-center gap-2">
            <span>📊</span> Tu progreso general
          </h3>
          <span className="text-lg font-bold text-[#6b4c3a]">{Math.round(porcentajeProgreso)}%</span>
        </div>
        <div className="w-full bg-[#e8dcca] rounded-full h-4">
          <div
            className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] h-4 rounded-full transition-all duration-500"
            style={{ width: `${porcentajeProgreso}%` }}
          ></div>
        </div>
        <p className="text-sm text-[#a68a64] mt-2">
          {nivelesCompletados} de {niveles.length} niveles completados
        </p>
      </div>

      <div className="space-y-4">
        {niveles.map((nivel, index) => (
          <div key={nivel.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca] transition-all">
            <button
              onClick={() => !nivel.bloqueado && toggleNivel(nivel.id)}
              disabled={nivel.bloqueado}
              className={`w-full p-5 flex items-center justify-between transition-all ${
                nivel.bloqueado ? 'opacity-50 cursor-not-allowed bg-[#f5efe6]' : 'hover:bg-[#f5efe6] cursor-pointer'
              } ${nivelExpandido === nivel.id ? 'border-b border-[#e8dcca]' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#f5efe6] to-[#e8dcca] flex items-center justify-center">
                    {nivel.imagen_nivel_url ? (
                      <img 
                        src={nivel.imagen_nivel_url} 
                        alt={nivel.nombre}
                        className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagenNivelAmpliada(nivel.imagen_nivel_url)
                        }}
                      />
                    ) : (
                      <span className="text-3xl">
                        {nivel.completado ? '✅' : nivel.bloqueado ? '🔒' : ['🌱', '🌿', '☕', '🏆'][index] || '🎯'}
                      </span>
                    )}
                  </div>
                  {nivel.imagen_nivel_url && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl transition-all flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                    </div>
                  )}
                </div>
                
                <div className="text-left">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-[#4a3222]">{nivel.nombre}</h3>
                    {nivel.completado && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">✅ Completado</span>
                    )}
                    {nivel.bloqueado && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">🔒 Bloqueado</span>
                    )}
                  </div>
                  <p className="text-sm text-[#a68a64] mt-1">
                    Nivel {nivel.numero_nivel} de 4
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {nivel.completado && nivel.insignia_url && (
                  <img 
                    src={nivel.insignia_url} 
                    alt="Insignia" 
                    className="w-8 h-8 object-contain cursor-pointer hover:scale-110 transition"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImagenNivelAmpliada(nivel.insignia_url)
                    }}
                  />
                )}
                <span className="text-2xl text-[#a68a64]">
                  {nivelExpandido === nivel.id ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {nivelExpandido === nivel.id && !nivel.bloqueado && (
              <div className="p-5 bg-[#f5efe6]">
                {cargandoRetos[nivel.id] ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-[#e8dcca] rounded-lg p-4 animate-pulse bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : retosPorNivel[nivel.id]?.length === 0 ? (
                  <div className="text-center py-8 text-[#a68a64]">No hay retos para este nivel aún.</div>
                ) : (
                  <div className="space-y-4">
                    {retosPorNivel[nivel.id]?.map((reto, idx) => (
                      <RetoCard 
                        key={reto.id} 
                        reto={reto} 
                        orden={idx + 1}
                        estudianteId={estudiante?.id}
                        onActualizar={() => cargarDatos(true)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  ), [estudiante, niveles, nivelExpandido, cargandoRetos, retosPorNivel, rango, puntuacionTotal, porcentajeProgreso, nivelesCompletados, toggleNivel, cargarDatos])

  // Contenido principal memorizado
  const mainContent = useMemo(() => (
    <div className="min-h-screen bg-[#f5efe6]">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        onLogout={handleLogout}
        user={user}
        estudiante={estudiante}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="min-h-screen overflow-y-auto">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222]">
                {activeTab === 'inicio' && '🗺️ Mapa de Misiones'}
                {activeTab === 'perfil' && '👤 Mi Perfil'}
                {activeTab === 'ranking' && '🏆 Ranking'}
                {activeTab === 'insignias' && '📦 Mis Insignias'}
                {activeTab === 'ayuda' && '❓ Centro de Ayuda'}
              </h1>
              <p className="text-[#a68a64] mt-1">
                {activeTab === 'inicio' && 'Completa las misiones para ganar insignias y subir de rango'}
                {activeTab === 'perfil' && 'Gestiona tu información personal y preferencias'}
                {activeTab === 'ranking' && 'Compara tu progreso con otros estudiantes'}
                {activeTab === 'insignias' && 'Todas las insignias que has obtenido'}
                {activeTab === 'ayuda' && 'Preguntas frecuentes y guías de uso'}
              </p>
            </div>

            {activeTab === 'inicio' && <InicioContent />}
            {activeTab === 'perfil' && (
              <PerfilEstudiante 
                estudiante={estudiante} 
                onActualizar={() => cargarDatos(true)}
                puntuacionTotal={puntuacionTotal}
                rango={rango}
                nivelesCompletados={niveles.filter(n => n.completado)}
              />
            )}
            {activeTab === 'ranking' && (
              <RankingEstudiante 
                estudiante={estudiante}
              />
            )}
            {activeTab === 'insignias' && (
              <InsigniasEstudiante 
                estudianteId={estudiante?.id}
                niveles={niveles}
              />
            )}
            {activeTab === 'ayuda' && <AyudaEstudiante />}
          </div>
        </div>
      </div>

      {imagenNivelAmpliada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setImagenNivelAmpliada(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition z-10"
            onClick={() => setImagenNivelAmpliada(null)}
          >
            ✕
          </button>
          <img
            src={imagenNivelAmpliada}
            alt="Ampliada"
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  ), [sidebarOpen, activeTab, estudiante, niveles, puntuacionTotal, rango, imagenNivelAmpliada, cargarDatos, user, handleLogout, InicioContent])

  if (loading && !estudiante) {
    return (
      <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">☕</div>
          <div className="text-xl text-[#6b4c3a]">Cargando tu aventura...</div>
        </div>
      </div>
    )
  }

  return mainContent
}

// ==========================================
// COMPONENTE RETOCARD
// ==========================================
function RetoCard({ reto, orden, estudianteId, onActualizar }) {
  const [evidencia, setEvidencia] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verificarEvidencia()
  }, [reto.id])

  async function verificarEvidencia() {
    const { data } = await supabase
      .from('evidencias')
      .select(`
        *,
        respuestas (*),
        evidencias_archivos (*)
      `)
      .eq('estudiante_id', estudianteId)
      .eq('reto_id', reto.id)
      .maybeSingle()

    if (data) setEvidencia(data)
    setLoading(false)
  }

  const getEstadoBadge = () => {
    if (!evidencia) return null
    switch (evidencia.estado) {
      case 'pendiente':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⏳ Pendiente</span>
      case 'aprobado':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✅ Aprobado</span>
      case 'rechazado':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">❌ Rechazado</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="border border-[#e8dcca] rounded-lg p-4 animate-pulse bg-white">
        <div className="h-4 bg-[#e8dcca] rounded w-1/4 mb-2"></div>
        <div className="h-16 bg-[#f5efe6] rounded"></div>
      </div>
    )
  }

  const imagenesEvidencia = evidencia?.evidencias_archivos?.filter(a => a.tipo_archivo === 'imagen').map(a => a.url) || []

  return (
    <div className={`border rounded-lg p-4 transition-all bg-white ${evidencia?.estado === 'aprobado' ? 'border-green-200 bg-green-50' : 'border-[#e8dcca]'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            evidencia?.estado === 'aprobado' ? 'bg-green-500 text-white' : 'bg-[#e8dcca] text-[#6b4c3a]'
          }`}>
            {evidencia?.estado === 'aprobado' ? '✓' : orden}
          </div>
          <div className="flex-1">
            <p className="text-[#4a3222]">{reto.texto}</p>
            {reto.instruccion_evidencia && (
              <p className="text-sm text-[#a68a64] mt-1 flex items-start gap-1">
                <span>💡</span>
                <span>{reto.instruccion_evidencia}</span>
              </p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {reto.tipos_archivo?.map(tipo => (
                <span key={tipo} className="text-xs px-2 py-1 bg-[#f5efe6] rounded-full text-[#6b4c3a]">
                  {tipo === 'imagen' && '🖼️ Imagen'}
                  {tipo === 'video' && '🎥 Video'}
                  {tipo === 'audio' && '🎵 Audio'}
                  {tipo === 'texto' && '📝 Texto'}
                </span>
              ))}
              {getEstadoBadge()}
            </div>
          </div>
        </div>
      </div>

      {evidencia && (
        <div className="mt-3 space-y-2">
          {evidencia.texto_respuesta && (
            <div className="p-3 bg-[#f5efe6] rounded-lg">
              <p className="text-sm text-gray-700"><strong>📝 Tu respuesta:</strong> {evidencia.texto_respuesta}</p>
            </div>
          )}
          {imagenesEvidencia.length > 0 && (
            <div className="p-3 bg-[#f5efe6] rounded-lg">
              <p className="text-sm text-gray-600 mb-2"><strong>🖼️ Tus imágenes:</strong></p>
              <ImageViewer images={imagenesEvidencia} />
            </div>
          )}
          {evidencia.comentario_padrino && (
            <div className={`p-3 rounded-lg ${evidencia.estado === 'aprobado' ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="text-sm"><strong>💬 Comentario del padrino:</strong> {evidencia.comentario_padrino}</p>
              {evidencia.puntuacion && <p className="text-sm mt-1"><strong>⭐ Puntuación:</strong> {evidencia.puntuacion}/100</p>}
            </div>
          )}
        </div>
      )}

      {(!evidencia || evidencia.estado === 'rechazado') && (
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="mt-3 text-[#6b4c3a] hover:text-[#4a3222] text-sm font-medium flex items-center gap-1"
        >
          {mostrarFormulario ? '✕ Cancelar' : evidencia ? '✏️ Editar evidencia' : '📤 Subir evidencia'}
        </button>
      )}

      {mostrarFormulario && (
        <FormularioEvidencia
          reto={reto}
          estudianteId={estudianteId}
          evidenciaExistente={evidencia}
          onEnviado={() => {
            setMostrarFormulario(false)
            verificarEvidencia()
            onActualizar()
          }}
        />
      )}
    </div>
  )
}

// ==========================================
// COMPONENTE FORMULARIO EVIDENCIA
// ==========================================
function FormularioEvidencia({ reto, estudianteId, evidenciaExistente, onEnviado }) {
  const [texto, setTexto] = useState(evidenciaExistente?.texto_respuesta || '')
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState([])

  useEffect(() => {
    const previews = Array.from(archivos).map((file, idx) => ({
      id: idx, file, url: URL.createObjectURL(file),
      tipo: file.type.startsWith('image/') ? 'imagen' : 'video',
      nombre: file.name, tamaño: (file.size / 1024 / 1024).toFixed(2)
    }))
    setVistaPrevia(previews)
    return () => previews.forEach(p => URL.revokeObjectURL(p.url))
  }, [archivos])

  const eliminarArchivo = (index) => {
    const nuevosArchivos = Array.from(archivos)
    nuevosArchivos.splice(index, 1)
    setArchivos(nuevosArchivos)
  }

  const tiposArchivo = reto.tipos_archivo || []
  const puedeSubirImagen = tiposArchivo.includes('imagen')
  const puedeSubirVideo = tiposArchivo.includes('video')
  const requiereTexto = tiposArchivo.includes('texto') || tiposArchivo.length === 0

  const handleArchivosChange = (e) => {
    const files = Array.from(e.target.files)
    const archivosValidos = files.filter(file => {
      if (puedeSubirImagen && file.type.startsWith('image/')) return true
      if (puedeSubirVideo && file.type.startsWith('video/')) return true
      return false
    })
    if (archivosValidos.length !== files.length) toast.error('Algunos archivos no son del tipo permitido')
    setArchivos(prev => [...prev, ...archivosValidos])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    let evidenciaId = evidenciaExistente?.id
    const evidenciaData = {
      estudiante_id: estudianteId,
      reto_id: reto.id,
      texto_respuesta: reto.tipo_evidencia !== 'preguntas' ? texto : null,
      estado: 'pendiente'
    }

    if (evidenciaExistente) {
      await supabase.from('evidencias').update(evidenciaData).eq('id', evidenciaId)
    } else {
      const { data } = await supabase.from('evidencias').insert(evidenciaData).select()
      evidenciaId = data?.[0]?.id
    }

    if (archivos.length > 0 && evidenciaId) {
      for (const archivo of archivos) {
        const tipo = archivo.type.startsWith('image/') ? 'imagen' : 'video'
        const fileName = `${evidenciaId}/${Date.now()}_${archivo.name}`
        const { error } = await supabase.storage.from('evidencias').upload(fileName, archivo)
        if (error) continue
        const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(fileName)
        await supabase.from('evidencias_archivos').insert({ evidencia_id: evidenciaId, tipo_archivo: tipo, url: urlData.publicUrl, nombre_original: archivo.name })
      }
    }

    toast.success('¡Evidencia enviada! Espera la revisión del padrino')
    onEnviado()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-[#f5efe6] rounded-lg">
      {requiereTexto && (
        <div className="mb-4">
          <label className="block text-[#4a3222] mb-2 font-medium">📝 Tu respuesta:</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a]" rows="4" placeholder="Escribe aquí tu respuesta..." required={requiereTexto && archivos.length === 0} />
        </div>
      )}

      {(puedeSubirImagen || puedeSubirVideo) && (
        <div className="mb-4">
          <label className="block text-[#4a3222] mb-2 font-medium">📎 Subir archivo(s):</label>
          <div className="border-2 border-dashed border-[#d4c4a8] rounded-lg p-4 text-center hover:border-[#6b4c3a] transition cursor-pointer bg-white" onClick={() => document.getElementById('file-input')?.click()}>
            <input id="file-input" type="file" accept={`${puedeSubirImagen ? 'image/*' : ''} ${puedeSubirVideo ? 'video/*' : ''}`.trim()} multiple onChange={handleArchivosChange} className="hidden" />
            <div className="text-4xl mb-2">📁</div>
            <p className="text-[#a68a64]">Haz clic o arrastra archivos aquí</p>
          </div>
          
          {vistaPrevia.length > 0 && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-[#4a3222] mb-2">Vista previa:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {vistaPrevia.map((item) => (
                  <div key={item.id} className="relative group border border-[#e8dcca] rounded-lg overflow-hidden bg-white">
                    {item.tipo === 'imagen' && <img src={item.url} alt={item.nombre} className="w-full h-32 object-cover" />}
                    {item.tipo === 'video' && <video src={item.url} className="w-full h-32 object-cover" muted />}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => eliminarArchivo(item.id)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition">🗑️</button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">{item.nombre} ({item.tamaño} MB)</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={loading} className="flex-1 bg-[#6b4c3a] text-white py-3 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition font-medium">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> Enviando...</span> : '📨 Enviar evidencia'}
        </button>
        <button type="button" onClick={() => { setTexto(''); setArchivos([]) }} className="px-4 py-3 bg-[#e8dcca] text-[#6b4c3a] rounded-lg hover:bg-[#d4c4a8] transition">Limpiar</button>
      </div>
      
      {archivos.length > 0 && <div className="mt-3 p-2 bg-green-50 rounded-lg text-center text-sm text-green-700">✅ {archivos.length} archivo(s) seleccionado(s) listo(s) para subir</div>}
    </form>
  )
}

// ==========================================
// COMPONENTE AYUDA
// ==========================================
function AyudaEstudiante() {
  const preguntasFrecuentes = [
    { q: '¿Cómo subo una evidencia?', a: 'Haz clic en "Subir evidencia" dentro de cada reto. Puedes subir imágenes, videos o escribir texto según lo que pida el reto.' },
    { q: '¿Cómo sé si mi evidencia fue aprobada?', a: 'Recibirás una notificación y el estado cambiará a "Aprobado" o "Rechazado" con el comentario del padrino.' },
    { q: '¿Qué significan los rangos?', a: 'Los rangos son: Semilla (0-199 pts), Brotes (200-499 pts), Cafetero Aprendiz (500-999 pts), Maestro Cafetero (1000-1999 pts) y Leyenda del Café (2000+ pts).' },
    { q: '¿Cómo obtengo insignias?', a: 'Completando todos los retos de un nivel. La insignia se otorga automáticamente.' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
        <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">📘 Guía rápida</h2>
        <div className="text-[#6b4c3a] space-y-2">
          <p>Bienvenido a PPP Tools, tu plataforma de aprendizaje gamificado. Aquí tienes algunas recomendaciones:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Completa los retos en orden para desbloquear nuevos niveles</li>
            <li>Sube evidencias de calidad para obtener mejor puntuación</li>
            <li>Revisa los comentarios de los padrinos para mejorar</li>
            <li>Acumula puntos para subir de rango y obtener insignias</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
        <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">❓ Preguntas frecuentes</h2>
        <div className="space-y-4">
          {preguntasFrecuentes.map((item, idx) => (
            <details key={idx} className="group">
              <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition">{item.q}</summary>
              <p className="mt-2 text-sm text-[#a68a64] pl-4">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}

// Exportar con React.memo para evitar re-renderizados innecesarios
export default React.memo(DashboardEstudianteGamificado)