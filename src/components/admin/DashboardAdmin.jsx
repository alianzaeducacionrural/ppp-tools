import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { NivelesManager } from './NivelesManager'
import { RetosManager } from './RetosManager'
import { EstudiantesManager } from './EstudiantesManager'
import { PadrinosManager } from './PadrinosManager'
import { ReportesExport } from './ReportesExport'

export function DashboardAdmin() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    totalEvidencias: 0,
    evidenciasPendientes: 0,
    totalPadrinos: 0,
    totalNiveles: 0,
    totalRetos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  async function cargarEstadisticas() {
    setLoading(true)

    try {
      // Total estudiantes
      const { count: estudiantesCount } = await supabase
        .from('estudiantes')
        .select('*', { count: 'exact', head: true })

      // Total evidencias
      const { count: evidenciasCount } = await supabase
        .from('evidencias')
        .select('*', { count: 'exact', head: true })

      // Evidencias pendientes
      const { count: pendientesCount } = await supabase
        .from('evidencias')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Total padrinos
      const { count: padrinosCount } = await supabase
        .from('padrinos')
        .select('*', { count: 'exact', head: true })

      // Total niveles
      const { count: nivelesCount } = await supabase
        .from('niveles')
        .select('*', { count: 'exact', head: true })

      // Total retos
      const { count: retosCount } = await supabase
        .from('retos')
        .select('*', { count: 'exact', head: true })

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
    }

    setLoading(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const tabs = [
    { id: 'dashboard', nombre: 'Dashboard', icono: '📊' },
    { id: 'niveles', nombre: 'Niveles', icono: '📚' },
    { id: 'retos', nombre: 'Retos', icono: '🎯' },
    { id: 'estudiantes', nombre: 'Estudiantes', icono: '👨‍🎓' },
    { id: 'padrinos', nombre: 'Padrinos', icono: '👥' },
    { id: 'reportes', nombre: 'Reportes', icono: '📄' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>☕</span>
                Panel de Administración
              </h1>
              <p className="text-green-100 text-sm mt-1">Gestión completa de la plataforma PPP Tools</p>
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

      {/* Tabs de navegación */}
      <div className="border-b bg-white sticky top-[73px] z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 font-medium rounded-lg transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700 border-b-2 border-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icono}</span>
                {tab.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido dinámico */}
      <div className="container mx-auto px-4 py-8">
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
  )
}

// Componente de estadísticas del dashboard
function DashboardStats({ stats, loading, onRefresh }) {
  const [actividadReciente, setActividadReciente] = useState([])
  const [loadingActividad, setLoadingActividad] = useState(true)

  useEffect(() => {
    cargarActividadReciente()
  }, [])

  async function cargarActividadReciente() {
    const { data } = await supabase
      .from('evidencias')
      .select(`
        *,
        estudiante:estudiante_id (nombre_completo, municipio, institucion)
      `)
      .order('fecha_envio', { ascending: false })
      .limit(10)

    if (data) setActividadReciente(data)
    setLoadingActividad(false)
  }

  const cards = [
    { 
      titulo: 'Estudiantes', 
      valor: stats.totalEstudiantes, 
      color: 'bg-blue-500', 
      icono: '👨‍🎓',
      descripcion: 'Estudiantes registrados'
    },
    { 
      titulo: 'Evidencias', 
      valor: stats.totalEvidencias, 
      color: 'bg-purple-500', 
      icono: '📝',
      descripcion: 'Total enviadas'
    },
    { 
      titulo: 'Pendientes', 
      valor: stats.evidenciasPendientes, 
      color: 'bg-yellow-500', 
      icono: '⏳',
      descripcion: 'Por revisar'
    },
    { 
      titulo: 'Padrinos', 
      valor: stats.totalPadrinos, 
      color: 'bg-green-500', 
      icono: '👥',
      descripcion: 'Colaboradores'
    },
    { 
      titulo: 'Niveles', 
      valor: stats.totalNiveles, 
      color: 'bg-indigo-500', 
      icono: '📚',
      descripcion: 'Creados'
    },
    { 
      titulo: 'Retos', 
      valor: stats.totalRetos, 
      color: 'bg-pink-500', 
      icono: '🎯',
      descripcion: 'Activos'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Resumen General</h2>
        <button
          onClick={onRefresh}
          className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{card.titulo}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{card.valor}</p>
                  <p className="text-xs text-gray-400 mt-2">{card.descripcion}</p>
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span>🕐</span> Actividad Reciente
            </h2>
            <span className="text-xs text-gray-400">Últimas 10 evidencias</span>
          </div>
        </div>
        
        {loadingActividad ? (
          <div className="p-8 text-center text-gray-500">Cargando actividad...</div>
        ) : actividadReciente.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <span className="text-4xl block mb-2">📭</span>
            No hay actividad reciente
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {actividadReciente.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800">{ev.estudiante?.nombre_completo || 'Estudiante'}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-sm text-gray-500">{ev.estudiante?.municipio || 'N/A'}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-sm text-gray-500">{ev.estudiante?.institucion || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Reto ID: {ev.reto_id} - Enviado el {new Date(ev.fecha_envio).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ev.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    ev.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ev.estado === 'pendiente' && '⏳ Pendiente'}
                    {ev.estado === 'aprobado' && '✅ Aprobado'}
                    {ev.estado === 'rechazado' && '❌ Rechazado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}