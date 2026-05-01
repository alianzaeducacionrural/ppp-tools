import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { obtenerRango } from '../../data/rangos'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'

export function RankingEstudiante({ estudiante }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (estudiante) {
      cargarRanking()
    }
  }, [estudiante])

  async function cargarRanking() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('estudiantes')
      .select(`
        id,
        nombre_completo,
        puntuacion_total,
        avatar_id,
        grado,
        tipo_proyecto,
        instituciones (nombre),
        municipios (nombre)
      `)
      .eq('grado', estudiante.grado)
      .eq('tipo_proyecto', estudiante.tipo_proyecto)
      .order('puntuacion_total', { ascending: false })

    if (error) {
      console.error('Error cargando ranking:', error)
    } else if (data) {
      setRanking(data)
    }
    
    setLoading(false)
  }

  const obtenerMedalla = (pos) => {
    if (pos === 0) return '🥇'
    if (pos === 1) return '🥈'
    if (pos === 2) return '🥉'
    return `${pos + 1}.`
  }

  const posicionEstudiante = ranking.findIndex(r => r.id === estudiante?.id)
  const rangoEstudiante = obtenerRango(estudiante?.puntuacion_total || 0, estudiante?.tipo_proyecto || 'cafe')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-xl shadow-md p-5 text-white animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-white/20 rounded w-1/4"></div>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
          <div className="p-8 text-center text-[#a68a64]">Cargando ranking...</div>
        </div>
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-xl shadow-md p-5 text-white">
          <p className="text-sm opacity-90">Tu posición</p>
          <p className="text-3xl font-bold">#1</p>
          <p className="text-sm opacity-90 mt-1">de 1 estudiante</p>
          <p className="text-xs opacity-75 mt-2">⭐ {estudiante?.puntuacion_total || 0} puntos acumulados</p>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
          <div className="p-8 text-center text-[#a68a64]">
            <p className="text-lg">📊</p>
            <p>Eres el primer estudiante en {estudiante?.grado}°</p>
            <p className="text-sm mt-2">¡Sigue así! 🎯</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tu posición */}
      <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-xl shadow-md p-5 text-white">
        <p className="text-sm opacity-90">Tu posición</p>
        <p className="text-3xl font-bold">#{posicionEstudiante !== -1 ? posicionEstudiante + 1 : '?'}</p>
        <p className="text-sm opacity-90 mt-1">de {ranking.length} estudiantes</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">{rangoEstudiante.emoji}</span>
          <span className="text-xs opacity-75">{rangoEstudiante.nombre}</span>
        </div>
        <p className="text-xs opacity-75 mt-1">⭐ {estudiante?.puntuacion_total || 0} puntos acumulados</p>
      </div>

      {/* Tabla de ranking */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f5efe6]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#4a3222]">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#4a3222]">Estudiante</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#4a3222]">Institución</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#4a3222]">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((est, idx) => {
                const avatar = getAvatarById(est?.avatar_id || 1)
                const esActual = est.id === estudiante?.id
                return (
                  <tr key={est.id} className={`border-t border-[#e8dcca] ${esActual ? 'bg-[#f5efe6]' : ''}`}>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {obtenerMedalla(idx)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden">
                          <Avatar avatar={avatar} size="sm" />
                        </div>
                        <div>
                          <div className="font-medium text-[#4a3222]">{est.nombre_completo}</div>
                          <div className="text-xs text-[#a68a64]">{est.municipios?.nombre || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b4c3a]">{est.instituciones?.nombre || 'N/A'}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#6b4c3a]">{est.puntuacion_total || 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mensaje motivacional */}
      {posicionEstudiante > 2 && (
        <div className="bg-[#f5efe6] rounded-xl p-4 text-center border border-[#e8dcca]">
          <p className="text-sm text-[#6b4c3a]">
            💪 ¡Sigue completando retos! Te faltan {posicionEstudiante - 2} posiciones para entrar al podio.
          </p>
        </div>
      )}
    </div>
  )
}