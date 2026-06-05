import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'
import { obtenerRango } from '../../data/rangos'

function estadoReto(evidencia) {
  if (!evidencia) return { label: 'Sin enviar', icon: '⚪', cls: 'bg-[#f5efe6] text-[#a68a64] border-[#e8dcca]' }
  switch (evidencia.estado) {
    case 'aprobado':  return { label: 'Aprobado',  icon: '✅', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'pendiente': return { label: 'Pendiente', icon: '⏳', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'rechazado': return { label: 'Rechazado', icon: '❌', cls: 'bg-red-50 text-red-600 border-red-200' }
    default:          return { label: evidencia.estado, icon: '•', cls: 'bg-[#f5efe6] text-[#6b4c3a] border-[#e8dcca]' }
  }
}

export function EstudianteDetalleModal({ estudiante, onClose }) {
  const [niveles, setNiveles] = useState([])
  const [loading, setLoading] = useState(true)
  const [colapsados, setColapsados] = useState(new Set())

  useEffect(() => {
    cargarDetalle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudiante.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function cargarDetalle() {
    setLoading(true)

    const { data: nivelesData } = await supabase
      .from('niveles')
      .select('id, nombre, numero_nivel, imagen_nivel_url, insignia_url')
      .eq('grado', estudiante.grado)
      .eq('tipo_proyecto', estudiante.tipo_proyecto)
      .order('numero_nivel', { ascending: true })

    const nivelIds = (nivelesData || []).map(n => n.id)

    const [{ data: retosData }, { data: evidenciasData }, { data: insigniasData }] = await Promise.all([
      nivelIds.length
        ? supabase.from('retos').select('id, texto, nivel_id, orden, tipo_evidencia').in('nivel_id', nivelIds).order('orden', { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from('evidencias').select('id, reto_id, estado, puntuacion, fecha_envio').eq('estudiante_id', estudiante.id),
      supabase.from('insignias_obtenidas').select('nivel_id').eq('estudiante_id', estudiante.id)
    ])

    // Evidencia más reciente por reto
    const evMap = {}
    ;(evidenciasData || []).forEach(ev => {
      const prev = evMap[ev.reto_id]
      if (!prev || new Date(ev.fecha_envio) > new Date(prev.fecha_envio)) evMap[ev.reto_id] = ev
    })

    const insigniasSet = new Set((insigniasData || []).map(i => i.nivel_id))

    const retosPorNivel = {}
    ;(retosData || []).forEach(r => {
      if (!retosPorNivel[r.nivel_id]) retosPorNivel[r.nivel_id] = []
      retosPorNivel[r.nivel_id].push({ ...r, evidencia: evMap[r.id] || null })
    })

    setNiveles((nivelesData || []).map(n => ({
      ...n,
      completado: insigniasSet.has(n.id),
      retos: retosPorNivel[n.id] || []
    })))
    setLoading(false)
  }

  const toggleNivel = (id) => {
    setColapsados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const avatar = getAvatarById(estudiante.avatar_id || 1)
  const rango = obtenerRango(estudiante.puntuacion_total || 0, estudiante.tipo_proyecto || 'cafe')

  // Totales globales
  const totalRetos = niveles.reduce((s, n) => s + n.retos.length, 0)
  const totalAprobados = niveles.reduce((s, n) => s + n.retos.filter(r => r.evidencia?.estado === 'aprobado').length, 0)
  const totalPendientes = niveles.reduce((s, n) => s + n.retos.filter(r => r.evidencia?.estado === 'pendiente').length, 0)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#faf7f3] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#e8dcca]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="relative bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] px-5 py-4 sm:px-6 sm:py-5 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="flex items-center gap-4 pr-8">
            <div className="w-16 h-16 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden ring-2 ring-white/40 flex-shrink-0">
              <Avatar avatar={avatar} size="lg" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{estudiante.nombre_completo}</h2>
              {estudiante.email && <p className="text-xs text-white/70 truncate">{estudiante.email}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${rango.color} ${rango.border} border`}>
                  {rango.emoji} {rango.nombre}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white">
                  ⭐ {estudiante.puntuacion_total || 0} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chips de info */}
        <div className="px-5 sm:px-6 py-3 bg-white border-b border-[#e8dcca] flex flex-wrap gap-x-4 gap-y-1.5 text-xs flex-shrink-0">
          <span className="text-[#6b4c3a]"><span className="text-[#a68a64]">📚 Grado:</span> <b>{estudiante.grado}°</b></span>
          <span className="text-[#6b4c3a]"><span className="text-[#a68a64]">🌾 Proyecto:</span> {estudiante.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}</span>
          <span className="text-[#6b4c3a]"><span className="text-[#a68a64]">📍</span> {estudiante.municipios?.nombre || '—'}</span>
          <span className="text-[#6b4c3a] truncate"><span className="text-[#a68a64]">🏫</span> {estudiante.instituciones?.nombre || '—'}</span>
        </div>

        {/* Resumen de retos */}
        {!loading && (
          <div className="px-5 sm:px-6 py-3 bg-[#f5efe6] border-b border-[#e8dcca] flex gap-3 flex-shrink-0">
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-emerald-700">{totalAprobados}</p>
              <p className="text-[10px] text-[#a68a64] uppercase tracking-wide">Aprobados</p>
            </div>
            <div className="flex-1 text-center border-x border-[#e8dcca]">
              <p className="text-base font-bold text-amber-600">{totalPendientes}</p>
              <p className="text-[10px] text-[#a68a64] uppercase tracking-wide">Pendientes</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-base font-bold text-[#4a3222]">{totalAprobados}/{totalRetos}</p>
              <p className="text-[10px] text-[#a68a64] uppercase tracking-wide">Retos</p>
            </div>
          </div>
        )}

        {/* Cuerpo scrollable: niveles y retos */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-[#a68a64]">
              <div className="text-3xl animate-pulse mb-2">📚</div>
              <p className="text-sm">Cargando progreso...</p>
            </div>
          ) : niveles.length === 0 ? (
            <div className="text-center py-12 text-[#a68a64]">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-sm">No hay niveles configurados para este grado y proyecto</p>
            </div>
          ) : (
            niveles.map((nivel) => {
              const isOpen = !colapsados.has(nivel.id)
              const aprobadosNivel = nivel.retos.filter(r => r.evidencia?.estado === 'aprobado').length
              return (
                <div key={nivel.id} className="bg-white rounded-xl border border-[#e8dcca] overflow-hidden">
                  <button
                    onClick={() => toggleNivel(nivel.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#faf7f3] transition text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 overflow-hidden ${
                      nivel.completado ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'bg-[#f5efe6]'
                    }`}>
                      {nivel.imagen_nivel_url
                        ? <img src={nivel.imagen_nivel_url} alt="" className="w-full h-full object-cover" />
                        : (nivel.completado ? '✅' : nivel.numero_nivel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64]">Nivel {nivel.numero_nivel}</span>
                        {nivel.completado && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Completado</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#4a3222] truncate">{nivel.nombre}</h3>
                    </div>
                    <span className="text-xs text-[#a68a64] flex-shrink-0">{aprobadosNivel}/{nivel.retos.length}</span>
                    <span className={`text-[#a68a64] text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#f0e8dc] divide-y divide-[#f5efe6]">
                      {nivel.retos.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-[#a68a64] italic">Sin retos en este nivel</p>
                      ) : (
                        nivel.retos.map((reto, idx) => {
                          const est = estadoReto(reto.evidencia)
                          return (
                            <div key={reto.id} className="px-4 py-3 flex items-start gap-3">
                              <span className="text-[11px] font-bold text-[#a68a64] mt-0.5 flex-shrink-0">{idx + 1}.</span>
                              <p className="text-xs text-[#4a3222] leading-snug flex-1">{reto.texto}</p>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${est.cls} whitespace-nowrap`}>
                                  {est.icon} {est.label}
                                </span>
                                {reto.evidencia?.estado === 'aprobado' && (
                                  <span className="text-[10px] text-[#6b4c3a] font-bold">+{reto.evidencia.puntuacion || 0} pts</span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
