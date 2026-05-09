import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { NivelesManager } from './NivelesManager'
import { RetosManager } from './RetosManager'
import { EstudiantesManager } from './EstudiantesManager'
import { PadrinosManager } from './PadrinosManager'
import { ReportesExport } from './ReportesExport'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icono: '📊', descripcion: 'Resumen general' },
  { id: 'niveles', label: 'Niveles', icono: '📚', descripcion: 'Gestionar niveles' },
  { id: 'retos', label: 'Retos', icono: '🎯', descripcion: 'Gestionar retos' },
  { id: 'estudiantes', label: 'Estudiantes', icono: '👨‍🎓', descripcion: 'Ver estudiantes' },
  { id: 'padrinos', label: 'Padrinos', icono: '👥', descripcion: 'Gestionar padrinos' },
  { id: 'reportes', label: 'Reportes', icono: '📄', descripcion: 'Exportar datos' },
]

// ============================================
// SIDEBAR ADMIN
// ============================================
function SidebarAdmin({ isOpen, onToggle, onLogout, activeTab, onTabChange }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#5a3e2e] to-[#3d2a1e] text-[#f5efe6] z-20 shadow-xl border-t border-[#8b6b54]">
          <div className="flex justify-around items-center py-1 px-1">
            {menuItems.map(item => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#d4c4a8] text-[#4a3222] shadow-md scale-110'
                      : 'text-[#f5efe6]/70 hover:text-[#d4c4a8] hover:bg-[#8b6b54]/30'
                  }`}
                >
                  <span className="text-xl">{item.icono}</span>
                </button>
              )
            })}
            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-all text-[#f5efe6]/70 hover:text-red-400 hover:bg-[#8b6b54]/30"
            >
              <span className="text-xl">🚪</span>
            </button>
          </div>
        </div>
        <div className="h-14" />
      </>
    )
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={onToggle} />
      )}

      <div className={`
        fixed top-0 left-0 z-20 h-screen
        bg-gradient-to-b from-[#5a3e2e] to-[#3d2a1e]
        text-[#f5efe6] transition-all duration-300 flex-col shadow-xl
        hidden md:flex
        ${isOpen ? 'w-72' : 'w-20'}
      `}>
        {/* Cabecera */}
        <div className="p-4 border-b border-[#8b6b54] flex items-center justify-between">
          <button
            onClick={onToggle}
            className="hover:bg-[#8b6b54] p-2 rounded-lg transition-colors"
            title={isOpen ? 'Contraer menú' : 'Expandir menú'}
          >
            <span className="text-2xl">☕</span>
          </button>
          {isOpen && (
            <div className="text-right">
              <span className="font-bold text-lg tracking-widest block">Admin</span>
              <span className="text-xs text-[#d4c4a8]">Comité de Cafeteros</span>
            </div>
          )}
        </div>

        {/* Perfil */}
        {isOpen ? (
          <div className="p-4 border-b border-[#8b6b54] bg-[#4a3222]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center text-xl">
                ⚙️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Administrador</p>
                <p className="text-xs text-[#d4c4a8] truncate">Panel de control</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-b border-[#8b6b54] flex justify-center">
            <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center text-xl">
              ⚙️
            </div>
          </div>
        )}

        {/* Menú */}
        <div className="flex-1 py-4 overflow-y-auto">
          {menuItems.map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full p-3 flex items-center gap-3 transition-all duration-200
                  hover:bg-[#8b6b54] group relative
                  ${isActive ? 'bg-[#d4c4a8] text-[#4a3222]' : ''}
                `}
                title={!isOpen ? item.label : ''}
              >
                <span className="text-xl flex-shrink-0">{item.icono}</span>
                {isOpen && (
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isActive ? 'text-[#4a3222]' : 'text-[#f5efe6]'}`}>{item.label}</p>
                    <p className="text-xs text-[#d4c4a8] opacity-75">{item.descripcion}</p>
                  </div>
                )}
                {!isOpen && (
                  <div className="absolute left-16 bg-[#3d2a1e] text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Cerrar sesión */}
        <div className="border-t border-[#8b6b54]">
          <button
            onClick={onLogout}
            className="w-full p-4 flex items-center gap-3 hover:bg-[#8b6b54] transition-colors group relative"
            title={!isOpen ? 'Cerrar sesión' : ''}
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {isOpen && <span>Cerrar sesión</span>}
            {!isOpen && (
              <div className="absolute left-16 bg-[#3d2a1e] text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                Cerrar sesión
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
function DashboardAdmin() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    totalEvidencias: 0,
    evidenciasPendientes: 0,
    totalPadrinos: 0,
    totalNiveles: 0,
    totalRetos: 0
  })
  const [loading, setLoading] = useState(true)

  const cargarEstadisticas = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { count: estudiantesCount },
        { count: evidenciasCount },
        { count: pendientesCount },
        { count: padrinosCount },
        { count: nivelesCount },
        { count: retosCount }
      ] = await Promise.all([
        supabase.from('estudiantes').select('*', { count: 'exact', head: true }),
        supabase.from('evidencias').select('*', { count: 'exact', head: true }),
        supabase.from('evidencias').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('padrinos').select('*', { count: 'exact', head: true }),
        supabase.from('niveles').select('*', { count: 'exact', head: true }),
        supabase.from('retos').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        totalEstudiantes: estudiantesCount || 0,
        totalEvidencias: evidenciasCount || 0,
        evidenciasPendientes: pendientesCount || 0,
        totalPadrinos: padrinosCount || 0,
        totalNiveles: nivelesCount || 0,
        totalRetos: retosCount || 0
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      toast.error('Error al cargar estadísticas')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarEstadisticas()
  }, [cargarEstadisticas])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }, [logout, navigate])

  const tabTitles = {
    dashboard: { titulo: '📊 Resumen General', sub: 'Estadísticas y actividad reciente de la plataforma' },
    niveles: { titulo: '📚 Niveles', sub: 'Crea y gestiona los niveles del programa' },
    retos: { titulo: '🎯 Retos', sub: 'Administra los retos de cada nivel' },
    estudiantes: { titulo: '👨‍🎓 Estudiantes', sub: 'Listado y gestión de estudiantes registrados' },
    padrinos: { titulo: '👥 Padrinos', sub: 'Gestiona los padrinos colaboradores' },
    reportes: { titulo: '📄 Reportes', sub: 'Exporta datos del programa a Excel' },
  }

  const current = tabTitles[activeTab]

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <SidebarAdmin
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} pb-16 md:pb-0`}>
        <div className="min-h-screen overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {/* Encabezado de sección */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222]">{current.titulo}</h1>
              <p className="text-sm text-[#a68a64] mt-1">{current.sub}</p>
            </div>

            {/* Contenido dinámico */}
            {activeTab === 'dashboard' && (
              <DashboardStats stats={stats} loading={loading} onRefresh={cargarEstadisticas} />
            )}
            {activeTab === 'niveles' && <NivelesManager />}
            {activeTab === 'retos' && <RetosManager />}
            {activeTab === 'estudiantes' && <EstudiantesManager />}
            {activeTab === 'padrinos' && <PadrinosManager />}
            {activeTab === 'reportes' && <ReportesExport />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ESTADÍSTICAS DEL DASHBOARD
// ============================================
function DashboardStats({ stats, loading, onRefresh }) {
  const [actividadReciente, setActividadReciente] = useState([])
  const [loadingActividad, setLoadingActividad] = useState(true)

  useEffect(() => {
    cargarActividadReciente()
  }, [])

  async function cargarActividadReciente() {
    setLoadingActividad(true)

    const { data: evidencias } = await supabase
      .from('evidencias')
      .select('*')
      .order('fecha_envio', { ascending: false })
      .limit(10)

    if (!evidencias) { setLoadingActividad(false); return }

    const ids = [...new Set(evidencias.map(e => e.estudiante_id).filter(Boolean))]
    const { data: estudiantes } = ids.length
      ? await supabase
          .from('estudiantes')
          .select('id, nombre_completo, municipios(nombre), instituciones(nombre)')
          .in('id', ids)
      : { data: [] }

    const map = Object.fromEntries((estudiantes || []).map(e => [e.id, e]))
    setActividadReciente(evidencias.map(ev => ({ ...ev, estudiante: map[ev.estudiante_id] || null })))
    setLoadingActividad(false)
  }

  const cards = [
    { titulo: 'Estudiantes', valor: stats.totalEstudiantes, color: 'bg-[#6b4c3a]', icono: '👨‍🎓', descripcion: 'Registrados' },
    { titulo: 'Evidencias', valor: stats.totalEvidencias, color: 'bg-[#8b6b54]', icono: '📝', descripcion: 'Total enviadas' },
    { titulo: 'Pendientes', valor: stats.evidenciasPendientes, color: 'bg-amber-600', icono: '⏳', descripcion: 'Por revisar' },
    { titulo: 'Padrinos', valor: stats.totalPadrinos, color: 'bg-[#5a3e2e]', icono: '👥', descripcion: 'Colaboradores' },
    { titulo: 'Niveles', valor: stats.totalNiveles, color: 'bg-[#4a3222]', icono: '📚', descripcion: 'Creados' },
    { titulo: 'Retos', valor: stats.totalRetos, color: 'bg-[#3d2a1e]', icono: '🎯', descripcion: 'Activos' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-6 animate-pulse">
            <div className="h-4 bg-[#e8dcca] rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-[#f5efe6] rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-[#e8dcca] rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[#4a3222]">Estadísticas generales</h2>
        <button
          onClick={onRefresh}
          className="text-[#6b4c3a] hover:text-[#4a3222] text-sm flex items-center gap-1 font-medium"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-md border border-[#e8dcca] hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a68a64] text-sm font-medium">{card.titulo}</p>
                  <p className="text-3xl font-bold text-[#4a3222] mt-1">{card.valor}</p>
                  <p className="text-xs text-[#a68a64] mt-2">{card.descripcion}</p>
                </div>
                <div className={`${card.color} w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {card.icono}
                </div>
              </div>
            </div>
            <div className={`h-1 ${card.color}`}></div>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8dcca] bg-[#f5efe6]">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-[#4a3222] flex items-center gap-2">
              <span>🕐</span> Actividad Reciente
            </h2>
            <span className="text-xs text-[#a68a64]">Últimas 10 evidencias</span>
          </div>
        </div>

        {loadingActividad ? (
          <div className="p-8 text-center text-[#a68a64]">Cargando actividad...</div>
        ) : actividadReciente.length === 0 ? (
          <div className="p-8 text-center text-[#a68a64]">
            <span className="text-4xl block mb-2">📭</span>
            No hay actividad reciente
          </div>
        ) : (
          <div className="divide-y divide-[#e8dcca]">
            {actividadReciente.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-[#f5efe6] transition flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[#4a3222]">{ev.estudiante?.nombre_completo || 'Estudiante'}</p>
                    <span className="text-xs text-[#a68a64]">•</span>
                    <p className="text-sm text-[#a68a64]">{ev.estudiante?.municipios?.nombre || 'N/A'}</p>
                    <span className="text-xs text-[#a68a64]">•</span>
                    <p className="text-sm text-[#a68a64]">{ev.estudiante?.instituciones?.nombre || 'N/A'}</p>
                  </div>
                  <p className="text-xs text-[#a68a64] mt-1">
                    Reto ID: {ev.reto_id} · Enviado el {new Date(ev.fecha_envio).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ev.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                  ev.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ev.estado === 'pendiente' && '⏳ Pendiente'}
                  {ev.estado === 'aprobado' && '✅ Aprobado'}
                  {ev.estado === 'rechazado' && '❌ Rechazado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardAdmin
