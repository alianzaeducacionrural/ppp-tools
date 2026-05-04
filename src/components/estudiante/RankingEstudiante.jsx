import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'
import { obtenerRango } from '../../data/rangos'

export function RankingEstudiante({ estudiante }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (estudiante) {
      cargarRanking()
    }
  }, [estudiante])

  async function cargarRanking() {
    setLoading(true)
    
    // Consultar estudiantes del mismo grado y mismo tipo de proyecto
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
      // Verificar si el estudiante entró al podio por primera vez
      const posicion = data.findIndex(r => r.id === estudiante.id)
      if (posicion >= 0 && posicion < 3 && localStorage.getItem('confetti-shown') !== estudiante.id) {
        setShowConfetti(true)
        localStorage.setItem('confetti-shown', estudiante.id)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }
    
    setLoading(false)
  }

  const posicionEstudiante = ranking.findIndex(r => r.id === estudiante?.id)
  const top3 = ranking.slice(0, 3)
  const resto = ranking.slice(3)

  const obtenerMedalla = (pos) => {
    if (pos === 0) return { icono: '🥇', nombre: 'Oro', color: 'text-yellow-500', fondo: 'from-yellow-100 to-yellow-50' }
    if (pos === 1) return { icono: '🥈', nombre: 'Plata', color: 'text-gray-400', fondo: 'from-gray-100 to-gray-50' }
    if (pos === 2) return { icono: '🥉', nombre: 'Bronce', color: 'text-amber-600', fondo: 'from-amber-100 to-amber-50' }
    return null
  }

  const puntosFaltantes = () => {
    if (posicionEstudiante <= 0) return 0
    const arriba = ranking[posicionEstudiante - 1]
    const actual = ranking[posicionEstudiante]
    return arriba.puntuacion_total - actual.puntuacion_total
  }

  const rangoEstudiante = obtenerRango(estudiante?.puntuacion_total || 0, estudiante?.tipo_proyecto || 'cafe')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-2xl p-6 text-white animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-white/20 rounded w-1/4"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-[#e8dcca] animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-2xl shadow-xl p-6 text-white">
          <p className="text-sm opacity-90">Tu posición</p>
          <p className="text-3xl font-bold">#1</p>
          <p className="text-sm opacity-90 mt-1">de 1 estudiante</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg">{rangoEstudiante.emoji}</span>
            <span className="text-xs opacity-75">{rangoEstudiante.nombre}</span>
          </div>
          <p className="text-xs opacity-75 mt-1">⭐ {estudiante?.puntuacion_total || 0} puntos acumulados</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#e8dcca] p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-[#a68a64] text-lg">Eres el primer estudiante en {estudiante?.grado}°</p>
          <p className="text-sm text-[#a68a64] mt-2">¡Sigue así! 🎯</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce">🎉🏆🎉</div>
        </div>
      )}

      {/* Tarjeta de tu posición */}
      <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 text-6xl opacity-10">🏆</div>
        <p className="text-sm opacity-90 flex items-center gap-2">
          <span className="text-xl">📊</span> Tu posición en {estudiante?.grado}° - {estudiante?.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
        </p>
        <div className="flex items-baseline gap-4 mt-2 flex-wrap">
          <p className="text-5xl font-bold">#{posicionEstudiante !== -1 ? posicionEstudiante + 1 : '?'}</p>
          <p className="text-lg opacity-90">de {ranking.length} estudiantes</p>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold">{estudiante?.puntuacion_total || 0}</p>
            <p className="text-xs opacity-75">puntos acumulados</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">{rangoEstudiante.emoji}</span>
          <span className="text-xs opacity-75">{rangoEstudiante.nombre}</span>
        </div>
        
        {/* Barra de progreso hacia el próximo puesto */}
        {posicionEstudiante > 0 && puntosFaltantes() > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs opacity-75 mb-1">
              <span>📈 Progreso al siguiente puesto</span>
              <span>⬆️ {puntosFaltantes()} pts para superar</span>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: '0%' }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* PODIO - Top 3 destacado */}
      {top3.length > 0 && (
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-[#4a3222] mb-4 flex items-center justify-center gap-2">
            <span>🏆</span> Podio de Campeones <span>🏆</span>
          </h3>
          <div className="flex flex-col md:flex-row justify-center items-end gap-4">
            {/* Segundo lugar */}
            {top3[1] && (
              <div className="order-1 md:order-1 w-full md:w-72 text-center transform transition-all duration-300 hover:scale-105">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl shadow-lg border-4 border-gray-300 overflow-hidden">
                    <Avatar avatar={getAvatarById(top3[1]?.avatar_id || 1)} size="xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-3xl">🥈</div>
                </div>
                <div className="mt-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-3 shadow-md">
                  <p className="font-bold text-[#4a3222]">{top3[1]?.nombre_completo}</p>
                  <p className="text-2xl font-bold text-[#6b4c3a]">{top3[1]?.puntuacion_total}</p>
                  <p className="text-xs text-[#a68a64]">pts</p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-[#a68a64] flex items-center justify-center gap-1">
                      <span>📍</span> {top3[1]?.municipios?.nombre || 'N/A'}
                    </p>
                    <p className="text-xs text-[#a68a64] flex items-center justify-center gap-1 mt-0.5">
                      <span>🏫</span> {top3[1]?.instituciones?.nombre?.split(' ').slice(0, 2).join(' ') || 'N/A'}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-500 mt-1">2° Lugar</p>
              </div>
            )}

            {/* Primer lugar (más grande, centrado) */}
            {top3[0] && (
              <div className={`order-0 md:order-2 w-full md:w-80 text-center transform transition-all duration-300 hover:scale-105 ${estudiante?.id === top3[0]?.id ? 'ring-4 ring-yellow-400 rounded-2xl' : ''}`}>
                <div className="relative">
                  <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center text-5xl shadow-xl border-4 border-yellow-400 overflow-hidden">
                    <Avatar avatar={getAvatarById(top3[0]?.avatar_id || 1)} size="xl" />
                  </div>
                  <div className="absolute -top-3 -right-1 text-4xl animate-bounce">👑</div>
                </div>
                <div className="mt-3 bg-gradient-to-r from-yellow-100 to-amber-50 rounded-xl p-3 shadow-lg">
                  <p className="font-bold text-lg text-[#4a3222]">{top3[0]?.nombre_completo}</p>
                  <p className="text-3xl font-bold text-[#6b4c3a]">{top3[0]?.puntuacion_total}</p>
                  <p className="text-xs text-[#a68a64]">pts</p>
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <p className="text-xs text-[#a68a64] flex items-center justify-center gap-1">
                      <span>📍</span> {top3[0]?.municipios?.nombre || 'N/A'}
                    </p>
                    <p className="text-xs text-[#a68a64] flex items-center justify-center gap-1 mt-0.5">
                      <span>🏫</span> {top3[0]?.instituciones?.nombre || 'N/A'}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-yellow-600 mt-1">🥇 CAMPEÓN 🥇</p>
              </div>
            )}

            {/* Tercer lugar */}
            {top3[2] && (
              <div className="order-2 md:order-3 w-full md:w-72 text-center transform transition-all duration-300 hover:scale-105">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-4xl shadow-lg border-4 border-amber-300 overflow-hidden">
                    <Avatar avatar={getAvatarById(top3[2]?.avatar_id || 1)} size="xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-3xl">🥉</div>
                </div>
                <div className="mt-3 bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl p-3 shadow-md">
                  <p className="font-bold text-[#4a3222]">{top3[2]?.nombre_completo}</p>
                  <p className="text-2xl font-bold text-[#6b4c3a]">{top3[2]?.puntuacion_total}</p>
                  <p className="text-xs text-[#a68a64]">pts</p>
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs text-[#a68a64] flex items-center justify-center gap-1">
                      <span>📍</span> {top3[2]?.municipios?.nombre || 'N/A'}
                    </p>
                    <p className="text-xs text-[#a68a64] flex items-center justify-center gap-1 mt-0.5">
                      <span>🏫</span> {top3[2]?.instituciones?.nombre?.split(' ').slice(0, 2).join(' ') || 'N/A'}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-amber-600 mt-1">3° Lugar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista del resto de participantes */}
      {resto.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-[#4a3222] mb-3 flex items-center gap-2">
            <span>📋</span> Otros participantes
          </h3>
          <div className="space-y-2">
            {resto.map((est, idx) => {
              const pos = idx + 4
              const avatar = getAvatarById(est?.avatar_id || 1)
              const esActual = est.id === estudiante?.id
              return (
                <div 
                  key={est.id} 
                  className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
                    esActual ? 'border-[#6b4c3a] bg-[#f5efe6]' : 'border-[#e8dcca]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 text-center font-bold text-[#6b4c3a] text-lg">
                        {pos}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden shadow-sm">
                        <Avatar avatar={avatar} size="md" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#4a3222]">{est.nombre_completo}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#a68a64] mt-0.5">
                          <span className="flex items-center gap-1">📍 {est.municipios?.nombre || 'N/A'}</span>
                          <span className="flex items-center gap-1">🏫 {est.instituciones?.nombre || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right sm:text-left pl-14 sm:pl-0">
                      <p className="font-bold text-[#6b4c3a] text-lg">{est.puntuacion_total}</p>
                      <p className="text-xs text-[#a68a64]">puntos</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mensaje motivacional */}
      {posicionEstudiante > 2 && (
        <div className="bg-gradient-to-r from-[#f5efe6] to-[#e8dcca] rounded-xl p-4 text-center border border-[#e8dcca]">
          <p className="text-sm text-[#6b4c3a]">
            💪 ¡Sigue completando retos! Te faltan <strong>{posicionEstudiante - 2}</strong> posiciones para entrar al podio.
          </p>
          {puntosFaltantes() > 0 && (
            <p className="text-xs text-[#a68a64] mt-1">
              📈 Te separan <strong>{puntosFaltantes()} puntos</strong> del siguiente puesto.
            </p>
          )}
        </div>
      )}
    </div>
  )
}