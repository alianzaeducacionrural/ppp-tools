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
import { AyudaEstudiante } from './AyudaEstudiante'
import { useEvidenciaNotification } from '../comunes/NotificationToast'
import { RecomendacionesVideoModal } from '../comunes/RecomendacionesVideoModal'
import { procesarImagenes } from '../../lib/imagenes'
import { obtenerRango } from '../../data/rangos'

function DashboardEstudianteGamificado() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const userIdRef = useRef(user?.id)
  const lastLoadedUserId = useRef(null)
  const hasLoaded = useRef(false)
  const hasRestoredUIState = useRef(false)

  useEffect(() => {
    userIdRef.current = user?.id
  }, [user?.id])

  const getInitialState = () => {
    try {
      const saved = sessionStorage.getItem('dashboard-cache')
      if (saved) {
        const cache = JSON.parse(saved)
        if (cache.estudiante?.user_id !== userIdRef.current) {
          sessionStorage.removeItem('dashboard-cache')
          return { cachedEstudiante: null, cachedNiveles: null, cachedPuntuacion: 0, cachedInitialLoadDone: false }
        }
        if (cache.timestamp && Date.now() - cache.timestamp < 3600000) {
          return {
            cachedEstudiante: cache.estudiante,
            cachedNiveles: cache.niveles,
            cachedPuntuacion: cache.puntuacionTotal,
            cachedInitialLoadDone: true
          }
        }
      }
    } catch (e) {
      console.error('Error recuperando caché:', e)
    }
    return { cachedEstudiante: null, cachedNiveles: null, cachedPuntuacion: 0, cachedInitialLoadDone: false }
  }

  const [initialCache] = useState(getInitialState)
  const { cachedEstudiante, cachedNiveles, cachedPuntuacion, cachedInitialLoadDone } = initialCache

  const [estudiante, setEstudiante] = useState(cachedEstudiante)
  const [niveles, setNiveles] = useState(cachedNiveles || [])
  const [insignias, setInsignias] = useState([])
  const [loading, setLoading] = useState(!cachedInitialLoadDone)
  const [puntuacionTotal, setPuntuacionTotal] = useState(cachedPuntuacion)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [nivelExpandido, setNivelExpandido] = useState(null)
  const [retosPorNivel, setRetosPorNivel] = useState({})
  const [cargandoRetos, setCargandoRetos] = useState({})
  const [imagenNivelAmpliada, setImagenNivelAmpliada] = useState(null)
  const [initialLoadDone, setInitialLoadDone] = useState(cachedInitialLoadDone)
  const [retosAprobadosCount, setRetosAprobadosCount] = useState(0)
  const [totalRetos, setTotalRetos] = useState(0)

  const cacheRetos = useRef({})
  const cacheNiveles = useRef(cachedNiveles)
  const cacheEstudiante = useRef(cachedEstudiante)
  const isReturningToTab = useRef(false)

  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/perfil') return 'perfil'
    if (path === '/ranking') return 'ranking'
    if (path === '/insignias') return 'insignias'
    if (path === '/ayuda') return 'ayuda'
    return 'inicio'
  }

  const activeTab = getActiveTab()

  const saveStateToCache = useCallback(() => {
    if (estudiante && niveles.length > 0) {
      const cacheData = {
        estudiante: {
          id: estudiante.id,
          user_id: estudiante.user_id,
          nombre_completo: estudiante.nombre_completo,
          puntuacion_total: estudiante.puntuacion_total,
          grado: estudiante.grado,
          tipo_proyecto: estudiante.tipo_proyecto,
          avatar_id: estudiante.avatar_id,
          email: estudiante.email,
          instituciones: estudiante.instituciones,
          municipios: estudiante.municipios,
          sedes: estudiante.sedes
        },
        niveles: niveles.map(n => ({
          id: n.id,
          nombre: n.nombre,
          numero_nivel: n.numero_nivel,
          completado: n.completado,
          bloqueado: n.bloqueado,
          imagen_nivel_url: n.imagen_nivel_url,
          insignia_url: n.insignia_url
        })),
        puntuacionTotal,
        timestamp: Date.now()
      }
      sessionStorage.setItem('dashboard-cache', JSON.stringify(cacheData))
    }
  }, [estudiante, niveles, puntuacionTotal])

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    const currentUserId = userIdRef.current
    const cachedUserId = cacheEstudiante.current?.user_id

    if (!forceRefresh && lastLoadedUserId.current === currentUserId && initialLoadDone && !isReturningToTab.current) return

    if (currentUserId && cachedUserId && cachedUserId !== currentUserId) {
      cacheEstudiante.current = null
      cacheNiveles.current = null
      cacheRetos.current = {}
      lastLoadedUserId.current = null
    }

    setLoading(true)

    try {
      const { data: estudianteData, error: estudianteError } = await supabase
        .from('estudiantes')
        .select('*, instituciones(nombre), municipios(nombre), sedes(nombre)')
        .eq('user_id', userIdRef.current)
        .single()

      if (estudianteError) throw estudianteError

      cacheEstudiante.current = estudianteData
      setEstudiante(estudianteData)

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

        cacheNiveles.current = nivelesData.map(n => ({ ...n, completado: false, bloqueado: false }))
        setNiveles(cacheNiveles.current)
      }

      // Insignias, puntuación y total de retos en paralelo
      const nivelIdsParaRetos = (cacheNiveles.current || []).map(n => n.id)
      const [{ data: insigniasData }, { data: evAprobadas }, { count: totalRetosCount }] = await Promise.all([
        supabase.from('insignias_obtenidas').select('nivel_id').eq('estudiante_id', estudianteData.id),
        supabase.from('evidencias').select('puntuacion').eq('estudiante_id', estudianteData.id).eq('estado', 'aprobado'),
        nivelIdsParaRetos.length
          ? supabase.from('retos').select('*', { count: 'exact', head: true }).in('nivel_id', nivelIdsParaRetos)
          : Promise.resolve({ count: 0 })
      ])

      const totalPuntos = (evAprobadas || []).reduce((s, e) => s + (e.puntuacion || 0), 0)
      setPuntuacionTotal(totalPuntos)
      setRetosAprobadosCount(evAprobadas?.length || 0)
      setTotalRetos(totalRetosCount || 0)

      const nivelesCompletados = new Set(insigniasData?.map(i => i.nivel_id) || [])

      const nivelesConEstado = (cacheNiveles.current || []).map((nivel, idx) => ({
        ...nivel,
        completado: nivelesCompletados.has(nivel.id),
        bloqueado: idx > 0 && !nivelesCompletados.has((cacheNiveles.current || [])[idx - 1]?.id)
      }))

      setNiveles(nivelesConEstado)
      setInsignias(insigniasData || [])
      setInitialLoadDone(true)
      lastLoadedUserId.current = currentUserId
      saveStateToCache()

    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar tus datos')
    }

    setLoading(false)
  }, [initialLoadDone, saveStateToCache])

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
    setNivelExpandido(prev => {
      if (prev === nivelId) return null
      cargarRetos(nivelId)
      return nivelId
    })
  }, [cargarRetos])

  const handleLogout = useCallback(async () => {
    sessionStorage.removeItem('dashboard-cache')
    sessionStorage.removeItem('dashboard-ui-state')
    cacheRetos.current = {}
    cacheNiveles.current = null
    cacheEstudiante.current = null
    lastLoadedUserId.current = null
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }, [logout, navigate])

  const handleEvidenciaActualizada = useCallback(() => cargarDatos(true), [cargarDatos])
  useEvidenciaNotification(supabase, estudiante?.id, handleEvidenciaActualizada)

  const rango = obtenerRango(puntuacionTotal, estudiante?.tipo_proyecto || 'cafe')
  const nivelesCompletados = niveles.filter(n => n.completado).length
  const porcentajeProgreso = totalRetos > 0 ? (retosAprobadosCount / totalRetos) * 100 : 0
  const retosCompletados = useMemo(() => {
    return Object.values(retosPorNivel).flat().length
  }, [retosPorNivel])

  useEffect(() => {
    const interval = setInterval(() => {
      if (estudiante && niveles.length > 0) saveStateToCache()
    }, 30000)
    return () => clearInterval(interval)
  }, [estudiante, niveles, saveStateToCache])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (estudiante && niveles.length > 0) saveStateToCache()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [estudiante, niveles, saveStateToCache])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isReturningToTab.current = true
        setTimeout(() => { isReturningToTab.current = false }, 1000)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Restaura UI state solo una vez al montar — el bug anterior era que nivelExpandido
  // estaba en las dependencias, y al cerrarlo (null) el effect re-corría y lo restauraba.
  useEffect(() => {
    if (hasRestoredUIState.current) return
    hasRestoredUIState.current = true
    const savedState = sessionStorage.getItem('dashboard-ui-state')
    if (savedState) {
      try {
        const { nivelExpandido: savedNivel, sidebarOpen: savedSidebar } = JSON.parse(savedState)
        if (savedNivel) {
          setNivelExpandido(savedNivel)
          cargarRetos(savedNivel)
        }
        if (savedSidebar !== undefined) setSidebarOpen(savedSidebar)
      } catch (e) {
        console.error('Error al recuperar estado UI:', e)
      }
    }
  }, [cargarRetos])

  useEffect(() => {
    sessionStorage.setItem('dashboard-ui-state', JSON.stringify({ nivelExpandido, sidebarOpen }))
  }, [nivelExpandido, sidebarOpen])

  useEffect(() => {
    if (userIdRef.current && !hasLoaded.current) {
      hasLoaded.current = true
      cargarDatos()
    }
  }, [])

  const LEVEL_ICONS = ['🌱', '🌿', '☕', '🏆', '🎯', '⭐', '🔥', '💎']

  // useMemo y no useCallback: al declararlo como componente e insertarlo con
  // <InicioContent />, cada cambio de dependencia creaba un tipo de componente
  // nuevo y React desmontaba todo el árbol (los RetoCard perdían su estado y
  // volvían a consultar la evidencia desde cero).
  const inicioContent = useMemo(() => (
    <>
      {/* Tarjeta de bienvenida */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#e8dcca] mb-5 overflow-hidden">
        <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] px-5 py-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <span>🧙‍♂️</span>
                <span>¡Hola, {estudiante?.nombre_completo?.split(' ')[0]}!</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#d4c4a8] mt-1">
                {estudiante?.instituciones?.nombre} · {estudiante?.grado}° ·
                {estudiante?.tipo_proyecto === 'cafe' ? ' ☕ Escuela y Café' : ' 🌽 Seguridad Alimentaria'}
              </p>
            </div>
            <button
              onClick={() => {
                toast.loading('Refrescando datos...', { id: 'refresh' })
                cargarDatos(true).then(() => toast.success('¡Datos actualizados!', { id: 'refresh' }))
              }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white transition px-3 py-1.5 rounded-lg border border-white/20 text-xs font-medium flex-shrink-0"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-[#e8dcca]">
          <div className="px-4 py-3 text-center">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${rango.color} ${rango.border} border`}>
              <span>{rango.emoji}</span>
              <span className="hidden sm:inline">{rango.nombre}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#a68a64] mt-1">Mi rango</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg sm:text-xl font-bold text-[#4a3222]">{puntuacionTotal}</p>
            <p className="text-[10px] sm:text-xs text-[#a68a64]">puntos totales</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg sm:text-xl font-bold text-[#4a3222]">{nivelesCompletados}<span className="text-sm text-[#a68a64]">/{niveles.length}</span></p>
            <p className="text-[10px] sm:text-xs text-[#a68a64]">niveles</p>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="bg-white rounded-2xl shadow-md border border-[#e8dcca] p-4 sm:p-5 mb-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-[#4a3222] flex items-center gap-2">
            <span>📊</span> Progreso general
          </h3>
          <span className="text-sm font-bold text-[#6b4c3a]">{Math.round(porcentajeProgreso)}%</span>
        </div>
        <div className="w-full bg-[#e8dcca] rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-[#8b6b54] via-[#6b4c3a] to-[#4a3222]"
            style={{ width: `${porcentajeProgreso}%` }}
          />
        </div>
        <p className="text-xs text-[#a68a64] mt-2">
          {retosAprobadosCount} de {totalRetos} retos completados
        </p>
      </div>

      {/* Lista de niveles */}
      <div className="space-y-3">
        {niveles.map((nivel, index) => {
          const isOpen = nivelExpandido === nivel.id
          const retos = retosPorNivel[nivel.id] || []
          const retosNivel = retos.length

          return (
            <div
              key={nivel.id}
              className={`bg-white rounded-2xl shadow-md border transition-all duration-200 overflow-hidden ${
                nivel.bloqueado ? 'border-[#e8dcca] opacity-60' :
                isOpen ? 'border-[#6b4c3a] shadow-lg' : 'border-[#e8dcca] hover:border-[#d4c4a8] hover:shadow-lg'
              }`}
            >
              <button
                onClick={() => !nivel.bloqueado && toggleNivel(nivel.id)}
                disabled={nivel.bloqueado}
                className={`w-full p-4 sm:p-5 flex items-center justify-between transition-all ${
                  nivel.bloqueado ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${isOpen ? 'bg-gradient-to-r from-[#f5efe6] to-white' : 'hover:bg-[#faf7f3]'}`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Imagen/icono nivel */}
                  <div className="relative group flex-shrink-0">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex items-center justify-center shadow-sm ${
                      nivel.completado ? 'bg-green-50 ring-2 ring-green-400' :
                      nivel.bloqueado ? 'bg-gray-100' : 'bg-gradient-to-br from-[#f5efe6] to-[#e8dcca]'
                    }`}>
                      {nivel.imagen_nivel_url ? (
                        <img
                          src={nivel.imagen_nivel_url}
                          alt={nivel.nombre}
                          className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110"
                          onClick={(e) => { e.stopPropagation(); setImagenNivelAmpliada(nivel.imagen_nivel_url) }}
                        />
                      ) : (
                        <span className="text-2xl sm:text-3xl">
                          {nivel.completado ? '✅' : nivel.bloqueado ? '🔒' : LEVEL_ICONS[index] || '🎯'}
                        </span>
                      )}
                    </div>
                    {nivel.imagen_nivel_url && !nivel.bloqueado && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 rounded-xl transition-all flex items-center justify-center pointer-events-none">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">🔍</span>
                      </div>
                    )}
                  </div>

                  {/* Info nivel */}
                  <div className="text-left">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-[#a68a64] uppercase tracking-wider">
                        Nivel {nivel.numero_nivel}
                      </span>
                      {nivel.completado && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✅ Completado</span>
                      )}
                      {nivel.bloqueado && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">🔒 Bloqueado</span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#4a3222]">{nivel.nombre}</h3>
                    {retosNivel > 0 && (
                      <p className="text-xs text-[#a68a64] mt-0.5">{retosNivel} {retosNivel === 1 ? 'reto' : 'retos'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {nivel.completado && nivel.insignia_url && (
                    <img
                      src={nivel.insignia_url}
                      alt="Insignia"
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain cursor-pointer hover:scale-110 transition"
                      onClick={(e) => { e.stopPropagation(); setImagenNivelAmpliada(nivel.insignia_url) }}
                    />
                  )}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen ? 'bg-[#6b4c3a] text-white' : 'bg-[#f5efe6] text-[#a68a64]'
                  }`}>
                    <span className={`text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </div>
              </button>

              {isOpen && !nivel.bloqueado && (
                <div className="border-t border-[#e8dcca] bg-[#faf7f3] p-3 sm:p-4">
                  {cargandoRetos[nivel.id] ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="border border-[#e8dcca] rounded-xl p-4 animate-pulse bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-[#e8dcca] rounded-full" />
                            <div className="flex-1">
                              <div className="h-3 bg-[#e8dcca] rounded w-3/4 mb-2" />
                              <div className="h-2.5 bg-[#f5efe6] rounded w-1/2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : retosPorNivel[nivel.id]?.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-[#e8dcca]">
                      <span className="text-4xl block mb-2">📭</span>
                      <p className="text-sm text-[#a68a64] font-medium">No hay retos para este nivel aún.</p>
                      <p className="text-xs text-[#a68a64] mt-1">Vuelve más tarde o contacta a tu padrino.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
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
          )
        })}
      </div>
    </>
  ), [estudiante, niveles, nivelExpandido, cargandoRetos, retosPorNivel, rango, puntuacionTotal, porcentajeProgreso, nivelesCompletados, toggleNivel, cargarDatos])

  const mainContent = useMemo(() => (
    <div className="min-h-screen bg-[#f5efe6]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
        onLogout={handleLogout}
        user={user}
        estudiante={estudiante ? { ...estudiante, puntuacion_total: puntuacionTotal } : estudiante}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'}`}>
        <div className="min-h-screen overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-3xl">
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#4a3222]">
                {activeTab === 'inicio' && '🗺️ Mapa de Misiones'}
                {activeTab === 'perfil' && '👤 Mi Perfil'}
                {activeTab === 'ranking' && '🏆 Ranking'}
                {activeTab === 'insignias' && '📦 Mis Insignias'}
                {activeTab === 'ayuda' && '❓ Centro de Ayuda'}
              </h1>
              <p className="text-xs sm:text-sm text-[#a68a64] mt-1">
                {activeTab === 'inicio' && 'Completa los retos para ganar insignias y subir de rango'}
                {activeTab === 'perfil' && 'Gestiona tu información personal y preferencias'}
                {activeTab === 'ranking' && 'Compara tu progreso con otros estudiantes'}
                {activeTab === 'insignias' && 'Todas las insignias que has obtenido'}
                {activeTab === 'ayuda' && 'Preguntas frecuentes y guías de uso'}
              </p>
            </div>

            {activeTab === 'inicio' && inicioContent}
            {activeTab === 'perfil' && (
              <PerfilEstudiante
                estudiante={estudiante}
                onActualizar={() => cargarDatos(true)}
                puntuacionTotal={puntuacionTotal}
                nivelesCompletados={niveles.filter(n => n.completado)}
              />
            )}
            {activeTab === 'ranking' && <RankingEstudiante estudiante={estudiante} />}
            {activeTab === 'insignias' && <InsigniasEstudiante estudianteId={estudiante?.id} niveles={niveles} />}
            {activeTab === 'ayuda' && <AyudaEstudiante tipoProyecto={estudiante?.tipo_proyecto} />}
          </div>
        </div>
      </div>

      {imagenNivelAmpliada && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImagenNivelAmpliada(null)}
        >
          <button
            className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/75 rounded-full w-9 h-9 flex items-center justify-center transition z-10"
            onClick={() => setImagenNivelAmpliada(null)}
          >
            ✕
          </button>
          <img
            src={imagenNivelAmpliada}
            alt="Ampliada"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  ), [sidebarOpen, activeTab, estudiante, niveles, puntuacionTotal, rango, imagenNivelAmpliada, cargarDatos, user, handleLogout, inicioContent])

  if (loading && !estudiante) {
    return (
      <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-5xl sm:text-6xl animate-bounce mb-4">☕</div>
          <div className="text-lg sm:text-xl text-[#6b4c3a]">Cargando tu aventura...</div>
        </div>
      </div>
    )
  }

  return mainContent
}

// ==========================================
// RETOCARD
// ==========================================
function RetoCard({ reto, orden, estudianteId, onActualizar }) {
  const [evidencia, setEvidencia] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(true)

  // No se usa maybeSingle(): si por cualquier motivo existiera más de una fila,
  // maybeSingle devolvía error y la evidencia desaparecía de la pantalla, así que
  // el estudiante volvía a enviarla una y otra vez.
  const verificarEvidencia = useCallback(async () => {
    if (!estudianteId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('evidencias')
      .select('*, respuestas(*), evidencias_archivos(*)')
      .eq('estudiante_id', estudianteId)
      .eq('reto_id', reto.id)
      .order('id', { ascending: false })
      .limit(1)

    if (error) console.error('Error consultando la evidencia:', error)
    setEvidencia(data?.[0] || null)
    setLoading(false)
  }, [estudianteId, reto.id])

  useEffect(() => { verificarEvidencia() }, [verificarEvidencia])

  const estadoConfig = {
    pendiente: { badge: 'bg-amber-100 text-amber-800', label: '⏳ Pendiente', border: 'border-amber-200' },
    aprobado:  { badge: 'bg-green-100 text-green-800',  label: '✅ Aprobado',  border: 'border-green-200' },
    rechazado: { badge: 'bg-red-100 text-red-800',      label: '❌ Rechazado', border: 'border-red-200'   },
  }
  const estadoActual = evidencia ? estadoConfig[evidencia.estado] : null

  if (loading) {
    return (
      <div className="border border-[#e8dcca] rounded-xl p-4 animate-pulse bg-white">
        <div className="h-4 bg-[#e8dcca] rounded w-1/3 mb-2" />
        <div className="h-12 bg-[#f5efe6] rounded" />
      </div>
    )
  }

  const archivos = evidencia?.evidencias_archivos || []
  const imagenesEvidencia = archivos.filter(a => a.tipo_archivo === 'imagen').map(a => a.url)
  const enlacesEvidencia = archivos.filter(a => a.tipo_archivo === 'video' || a.tipo_archivo === 'audio')

  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-all ${estadoActual?.border || 'border-[#e8dcca]'}`}>
      {/* Header del reto */}
      <div className={`px-4 py-3 flex items-start gap-3 ${evidencia?.estado === 'aprobado' ? 'bg-green-50' : 'bg-white'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
          evidencia?.estado === 'aprobado' ? 'bg-green-500 text-white' :
          evidencia?.estado === 'pendiente' ? 'bg-amber-400 text-white' :
          evidencia?.estado === 'rechazado' ? 'bg-red-400 text-white' :
          'bg-[#e8dcca] text-[#6b4c3a]'
        }`}>
          {evidencia?.estado === 'aprobado' ? '✓' : orden}
        </div>
        <div className="flex-1">
          <p className="text-sm sm:text-base text-[#4a3222] font-medium">{reto.texto}</p>
          {reto.instruccion_evidencia && (
            <p className="text-xs text-[#a68a64] mt-1 flex items-start gap-1">
              <span>💡</span><span>{reto.instruccion_evidencia}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {reto.tipos_archivo?.map(tipo => (
              <span key={tipo} className="text-[10px] px-2 py-0.5 bg-[#f5efe6] rounded-full text-[#6b4c3a] border border-[#e8dcca]">
                {tipo === 'imagen' && '🖼️ Imagen'}
                {tipo === 'video' && '🎥 Video'}
                {tipo === 'audio' && '🎵 Audio'}
                {tipo === 'texto' && '📝 Texto'}
              </span>
            ))}
            {estadoActual && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${estadoActual.badge}`}>
                {estadoActual.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de evidencia enviada */}
      {evidencia && (
        <div className="px-4 pb-3 space-y-2 bg-white">
          {evidencia.texto_respuesta && (
            <div className="p-3 bg-[#f5efe6] rounded-lg border border-[#e8dcca]">
              <p className="text-xs font-semibold text-[#6b4c3a] mb-1">📝 Tu respuesta</p>
              <p className="text-xs sm:text-sm text-[#4a3222]">{evidencia.texto_respuesta}</p>
            </div>
          )}
          {imagenesEvidencia.length > 0 && !mostrarFormulario && (
            <div className="p-3 bg-[#f5efe6] rounded-lg border border-[#e8dcca]">
              <p className="text-xs font-semibold text-[#6b4c3a] mb-2">🖼️ Tus imágenes</p>
              <ImageViewer images={imagenesEvidencia} />
            </div>
          )}
          {enlacesEvidencia.length > 0 && !mostrarFormulario && (
            <div className="p-3 bg-[#f5efe6] rounded-lg border border-[#e8dcca]">
              <p className="text-xs font-semibold text-[#6b4c3a] mb-2">
                {enlacesEvidencia[0].tipo_archivo === 'audio' ? '🎵 Tu audio' : '🎥 Tu video'}
              </p>
              {enlacesEvidencia.map(enlace => (
                <a
                  key={enlace.id}
                  href={enlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#6b4c3a] hover:text-[#4a3222] underline break-all"
                >
                  <span className="flex-shrink-0">🔗</span>
                  <span>{enlace.url}</span>
                </a>
              ))}
            </div>
          )}
          {evidencia.comentario_padrino && (
            <div className={`p-3 rounded-lg border ${evidencia.estado === 'aprobado' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs font-semibold mb-1">{evidencia.estado === 'aprobado' ? '✅' : '❌'} Comentario del padrino</p>
              <p className="text-xs sm:text-sm">{evidencia.comentario_padrino}</p>
              {evidencia.puntuacion != null && (
                <p className="text-xs mt-1 font-medium">⭐ Puntuación: {evidencia.puntuacion}/100</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botón subir/editar */}
      {(!evidencia || evidencia.estado === 'rechazado') && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setMostrarFormulario(p => !p)}
            className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mostrarFormulario
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-[#6b4c3a] text-white hover:bg-[#4a3222]'
            }`}
          >
            {mostrarFormulario ? '✕ Cancelar' : evidencia ? '✏️ Editar evidencia' : '📤 Subir evidencia'}
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <div className="border-t border-[#e8dcca]">
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
        </div>
      )}
    </div>
  )
}

// ==========================================
// FORMULARIO EVIDENCIA
// ==========================================
function FormularioEvidencia({ reto, estudianteId, evidenciaExistente, onEnviado }) {
  const [texto, setTexto] = useState(evidenciaExistente?.texto_respuesta || '')
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [mostrarRecomendaciones, setMostrarRecomendaciones] = useState(false)
  const fileInputRef = useRef(null)

  const existentes = evidenciaExistente?.evidencias_archivos || []
  const [archivosExistentes, setArchivosExistentes] = useState(existentes.filter(a => a.tipo_archivo === 'imagen'))
  const [eliminados, setEliminados] = useState([])

  const enlaceExistente = existentes.find(a => a.tipo_archivo === 'video' || a.tipo_archivo === 'audio')
  const [videoUrl, setVideoUrl] = useState(enlaceExistente?.url || '')

  // Un ref además del estado: el estado no se actualiza a tiempo si el
  // estudiante toca "Enviar" dos veces seguidas en el celular.
  const enviandoRef = useRef(false)
  // Cuántas fotos alcanzaron a subirse, por si el envío falla a mitad de camino.
  const subidasOk = useRef(0)

  useEffect(() => {
    const previews = archivos.map((file, idx) => ({
      id: idx,
      url: URL.createObjectURL(file),
      nombre: file.name,
      tamanio: (file.size / 1024 / 1024).toFixed(2)
    }))
    setVistaPrevia(previews)
    return () => previews.forEach(p => URL.revokeObjectURL(p.url))
  }, [archivos])

  const tiposArchivo = reto.tipos_archivo || []
  const puedeSubirImagen = tiposArchivo.includes('imagen')
  // Video y audio ya no se suben como archivo: se pide el enlace, igual que a los
  // docentes. Eran los que siempre fallaban por peso y quedaban sin evidencia.
  const pideEnlace = tiposArchivo.includes('video') || tiposArchivo.includes('audio')
  const esAudio = tiposArchivo.includes('audio') && !tiposArchivo.includes('video')
  const admiteTexto = tiposArchivo.includes('texto') || tiposArchivo.length === 0
  // El texto solo es obligatorio cuando es la única forma de responder el reto.
  const textoObligatorio = admiteTexto && !puedeSubirImagen && !pideEnlace

  const totalImagenes = archivosExistentes.length + archivos.length

  async function agregarArchivos(files) {
    const lista = Array.from(files || [])
    if (!lista.length) return

    setProcesando(true)
    // Convierte HEIC a JPG y reduce el peso para que la subida no se caiga.
    const { ok, errores } = await procesarImagenes(lista)
    setProcesando(false)

    errores.forEach(msg => toast.error(msg, { duration: 7000 }))
    if (ok.length) setArchivos(prev => [...prev, ...ok])
  }

  const eliminarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index))
  }

  const quitarExistente = (archivo) => {
    setArchivosExistentes(prev => prev.filter(a => a.id !== archivo.id))
    setEliminados(prev => [...prev, archivo])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    agregarArchivos(e.dataTransfer.files)
  }

  /** Sube una imagen al bucket y registra la fila. Lanza error si algo falla. */
  async function subirImagen(evidenciaId, archivo, indice) {
    const nombreUnico = `${evidenciaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nombreUnico, archivo, { upsert: false, contentType: archivo.type })

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      throw new Error('No se pudo subir una de las fotos. Revisa tu conexión e inténtalo de nuevo.')
    }

    const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(nombreUnico)
    const { error: insertError } = await supabase.from('evidencias_archivos').insert({
      evidencia_id: evidenciaId,
      tipo_archivo: 'imagen',
      url: urlData.publicUrl,
      nombre_original: archivo.name,
      tamanio_bytes: archivo.size,
      orden: indice
    })
    if (insertError) {
      console.error('Error registrando archivo:', insertError)
      throw new Error('La foto se subió pero no quedó registrada. Inténtalo de nuevo.')
    }
  }

  /**
   * Devuelve el id de la evidencia de este reto, creándola solo si no existe.
   * Es a prueba de reenvíos: si otra pestaña o un toque doble ya la creó,
   * la reutiliza en vez de crear una copia.
   */
  async function obtenerOCrearEvidencia(datos) {
    const { data: existente } = await supabase
      .from('evidencias')
      .select('id')
      .eq('estudiante_id', estudianteId)
      .eq('reto_id', reto.id)
      .order('id', { ascending: false })
      .limit(1)

    if (existente?.[0]?.id) {
      const { error } = await supabase.from('evidencias').update(datos).eq('id', existente[0].id)
      if (error) throw error
      return existente[0].id
    }

    const { data, error } = await supabase.from('evidencias').insert(datos).select('id')

    // 23505 = ya existe (restricción única estudiante+reto). Se recupera la fila real.
    if (error?.code === '23505') {
      const { data: yaCreada } = await supabase
        .from('evidencias')
        .select('id')
        .eq('estudiante_id', estudianteId)
        .eq('reto_id', reto.id)
        .limit(1)
      if (!yaCreada?.[0]?.id) throw error
      const { error: updError } = await supabase.from('evidencias').update(datos).eq('id', yaCreada[0].id)
      if (updError) throw updError
      return yaCreada[0].id
    }
    if (error) throw error

    return data?.[0]?.id
  }

  // Ninguna evidencia puede salir vacía: era la causa de decenas de envíos que
  // el padrino recibía sin nada que calificar.
  function validar() {
    if (procesando) return 'Espera a que terminen de prepararse las fotos.'
    if (puedeSubirImagen && totalImagenes === 0) {
      return 'Este reto necesita al menos una foto. Toca "Agregar fotos" antes de enviar.'
    }
    if (pideEnlace) {
      const url = videoUrl.trim()
      if (!url) return `Pega el enlace de tu ${esAudio ? 'audio' : 'video'} antes de enviar.`
      if (!/^https?:\/\/\S+$/i.test(url)) return 'El enlace debe empezar con http:// o https://'
    }
    if (textoObligatorio && !texto.trim()) return 'Escribe tu respuesta antes de enviar.'
    if (!puedeSubirImagen && !pideEnlace && !texto.trim()) {
      return 'La evidencia está vacía. Escribe tu respuesta antes de enviar.'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviandoRef.current) return

    const problema = validar()
    if (problema) {
      toast.error(problema, { duration: 5000 })
      return
    }

    enviandoRef.current = true
    setLoading(true)

    try {
      const evidenciaData = {
        estudiante_id: estudianteId,
        reto_id: reto.id,
        // Antes se descartaba el texto en los retos tipo cuestionario y la
        // evidencia llegaba vacía; ahora siempre se guarda lo que escribió.
        texto_respuesta: texto.trim() || null,
        // Al reenviar tras un rechazo vuelve a quedar pendiente y se limpia la revisión.
        estado: 'pendiente',
        puntuacion: null,
        comentario_padrino: null,
        fecha_revision: null,
        fecha_envio: new Date().toISOString()
      }

      setProgreso('Guardando tu evidencia...')
      const evidenciaId = await obtenerOCrearEvidencia(evidenciaData)
      if (!evidenciaId) throw new Error('No se pudo obtener el ID de la evidencia')

      // Quitar las fotos que el estudiante descartó
      for (const archivo of eliminados) {
        const marker = '/object/public/evidencias/'
        const i = archivo.url?.indexOf(marker) ?? -1
        if (i !== -1) {
          await supabase.storage.from('evidencias').remove([archivo.url.slice(i + marker.length)])
        }
        await supabase.from('evidencias_archivos').delete().eq('id', archivo.id)
      }

      // Subir las fotos nuevas, una por una y en orden.
      for (let i = 0; i < archivos.length; i++) {
        setProgreso(`Subiendo foto ${i + 1} de ${archivos.length}...`)
        await subirImagen(evidenciaId, archivos[i], archivosExistentes.length + i)
        subidasOk.current = i + 1
      }

      // El video o audio se guarda como enlace, nunca como archivo.
      if (pideEnlace) {
        setProgreso('Guardando el enlace...')
        const urlLimpia = videoUrl.trim()
        const tipoEnlace = esAudio ? 'audio' : 'video'
        const etiqueta = esAudio ? 'Enlace del audio' : 'Enlace del video'
        if (enlaceExistente?.id) {
          await supabase.from('evidencias_archivos')
            .update({ url: urlLimpia, tipo_archivo: tipoEnlace, nombre_original: etiqueta })
            .eq('id', enlaceExistente.id)
        } else {
          const { error: enlaceError } = await supabase.from('evidencias_archivos').insert({
            evidencia_id: evidenciaId,
            tipo_archivo: tipoEnlace,
            url: urlLimpia,
            nombre_original: etiqueta
          })
          if (enlaceError) throw new Error('No se pudo guardar el enlace. Inténtalo de nuevo.')
        }
      }

      // Verificación final: nunca dar por enviada una evidencia vacía.
      if (puedeSubirImagen) {
        const { count } = await supabase
          .from('evidencias_archivos')
          .select('id', { count: 'exact', head: true })
          .eq('evidencia_id', evidenciaId)
          .eq('tipo_archivo', 'imagen')
        if (!count) throw new Error('Las fotos no llegaron al servidor. Revisa tu conexión e inténtalo de nuevo.')
      }

      setArchivos([])
      setEliminados([])
      toast.success('¡Evidencia enviada! Espera la revisión del padrino', { duration: 5000 })
      onEnviado()
    } catch (error) {
      console.error('Error enviando evidencia:', error)
      // Las fotos que sí alcanzaron a subir ya quedaron guardadas: se quitan de la
      // selección para que al reintentar no se suban por segunda vez.
      if (subidasOk.current > 0) setArchivos(prev => prev.slice(subidasOk.current))
      toast.error(error.message || 'Error al enviar la evidencia. Inténtalo de nuevo.', { duration: 7000 })
    } finally {
      subidasOk.current = 0
      setProgreso('')
      setLoading(false)
      enviandoRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-[#faf7f3] space-y-4">
      {admiteTexto && (
        <div>
          <label className="block text-xs font-semibold text-[#4a3222] mb-1.5 uppercase tracking-wide">
            📝 Tu respuesta
          </label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-white resize-none"
            rows="3"
            placeholder="Escribe aquí tu respuesta..."
          />
        </div>
      )}

      {/* Enlace del video o audio */}
      {pideEnlace && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="block text-xs font-semibold text-[#4a3222] uppercase tracking-wide">
              {esAudio ? '🎵 Enlace de tu audio' : '🎥 Enlace de tu video'}
            </label>
            <button
              type="button"
              onClick={() => setMostrarRecomendaciones(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#6b4c3a] hover:text-[#4a3222] bg-[#f5efe6] hover:bg-[#e8dcca] px-2.5 py-1 rounded-full transition flex-shrink-0"
            >
              💡 ¿Cómo lo subo?
            </button>
          </div>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-white"
            placeholder="https://youtu.be/... o enlace de Google Drive"
            inputMode="url"
          />
          <p className="text-[11px] text-[#a68a64] mt-1.5 leading-relaxed">
            Sube tu {esAudio ? 'audio' : 'video'} a <strong>YouTube</strong>, <strong>Google Drive</strong> u otra
            plataforma y pega aquí el enlace. Verifica que no quede privado, para que tu padrino pueda verlo.
          </p>
        </div>
      )}

      {puedeSubirImagen && (
        <div>
          {/* Fotos actuales (al editar) */}
          {archivosExistentes.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-[#4a3222] mb-1.5 uppercase tracking-wide">
                🗂️ Fotos actuales
              </label>
              <p className="text-[11px] text-[#a68a64] mb-2">Quita las que no quieras conservar y agrega nuevas abajo.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {archivosExistentes.map((archivo) => (
                  <div key={archivo.id} className="relative group rounded-xl overflow-hidden border border-[#e8dcca] bg-white shadow-sm">
                    <img src={archivo.url} alt={archivo.nombre_original || 'Foto'} className="w-full h-20 sm:h-24 object-cover" />
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] text-[#4a3222] font-medium truncate" title={archivo.nombre_original}>
                        {archivo.nombre_original || 'Foto'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarExistente(archivo)}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold transition-all shadow-md"
                      title="Quitar foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block text-xs font-semibold text-[#4a3222] mb-1.5 uppercase tracking-wide">
            📎 Agregar fotos
          </label>

          <div
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              procesando ? 'border-[#d4c4a8] bg-[#f5efe6] cursor-wait' : 'cursor-pointer'
            } ${
              dragOver ? 'border-[#6b4c3a] bg-[#f5efe6] scale-[1.01]' : 'border-[#d4c4a8] hover:border-[#6b4c3a] bg-white hover:bg-[#faf7f3]'
            }`}
            onClick={() => !procesando && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => { agregarArchivos(e.target.files); e.target.value = '' }}
              className="hidden"
            />
            {procesando ? (
              <>
                <div className="text-3xl mb-1 animate-pulse">⏳</div>
                <p className="text-sm font-medium text-[#6b4c3a]">Preparando tus fotos...</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-1">{dragOver ? '📂' : '📷'}</div>
                <p className="text-sm font-medium text-[#6b4c3a]">
                  {dragOver ? 'Suelta las fotos aquí' : 'Toca aquí para agregar fotos'}
                </p>
                <p className="text-xs text-[#a68a64] mt-1">
                  Se optimizan solas para que suban rápido, aunque tengas poca señal
                </p>
              </>
            )}
          </div>

          {/* Fotos nuevas seleccionadas */}
          {vistaPrevia.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-[#4a3222] mb-2">
                {vistaPrevia.length} {vistaPrevia.length === 1 ? 'foto lista para enviar' : 'fotos listas para enviar'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vistaPrevia.map((prev, idx) => (
                  <div key={prev.id} className="relative group rounded-xl overflow-hidden border border-[#e8dcca] bg-white shadow-sm">
                    <img src={prev.url} alt={prev.nombre} className="w-full h-20 sm:h-24 object-cover" />
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] text-[#4a3222] font-medium truncate" title={prev.nombre}>{prev.nombre}</p>
                      <p className="text-[10px] text-[#a68a64]">{prev.tamanio} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarArchivo(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold transition-all shadow-md"
                      title="Quitar foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImagenes === 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
              ⚠️ Este reto necesita al menos una foto para poder enviarse.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading || procesando}
          className="flex-1 bg-[#6b4c3a] hover:bg-[#4a3222] disabled:opacity-50 text-white py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>{progreso || 'Enviando...'}</span>
            </>
          ) : (
            <>
              <span>📨</span>
              <span>Enviar evidencia</span>
            </>
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => { setTexto(''); setArchivos([]); setVideoUrl('') }}
          className="px-4 py-2.5 bg-[#e8dcca] hover:bg-[#d4c4a8] disabled:opacity-50 text-[#6b4c3a] rounded-xl transition-all text-sm font-medium"
        >
          Limpiar
        </button>
      </div>

      {loading && (
        <p className="text-[11px] text-[#a68a64] text-center">
          No cierres esta pantalla ni vuelvas a tocar el botón: tu evidencia se está enviando.
        </p>
      )}

      {mostrarRecomendaciones && (
        <RecomendacionesVideoModal
          onClose={() => setMostrarRecomendaciones(false)}
          variante="estudiante"
          instruccion={reto.instruccion_evidencia}
        />
      )}
    </form>
  )
}

export default React.memo(DashboardEstudianteGamificado)
