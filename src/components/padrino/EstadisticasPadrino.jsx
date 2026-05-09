import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

export function EstadisticasPadrino() {
  const [loading, setLoading] = useState(true)
  const [rawData, setRawData] = useState({
    totalEstudiantes: 0,
    evidencias: [],
    estudiantesPorGrado: []
  })

  const cargarEstadisticas = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { count: totalEstudiantes },
        { data: evidencias },
        { data: estudiantesPorGrado }
      ] = await Promise.all([
        supabase.from('estudiantes').select('*', { count: 'exact', head: true }),
        supabase.from('evidencias').select('estado, puntuacion, fecha_envio'),
        supabase.from('estudiantes').select('grado, id')
      ])

      setRawData({
        totalEstudiantes: totalEstudiantes || 0,
        evidencias: evidencias || [],
        estudiantesPorGrado: estudiantesPorGrado || []
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarEstadisticas()
  }, [cargarEstadisticas])

  const stats = useMemo(() => {
    const { totalEstudiantes, evidencias, estudiantesPorGrado } = rawData

    const totalEvidencias = evidencias.length
    const evidenciasPendientes = evidencias.filter(e => e.estado === 'pendiente').length
    const evidenciasAprobadas = evidencias.filter(e => e.estado === 'aprobado').length
    const evidenciasRechazadas = evidencias.filter(e => e.estado === 'rechazado').length

    const puntuaciones = evidencias.filter(e => e.estado === 'aprobado').map(e => e.puntuacion)
    const promedioPuntuacion = puntuaciones.length > 0
      ? Math.round(puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length)
      : 0

    const progresoPorGrado = {}
    estudiantesPorGrado.forEach(e => {
      if (!progresoPorGrado[e.grado]) progresoPorGrado[e.grado] = { total: 0 }
      progresoPorGrado[e.grado].total++
    })

    const meses = {}
    const hoy = new Date()
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`
      meses[key] = { mes: fecha.toLocaleString('es-CO', { month: 'short', year: 'numeric' }), cantidad: 0 }
    }
    evidencias.forEach(e => {
      const fecha = new Date(e.fecha_envio)
      const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`
      if (meses[key]) meses[key].cantidad++
    })
    const evidenciasPorMes = Object.values(meses).reverse()

    return {
      totalEstudiantes,
      totalEvidencias,
      evidenciasPendientes,
      evidenciasAprobadas,
      evidenciasRechazadas,
      promedioPuntuacion,
      progresoPorGrado,
      evidenciasPorMes
    }
  }, [rawData])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">📊</div>
          <p className="text-[#a68a64]">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  const pct = (n) => Math.round((n / (stats.totalEvidencias || 1)) * 100)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
          📈 Estadísticas Generales
        </h1>
        <p className="text-[#a68a64] mt-1">Resumen del progreso de los estudiantes</p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Estudiantes</p>
              <p className="text-3xl font-bold">{stats.totalEstudiantes}</p>
            </div>
            <span className="text-4xl">👨‍🎓</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Total Evidencias</p>
              <p className="text-3xl font-bold">{stats.totalEvidencias}</p>
            </div>
            <span className="text-4xl">📝</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Promedio Puntuación</p>
              <p className="text-3xl font-bold">{stats.promedioPuntuacion}</p>
            </div>
            <span className="text-4xl">⭐</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Pendientes</p>
              <p className="text-3xl font-bold">{stats.evidenciasPendientes}</p>
            </div>
            <span className="text-4xl">⏳</span>
          </div>
        </div>
      </div>

      {/* Estado de evidencias + Evidencias por mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
          <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">
            <span>📊</span> Estado de Evidencias
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Aprobadas', count: stats.evidenciasAprobadas, color: 'bg-green-500', text: 'text-green-700' },
              { label: 'Rechazadas', count: stats.evidenciasRechazadas, color: 'bg-red-500', text: 'text-red-700' },
              { label: 'Pendientes', count: stats.evidenciasPendientes, color: 'bg-yellow-500', text: 'text-yellow-700' }
            ].map(({ label, count, color, text }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={text + ' font-medium'}>{label}</span>
                  <span className="text-[#6b4c3a]">{count} <span className="text-[#a68a64]">({pct(count)}%)</span></span>
                </div>
                <div className="w-full bg-[#e8dcca] rounded-full h-2.5">
                  <div
                    className={`${color} h-2.5 rounded-full transition-all duration-700`}
                    style={{ width: `${pct(count)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
          <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">
            <span>📈</span> Evidencias por Mes
          </h2>
          <div className="space-y-3">
            {stats.evidenciasPorMes.map((item, idx) => {
              const maxMes = Math.max(...stats.evidenciasPorMes.map(m => m.cantidad), 1)
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#a68a64]">{item.mes}</span>
                    <span className="text-[#6b4c3a] font-medium">{item.cantidad}</span>
                  </div>
                  <div className="w-full bg-[#e8dcca] rounded-full h-2.5">
                    <div
                      className="bg-[#6b4c3a] h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${(item.cantidad / maxMes) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Progreso por grado */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
        <h2 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center gap-2">
          <span>📚</span> Distribución por Grado
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[4, 5, 6, 7, 8, 9, 10, 11].map(grado => {
            const data = stats.progresoPorGrado[grado] || { total: 0 }
            const maxGrado = Math.max(...[4,5,6,7,8,9,10,11].map(g => stats.progresoPorGrado[g]?.total || 0), 1)
            return (
              <div key={grado} className="text-center p-4 bg-[#f5efe6] rounded-xl border border-[#e8dcca]">
                <p className="text-2xl font-bold text-[#4a3222]">{grado}°</p>
                <p className="text-xl font-semibold text-[#6b4c3a] mt-1">{data.total}</p>
                <p className="text-xs text-[#a68a64]">estudiantes</p>
                <div className="mt-2 w-full bg-[#e8dcca] rounded-full h-1.5">
                  <div
                    className="bg-[#6b4c3a] h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${(data.total / maxGrado) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
