import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const SELECT_CLS = 'w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition'

const MEDALLAS = [
  { bg: 'bg-yellow-50', border: 'border-yellow-300', badge: 'bg-yellow-400 text-yellow-900', icono: '🥇' },
  { bg: 'bg-slate-50',  border: 'border-slate-300',  badge: 'bg-slate-400 text-white',        icono: '🥈' },
  { bg: 'bg-amber-50',  border: 'border-amber-300',  badge: 'bg-amber-600 text-white',         icono: '🥉' },
]

const FILTROS_INICIALES = { municipio_id: '', grado: '', tipo_proyecto: '' }

export function RankingParticipantes() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  useEffect(() => {
    supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setMunicipios(data || []))
  }, [])

  useEffect(() => {
    cargarRanking()
  }, [filtros])

  async function cargarRanking() {
    setLoading(true)

    let query = supabase
      .from('estudiantes')
      .select('id, nombre_completo, grado, tipo_proyecto, municipios(nombre), instituciones(nombre)')

    if (filtros.municipio_id) query = query.eq('municipio_id', filtros.municipio_id)
    if (filtros.grado)        query = query.eq('grado', filtros.grado)
    if (filtros.tipo_proyecto) query = query.eq('tipo_proyecto', filtros.tipo_proyecto)

    const { data: estudiantes } = await query

    if (!estudiantes || estudiantes.length === 0) {
      setRanking([])
      setLoading(false)
      return
    }

    const ids = estudiantes.map(e => e.id)

    const { data: evidencias } = await supabase
      .from('evidencias')
      .select('estudiante_id, puntuacion')
      .eq('estado', 'aprobado')
      .in('estudiante_id', ids)

    const puntajes = {}
    ;(evidencias || []).forEach(ev => {
      puntajes[ev.estudiante_id] = (puntajes[ev.estudiante_id] || 0) + (ev.puntuacion || 0)
    })

    const clasificacion = estudiantes
      .map(e => ({ ...e, puntos: puntajes[e.id] || 0 }))
      .sort((a, b) => b.puntos - a.puntos)

    setRanking(clasificacion)
    setLoading(false)
  }

  const hayFiltros = filtros.municipio_id || filtros.grado || filtros.tipo_proyecto

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#4a3222] flex items-center gap-2">
          🏆 Ranking de Participantes
        </h1>
        <p className="text-sm text-[#a68a64] mt-0.5">
          Clasificación según puntos acumulados en evidencias aprobadas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#e8dcca] p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Municipio</label>
            <select
              value={filtros.municipio_id}
              onChange={(e) => setFiltros(prev => ({ ...prev, municipio_id: e.target.value }))}
              className={SELECT_CLS}
            >
              <option value="">Todos los municipios</option>
              {municipios.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Grado</label>
            <select
              value={filtros.grado}
              onChange={(e) => setFiltros(prev => ({ ...prev, grado: e.target.value }))}
              className={SELECT_CLS}
            >
              <option value="">Todos los grados</option>
              {[4,5,6,7,8,9,10,11].map(g => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Proyecto</label>
            <select
              value={filtros.tipo_proyecto}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo_proyecto: e.target.value }))}
              className={SELECT_CLS}
            >
              <option value="">Todos</option>
              <option value="cafe">☕ Escuela y Café</option>
              <option value="alimentacion">🌽 Seg. Alimentaria</option>
            </select>
          </div>
        </div>

        {hayFiltros && (
          <button
            onClick={() => setFiltros(FILTROS_INICIALES)}
            className="mt-3 text-xs text-[#6b4c3a] hover:text-[#4a3222] font-medium transition"
          >
            🧹 Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador */}
      {!loading && ranking.length > 0 && (
        <p className="text-xs text-[#a68a64] mb-3 px-1">
          {ranking.length} participante{ranking.length !== 1 ? 's' : ''} en el ranking
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#e8dcca] p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#e8dcca]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#e8dcca] rounded w-1/3" />
                <div className="h-3 bg-[#f5efe6] rounded w-1/2" />
              </div>
              <div className="h-6 w-10 bg-[#e8dcca] rounded" />
            </div>
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8dcca] p-12 text-center">
          <span className="text-5xl block mb-3">🏆</span>
          <p className="text-sm font-semibold text-[#4a3222]">No hay participantes con esos filtros</p>
          <p className="text-xs text-[#a68a64] mt-1">Prueba cambiando los criterios de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((est, idx) => {
            const pos = idx + 1
            const esTop3 = pos <= 3
            const m = esTop3 ? MEDALLAS[idx] : null

            return (
              <div
                key={est.id}
                className={`bg-white rounded-2xl border p-4 flex items-center gap-4 transition-shadow hover:shadow-sm ${
                  esTop3 ? `${m.bg} ${m.border}` : 'border-[#e8dcca]'
                }`}
              >
                {/* Posición */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  esTop3 ? m.badge : 'bg-[#f5efe6] text-[#6b4c3a]'
                }`}>
                  {esTop3 ? m.icono : `#${pos}`}
                </div>

                {/* Info del estudiante */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#4a3222] text-sm truncate">{est.nombre_completo}</p>
                  <p className="text-xs text-[#a68a64] flex flex-wrap gap-x-3 mt-0.5">
                    <span>📍 {est.municipios?.nombre || 'N/A'}</span>
                    <span>🏫 {est.instituciones?.nombre || 'N/A'}</span>
                    <span>📚 {est.grado}°</span>
                    <span>{est.tipo_proyecto === 'cafe' ? '☕ Café' : '🌽 Alimentaria'}</span>
                  </p>
                </div>

                {/* Puntos */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-xl font-bold ${esTop3 ? 'text-[#4a3222]' : 'text-[#6b4c3a]'}`}>
                    {est.puntos}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64]">pts</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
