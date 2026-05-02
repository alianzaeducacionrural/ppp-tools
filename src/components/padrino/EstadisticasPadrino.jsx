import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { SidebarPadrino } from './SidebarPadrino'

export function EstadisticasPadrino() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    totalEvidencias: 0,
    evidenciasPendientes: 0,
    evidenciasAprobadas: 0,
    evidenciasRechazadas: 0,
    promedioPuntuacion: 0,
    progresoPorGrado: {},
    evidenciasPorMes: []
  })

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  async function cargarEstadisticas() {
    setLoading(true)

    try {
      // Total estudiantes
      const { count: totalEstudiantes } = await supabase
        .from('estudiantes')
        .select('*', { count: 'exact', head: true })

      // Total evidencias
      const { data: evidencias } = await supabase
        .from('evidencias')
        .select('estado, puntuacion, fecha_envio')

      const totalEvidencias = evidencias?.length || 0
      const evidenciasPendientes = evidencias?.filter(e => e.estado === 'pendiente').length || 0
      const evidenciasAprobadas = evidencias?.filter(e => e.estado === 'aprobado').length || 0
      const evidenciasRechazadas = evidencias?.filter(e => e.estado === 'rechazado').length || 0
      
      const puntuaciones = evidencias?.filter(e => e.estado === 'aprobado').map(e => e.puntuacion) || []
      const promedioPuntuacion = puntuaciones.length > 0 
        ? Math.round(puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length) 
        : 0

      // Progreso por grado
      const { data: estudiantesPorGrado } = await supabase
        .from('estudiantes')
        .select('grado, id')
      
      const progresoPorGrado = {}
      estudiantesPorGrado?.forEach(e => {
        if (!progresoPorGrado[e.grado]) {
          progresoPorGrado[e.grado] = { total: 0, completados: 0 }
        }
        progresoPorGrado[e.grado].total++
      })

      // Evidencias por mes (últimos 6 meses)
      const meses = {}
      const hoy = new Date()
      for (let i = 0; i < 6; i++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`
        meses[key] = { mes: fecha.toLocaleString('es-CO', { month: 'short', year: 'numeric' }), cantidad: 0 }
      }
      
      evidencias?.forEach(e => {
        const fecha = new Date(e.fecha_envio)
        const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`
        if (meses[key]) {
          meses[key].cantidad++
        }
      })
      
      const evidenciasPorMes = Object.values(meses).reverse()

      setStats({
        totalEstudiantes: totalEstudiantes || 0,
        totalEvidencias,
        evidenciasPendientes,
        evidenciasAprobadas,
        evidenciasRechazadas,
        promedioPuntuacion,
        progresoPorGrado,
        evidenciasPorMes
      })

    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">📊</div>
          <p className="text-[#a68a64]">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
            📈 Estadísticas Generales
          </h1>
          <p className="text-[#a68a64] mt-1">Resumen del progreso de los estudiantes</p>
        </div>

        {/* Tarjetas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Estudiantes</p>
                <p className="text-3xl font-bold">{stats.totalEstudiantes}</p>
              </div>
              <span className="text-4xl">👨‍🎓</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Total Evidencias</p>
                <p className="text-3xl font-bold">{stats.totalEvidencias}</p>
              </div>
              <span className="text-4xl">📝</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Promedio Puntuación</p>
                <p className="text-3xl font-bold">{stats.promedioPuntuacion}</p>
              </div>
              <span className="text-4xl">⭐</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Pendientes</p>
                <p className="text-3xl font-bold">{stats.evidenciasPendientes}</p>
              </div>
              <span className="text-4xl">⏳</span>
            </div>
          </div>
        </div>

        {/* Estado de evidencias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
            <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">
              <span>📊</span> Estado de Evidencias
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600">Aprobadas</span>
                  <span>{stats.evidenciasAprobadas} ({Math.round((stats.evidenciasAprobadas / stats.totalEvidencias) * 100) || 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.evidenciasAprobadas / stats.totalEvidencias) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600">Rechazadas</span>
                  <span>{stats.evidenciasRechazadas} ({Math.round((stats.evidenciasRechazadas / stats.totalEvidencias) * 100) || 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.evidenciasRechazadas / stats.totalEvidencias) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-600">Pendientes</span>
                  <span>{stats.evidenciasPendientes} ({Math.round((stats.evidenciasPendientes / stats.totalEvidencias) * 100) || 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.evidenciasPendientes / stats.totalEvidencias) * 100 || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
            <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">
              <span>📈</span> Evidencias por Mes
            </h2>
            <div className="space-y-2">
              {stats.evidenciasPorMes.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#a68a64]">{item.mes}</span>
                    <span className="text-[#6b4c3a] font-medium">{item.cantidad}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#6b4c3a] h-2 rounded-full" style={{ width: `${Math.min((item.cantidad / 20) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progreso por grado */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
          <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">
            <span>📚</span> Progreso por Grado
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[4,5,6,7,8,9,10,11].map(grado => {
              const data = stats.progresoPorGrado[grado] || { total: 0 }
              return (
                <div key={grado} className="text-center p-3 bg-[#f5efe6] rounded-lg">
                  <p className="text-2xl font-bold text-[#4a3222]">{grado}°</p>
                  <p className="text-sm text-[#a68a64]">{data.total} estudiantes</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}