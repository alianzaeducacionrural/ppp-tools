import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PODIO_CONFIG = {
  1: {
    medal: '👑',
    bg: 'bg-gradient-to-b from-amber-50 to-yellow-100',
    border: 'border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    ptsColor: 'text-amber-700',
    label: '🥇 Campeón',
    labelColor: 'text-amber-600',
    avatarSize: 'w-16 h-16 sm:w-20 sm:h-20 text-3xl',
  },
  2: {
    medal: '🥈',
    bg: 'bg-gradient-to-b from-slate-50 to-gray-100',
    border: 'border-slate-300',
    headerBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
    ptsColor: 'text-slate-600',
    label: '2° Lugar',
    labelColor: 'text-slate-500',
    avatarSize: 'w-12 h-12 sm:w-14 sm:h-14 text-xl',
  },
  3: {
    medal: '🥉',
    bg: 'bg-gradient-to-b from-orange-50 to-amber-100',
    border: 'border-orange-300',
    headerBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    ptsColor: 'text-orange-700',
    label: '3° Lugar',
    labelColor: 'text-orange-600',
    avatarSize: 'w-12 h-12 sm:w-14 sm:h-14 text-xl',
  },
}

function PodioCard({ docente, posicion }) {
  const cfg = PODIO_CONFIG[posicion]
  const esPrimero = posicion === 1
  const nombre = esPrimero
    ? docente?.nombre_completo
    : docente?.nombre_completo?.split(' ').slice(0, 2).join(' ')
  const institucion = docente?.instituciones?.nombre || '—'
  const instCorta = institucion.length > 26 ? institucion.slice(0, 24) + '…' : institucion

  return (
    <div className={`rounded-2xl overflow-hidden border-2 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 ${cfg.border} ${cfg.bg}`}>
      <div className={`${cfg.headerBg} pt-3 pb-6 px-3 text-center relative`}>
        <span className={`block mb-1 ${esPrimero ? 'text-3xl' : 'text-2xl'}`}>{cfg.medal}</span>
        <div className={`${cfg.avatarSize} mx-auto rounded-full bg-white flex items-center justify-center ring-4 ring-white/60 ring-offset-2 ring-offset-transparent shadow-lg`}>
          🌱
        </div>
      </div>
      <div className="px-3 pt-3 pb-3 text-center -mt-2">
        <p className={`font-bold text-[#4a3222] leading-tight mb-1 ${esPrimero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
          {nombre}
        </p>
        <p className="text-[10px] text-[#a68a64] mt-0.5">📍 {docente?.municipios?.nombre || '—'}</p>
        <p className="text-[10px] text-[#6b4c3a] font-medium leading-tight mt-0.5" title={institucion}>🏫 {instCorta}</p>
        <div className="mt-2.5 pt-2.5 border-t border-black/10">
          <p className={`font-bold leading-none ${cfg.ptsColor} ${esPrimero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            {docente?.puntuacion_total ?? 0}
          </p>
          <p className="text-[10px] text-[#a68a64] mt-0.5">puntos</p>
        </div>
        <p className={`text-[10px] font-bold mt-2 ${cfg.labelColor}`}>{cfg.label}</p>
      </div>
    </div>
  )
}

export function PodioDocentes() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    cargarPodio()
  }, [filtroTipo])

  async function cargarPodio() {
    setLoading(true)

    let query = supabase
      .from('proyectos_dirigidos')
      .select('docente_id, puntuacion')
      .eq('estado', 'aprobado')

    if (filtroTipo) query = query.eq('tipo_proyecto', filtroTipo)

    const { data: proyectosData, error } = await query

    if (error || !proyectosData?.length) {
      setRanking([])
      setLoading(false)
      return
    }

    const totales = {}
    proyectosData.forEach(p => {
      totales[p.docente_id] = (totales[p.docente_id] || 0) + (p.puntuacion || 0)
    })

    const docenteIds = Object.keys(totales)
    const { data: docentesData } = await supabase
      .from('docentes')
      .select('id, nombre_completo, municipios (nombre), instituciones (nombre)')
      .in('id', docenteIds)

    const clasificacion = (docentesData || [])
      .map(d => ({ ...d, puntuacion_total: totales[d.id] || 0 }))
      .sort((a, b) => b.puntuacion_total - a.puntuacion_total)

    setRanking(clasificacion)
    setLoading(false)
  }

  const top3 = ranking.slice(0, 3)
  const resto = ranking.slice(3)

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">🏆 Podio de Docentes</h1>
        <p className="text-[#a68a64] mt-1">Ranking de proyectos dirigidos aprobados</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-[#e8dcca] flex items-center gap-3">
        <label className="text-sm text-[#6b4c3a] font-medium">Filtrar por proyecto:</label>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] text-sm"
        >
          <option value="">Todos</option>
          <option value="cafe">☕ Escuela y Café</option>
          <option value="alimentacion">🌽 Seguridad Alimentaria</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a68a64]">
          <div className="text-4xl animate-pulse mb-2">🏆</div>
          <p>Cargando podio...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#e8dcca]">
          <span className="text-6xl mb-4 block">🌱</span>
          <p className="text-[#a68a64] text-lg">Aún no hay proyectos dirigidos aprobados</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-center sm:gap-4">
            <div className="grid grid-cols-2 gap-3 sm:contents">
              {top3[1] && <div className="sm:order-1 sm:w-44 md:w-52"><PodioCard docente={top3[1]} posicion={2} /></div>}
              {top3[2] && <div className="sm:order-3 sm:w-44 md:w-52"><PodioCard docente={top3[2]} posicion={3} /></div>}
            </div>
            {top3[0] && <div className="order-first sm:order-2 sm:w-52 md:w-60"><PodioCard docente={top3[0]} posicion={1} /></div>}
          </div>

          {resto.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[#4a3222] uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <span>📋</span> Otros docentes
              </h3>
              <div className="space-y-2">
                {resto.map((d, idx) => (
                  <div key={d.id} className="bg-white rounded-xl border border-[#e8dcca] transition-all hover:shadow-md overflow-hidden">
                    <div className="flex items-center gap-3 p-3 pl-4">
                      <span className="w-8 text-center font-bold text-sm flex-shrink-0 text-[#a68a64]">{idx + 4}</span>
                      <div className="w-9 h-9 rounded-full bg-[#f5efe6] flex items-center justify-center flex-shrink-0 border border-[#e8dcca] text-lg">🌱</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-[#4a3222]">{d.nombre_completo}</p>
                        <p className="text-[10px] text-[#a68a64] truncate">
                          {d.municipios?.nombre} · {d.instituciones?.nombre}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-[#6b4c3a]">{d.puntuacion_total}</p>
                        <p className="text-[10px] text-[#a68a64]">pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
