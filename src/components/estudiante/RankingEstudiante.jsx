import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'
import { obtenerRango } from '../../data/rangos'

export function RankingEstudiante({ estudiante }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTimerRef = useRef(null)

  useEffect(() => {
    if (estudiante) cargarRanking()
  }, [estudiante?.id])

  useEffect(() => {
    return () => { if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current) }
  }, [])

  async function cargarRanking() {
    setLoading(true)
    const { data, error } = await supabase
      .from('estudiantes')
      .select('id, nombre_completo, puntuacion_total, avatar_id, grado, tipo_proyecto, instituciones(nombre), municipios(nombre)')
      .eq('grado', estudiante.grado)
      .eq('tipo_proyecto', estudiante.tipo_proyecto)
      .order('puntuacion_total', { ascending: false })

    if (error) {
      console.error('Error cargando ranking:', error)
    } else if (data) {
      setRanking(data)
      const pos = data.findIndex(r => r.id === estudiante.id)
      try {
        if (pos >= 0 && pos < 3 && localStorage.getItem('confetti-shown') !== String(estudiante.id)) {
          setShowConfetti(true)
          localStorage.setItem('confetti-shown', String(estudiante.id))
          confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3000)
        }
      } catch (e) { /* localStorage blocked */ }
    }
    setLoading(false)
  }

  const posicionEstudiante = ranking.findIndex(r => r.id === estudiante?.id)
  const top3 = ranking.slice(0, 3)
  const resto = ranking.slice(3)

  const puntosFaltantes = useMemo(() => {
    if (posicionEstudiante <= 0) return 0
    const arriba = ranking[posicionEstudiante - 1]
    const actual = ranking[posicionEstudiante]
    return arriba ? arriba.puntuacion_total - actual.puntuacion_total : 0
  }, [posicionEstudiante, ranking])

  // Porcentaje real hacia el puesto de arriba
  const porcentajeHaciaArriba = useMemo(() => {
    if (posicionEstudiante <= 0) return 100
    const misPoints = ranking[posicionEstudiante]?.puntuacion_total || 0
    const rivalPoints = ranking[posicionEstudiante - 1]?.puntuacion_total || 0
    if (rivalPoints === 0) return 0
    return Math.min(99, Math.round((misPoints / rivalPoints) * 100))
  }, [posicionEstudiante, ranking])

  const rangoEstudiante = obtenerRango(estudiante?.puntuacion_total || 0, estudiante?.tipo_proyecto || 'cafe')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-[#4a3222] to-[#6b4c3a] rounded-2xl p-5 text-white animate-pulse">
          <div className="h-3 bg-white/20 rounded w-1/3 mb-2" />
          <div className="h-9 bg-white/20 rounded w-1/4" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-[#e8dcca] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#e8dcca] rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-[#e8dcca] rounded w-1/3 mb-2" />
                  <div className="h-2.5 bg-[#f5efe6] rounded w-1/2" />
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
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-[#3d2a1e] to-[#6b4c3a] rounded-2xl shadow-xl p-5 text-white">
          <p className="text-xs opacity-75">Tu posición</p>
          <p className="text-4xl font-bold">#1</p>
          <p className="text-xs opacity-75 mt-1">de 1 estudiante</p>
          <div className="flex items-center gap-2 mt-2">
            <span>{rangoEstudiante.emoji}</span>
            <span className="text-xs opacity-75">{rangoEstudiante.nombre}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-[#e8dcca] p-8 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-sm text-[#a68a64]">Eres el primer estudiante registrado en {estudiante?.grado}°</p>
          <p className="text-xs text-[#a68a64] mt-2">¡Sigue así! 🎯</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-7xl animate-bounce select-none">🎉🏆🎉</div>
        </div>
      )}

      {/* ── TARJETA DE TU POSICIÓN ── */}
      <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] rounded-2xl shadow-xl p-5 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 text-[80px] opacity-[0.06] select-none leading-none pointer-events-none">🏆</div>

        <p className="text-xs opacity-75 mb-1">
          {estudiante?.grado}° · {estudiante?.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seg. Alimentaria'}
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-5xl font-bold">#{posicionEstudiante !== -1 ? posicionEstudiante + 1 : '?'}</p>
          <div>
            <p className="text-sm opacity-75">de {ranking.length} estudiantes</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span>{rangoEstudiante.emoji}</span>
              <span className="text-xs opacity-60">{rangoEstudiante.nombre}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold">{estudiante?.puntuacion_total || 0}</p>
            <p className="text-[10px] opacity-60">puntos</p>
          </div>
        </div>

        {posicionEstudiante > 0 && puntosFaltantes > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] opacity-60 mb-1">
              <span>Progreso hacia el puesto #{posicionEstudiante}</span>
              <span>faltan {puntosFaltantes} pts</span>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${porcentajeHaciaArriba}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── PODIO ── */}
      {top3.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#4a3222] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>🏆</span> Podio de campeones
          </h3>

          {/* Mobile: 1ro arriba full width, 2do y 3ro abajo en dos columnas
              Desktop: fila con orden 2do · 1ro (centro/más grande) · 3ro */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-center sm:gap-4">

            {/* Fila inferior en mobile: 2do y 3ro */}
            <div className="grid grid-cols-2 gap-3 sm:contents">

              {/* 2do lugar */}
              {top3[1] && (
                <div className="sm:order-1 sm:w-44 md:w-52">
                  <PodioCard
                    estudiante={top3[1]}
                    posicion={2}
                    esActual={top3[1].id === estudiante?.id}
                  />
                </div>
              )}

              {/* 3er lugar */}
              {top3[2] && (
                <div className="sm:order-3 sm:w-44 md:w-52">
                  <PodioCard
                    estudiante={top3[2]}
                    posicion={3}
                    esActual={top3[2].id === estudiante?.id}
                  />
                </div>
              )}
            </div>

            {/* 1er lugar — aparece primero en mobile, al centro en desktop */}
            {top3[0] && (
              <div className="order-first sm:order-2 sm:w-52 md:w-60">
                <PodioCard
                  estudiante={top3[0]}
                  posicion={1}
                  esActual={top3[0].id === estudiante?.id}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LISTA RESTO ── */}
      {resto.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#4a3222] uppercase tracking-widest mb-2.5 flex items-center gap-2">
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
                  className={`relative bg-white rounded-xl border transition-all hover:shadow-md overflow-hidden ${
                    esActual ? 'border-[#6b4c3a] ring-1 ring-[#6b4c3a]/20' : 'border-[#e8dcca]'
                  }`}
                >
                  {esActual && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6b4c3a]" />}
                  <div className="flex items-center gap-3 p-3 pl-4">
                    <span className={`w-8 text-center font-bold text-sm flex-shrink-0 ${esActual ? 'text-[#6b4c3a]' : 'text-[#a68a64]'}`}>
                      {pos}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#e8dcca]">
                      <Avatar avatar={avatar} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${esActual ? 'text-[#4a3222]' : 'text-[#4a3222]'}`}>
                        {est.nombre_completo}
                        {esActual && <span className="ml-2 text-[10px] text-[#6b4c3a] font-bold uppercase tracking-wide">· tú</span>}
                      </p>
                      <p className="text-[10px] text-[#a68a64] truncate">
                        {est.municipios?.nombre} · {est.instituciones?.nombre?.split(' ').slice(0, 3).join(' ')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-[#6b4c3a]">{est.puntuacion_total}</p>
                      <p className="text-[10px] text-[#a68a64]">pts</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MOTIVACIÓN ── */}
      {posicionEstudiante > 2 && (
        <div className="bg-gradient-to-r from-[#f5efe6] to-[#e8dcca] rounded-xl p-4 text-center border border-[#e8dcca]">
          <p className="text-sm text-[#6b4c3a] font-medium">
            💪 ¡Te faltan {posicionEstudiante - 2} {posicionEstudiante - 2 === 1 ? 'posición' : 'posiciones'} para el podio!
          </p>
          {puntosFaltantes > 0 && (
            <p className="text-xs text-[#a68a64] mt-1">
              Sólo <strong>{puntosFaltantes} puntos</strong> te separan del siguiente puesto.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const PODIO_CONFIG = {
  1: {
    medal: '👑',
    bg: 'bg-gradient-to-b from-amber-50 to-yellow-100',
    border: 'border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    avatarRing: 'ring-4 ring-amber-300 ring-offset-2',
    ptsColor: 'text-amber-700',
    label: '🥇 Campeón',
    labelColor: 'text-amber-600',
    avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
    bounce: true,
  },
  2: {
    medal: '🥈',
    bg: 'bg-gradient-to-b from-slate-50 to-gray-100',
    border: 'border-slate-300',
    headerBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
    avatarRing: 'ring-4 ring-slate-300 ring-offset-2',
    ptsColor: 'text-slate-600',
    label: '2° Lugar',
    labelColor: 'text-slate-500',
    avatarSize: 'w-12 h-12 sm:w-14 sm:h-14',
    bounce: false,
  },
  3: {
    medal: '🥉',
    bg: 'bg-gradient-to-b from-orange-50 to-amber-100',
    border: 'border-orange-300',
    headerBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    avatarRing: 'ring-4 ring-orange-300 ring-offset-2',
    ptsColor: 'text-orange-700',
    label: '3° Lugar',
    labelColor: 'text-orange-600',
    avatarSize: 'w-12 h-12 sm:w-14 sm:h-14',
    bounce: false,
  },
}

function PodioCard({ estudiante, posicion, esActual }) {
  const avatar = getAvatarById(estudiante?.avatar_id || 1)
  const cfg = PODIO_CONFIG[posicion]
  const esPrimero = posicion === 1

  // Truncar nombre: máximo 2 palabras en 2do/3ro, nombre completo en 1ro
  const nombre = esPrimero
    ? estudiante?.nombre_completo
    : estudiante?.nombre_completo?.split(' ').slice(0, 2).join(' ')

  // Truncar institución a ~25 caracteres
  const institucion = estudiante?.instituciones?.nombre || '—'
  const instCorta = institucion.length > 26 ? institucion.slice(0, 24) + '…' : institucion

  return (
    <div className={`rounded-2xl overflow-hidden border-2 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 ${cfg.border} ${cfg.bg} ${esActual ? 'ring-2 ring-offset-1 ring-[#6b4c3a]' : ''}`}>

      {/* Header coloreado con avatar y medalla */}
      <div className={`${cfg.headerBg} pt-3 pb-6 px-3 text-center relative`}>
        <span className={`block mb-1 ${esPrimero ? 'text-3xl' : 'text-2xl'}`}>
          {cfg.medal}
        </span>
        <div className={`${cfg.avatarSize} mx-auto rounded-full bg-white flex items-center justify-center ${cfg.avatarRing} ring-offset-transparent shadow-lg overflow-hidden`}>
          <Avatar avatar={avatar} size={esPrimero ? 'lg' : 'md'} className="w-full h-full object-cover" />
        </div>
        {esActual && (
          <div className="absolute top-2 right-2 bg-white/90 text-[#6b4c3a] text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            tú
          </div>
        )}
      </div>

      {/* Cuerpo con info */}
      <div className="px-3 pt-3 pb-3 text-center -mt-2">
        {/* Nombre */}
        <p className={`font-bold text-[#4a3222] leading-tight mb-1 ${esPrimero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
          {nombre}
        </p>

        {/* Municipio */}
        <p className="text-[10px] text-[#a68a64] mt-0.5">
          📍 {estudiante?.municipios?.nombre || '—'}
        </p>

        {/* Institución */}
        <p className="text-[10px] text-[#6b4c3a] font-medium leading-tight mt-0.5" title={institucion}>
          🏫 {instCorta}
        </p>

        {/* Puntos */}
        <div className="mt-2.5 pt-2.5 border-t border-black/10">
          <p className={`font-bold leading-none ${cfg.ptsColor} ${esPrimero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            {estudiante?.puntuacion_total ?? 0}
          </p>
          <p className="text-[10px] text-[#a68a64] mt-0.5">puntos</p>
        </div>

        {/* Etiqueta de posición */}
        <p className={`text-[10px] font-bold mt-2 ${cfg.labelColor}`}>{cfg.label}</p>
      </div>
    </div>
  )
}
