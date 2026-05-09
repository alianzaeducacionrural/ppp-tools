import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'

const CIRCUMFERENCE = 2 * Math.PI * 40

export function InsigniasEstudiante({ estudianteId, niveles }) {
  const [insigniasObtenidas, setInsigniasObtenidas] = useState([])
  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [ultimaInsignia, setUltimaInsignia] = useState(null)
  const celebrationTimerRef = useRef(null)
  const nivelesRef = useRef(niveles)

  useEffect(() => { nivelesRef.current = niveles }, [niveles])

  useEffect(() => {
    async function cargarDatos() {
      const [{ data: insigniasData }, { data: estudianteData }] = await Promise.all([
        supabase
          .from('insignias_obtenidas')
          .select('*, niveles!inner(id, nombre, insignia_url, numero_nivel, grado, tipo_proyecto)')
          .eq('estudiante_id', estudianteId)
          .order('fecha_obtencion', { ascending: false }),
        supabase
          .from('estudiantes')
          .select('avatar_id, nombre_completo')
          .eq('id', estudianteId)
          .single()
      ])
      if (insigniasData) setInsigniasObtenidas(insigniasData)
      if (estudianteData) setEstudiante(estudianteData)
      setLoading(false)
    }

    cargarDatos()

    const subscription = supabase
      .channel(`insignias-${estudianteId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'insignias_obtenidas', filter: `estudiante_id=eq.${estudianteId}` }, (payload) => {
        const nuevaInsignia = nivelesRef.current.find(n => n.id === payload.new.nivel_id)
        if (nuevaInsignia) {
          setUltimaInsignia(nuevaInsignia)
          setShowCelebration(true)
          if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
          celebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 4000)
          supabase
            .from('insignias_obtenidas')
            .select('*, niveles!inner(id, nombre, insignia_url, numero_nivel, grado, tipo_proyecto)')
            .eq('estudiante_id', estudianteId)
            .order('fecha_obtencion', { ascending: false })
            .then(({ data }) => { if (data) setInsigniasObtenidas(data) })
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
    }
  }, [estudianteId])

  const avatarEstudiante = estudiante ? getAvatarById(estudiante.avatar_id || 1) : null
  const totalInsignias = insigniasObtenidas.length
  const totalNiveles = niveles.length
  const porcentaje = totalNiveles > 0 ? (totalInsignias / totalNiveles) * 100 : 0
  const dashOffset = CIRCUMFERENCE - (porcentaje / 100) * CIRCUMFERENCE

  const insigniasPorGrado = insigniasObtenidas.reduce((acc, ins) => {
    const grado = ins.niveles.grado
    if (!acc[grado]) acc[grado] = []
    acc[grado].push(ins)
    return acc
  }, {})

  const LEVEL_ICONS = ['🌱', '🌿', '☕', '🏆', '🎯', '⭐', '🔥', '💎']

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-[#e8dcca]">
        <div className="text-4xl animate-pulse mb-3">🏆</div>
        <p className="text-sm text-[#a68a64]">Cargando tus insignias...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── CELEBRACIÓN ── */}
      {showCelebration && ultimaInsignia && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 text-center shadow-2xl animate-bounce max-w-xs w-full">
            <div className="text-5xl mb-2">🎉🏆🎉</div>
            <p className="text-white font-bold text-lg">¡Nueva insignia!</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              {ultimaInsignia.insignia_url
                ? <img src={ultimaInsignia.insignia_url} alt={ultimaInsignia.nombre} className="w-14 h-14 object-contain" />
                : <div className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center text-3xl">
                    {LEVEL_ICONS[ultimaInsignia.numero_nivel - 1] || '🏅'}
                  </div>
              }
              <div className="text-left text-white">
                <p className="font-bold">{ultimaInsignia.nombre}</p>
                <p className="text-xs opacity-80">Nivel {ultimaInsignia.numero_nivel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER CON ANILLO SVG ── */}
      <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] rounded-2xl shadow-lg p-5 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 text-[80px] opacity-[0.05] select-none leading-none pointer-events-none">☕</div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs opacity-70 uppercase tracking-widest font-semibold mb-1">Colección de insignias</p>
            <p className="text-3xl font-bold">{totalInsignias} <span className="text-lg font-normal opacity-60">de {totalNiveles}</span></p>
            <p className="text-xs opacity-60 mt-0.5">{Math.round(porcentaje)}% completado</p>
            {totalInsignias > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {insigniasObtenidas.slice(0, 4).map((ins, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                    {ins.niveles.insignia_url
                      ? <img src={ins.niveles.insignia_url} alt="" className="w-full h-full object-contain p-0.5" />
                      : <span className="text-xs">{LEVEL_ICONS[ins.niveles.numero_nivel - 1] || '🏅'}</span>
                    }
                  </div>
                ))}
                {totalInsignias > 4 && <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-[10px] font-bold">+{totalInsignias - 4}</div>}
              </div>
            )}
          </div>

          {/* Anillo de progreso SVG */}
          <div className="relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#fbbf24"
                strokeWidth="10"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {avatarEstudiante
                ? <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/30 bg-white/20">
                    <Avatar avatar={avatarEstudiante} size="sm" className="w-full h-full object-cover" />
                  </div>
                : <span className="text-2xl font-bold text-white">{Math.round(porcentaje)}%</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── INSIGNIAS POR GRADO ── */}
      {Object.keys(insigniasPorGrado).sort().map(grado => (
        <div key={grado} className="bg-white rounded-2xl shadow-md border border-[#e8dcca] overflow-hidden">
          <div className="bg-gradient-to-r from-[#f5efe6] to-white px-5 py-3 border-b border-[#e8dcca] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#4a3222] flex items-center gap-2">
              <span>📚</span> Grado {grado}
            </h3>
            <span className="text-xs text-[#a68a64] bg-[#f5efe6] px-2 py-0.5 rounded-full border border-[#e8dcca]">
              {insigniasPorGrado[grado].length} {insigniasPorGrado[grado].length === 1 ? 'insignia' : 'insignias'}
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {insigniasPorGrado[grado].map((insignia) => {
                const nivel = insignia.niveles
                return (
                  <div
                    key={insignia.id}
                    className="bg-gradient-to-b from-amber-50 to-[#faf7f3] rounded-2xl p-4 text-center border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all group cursor-default"
                  >
                    <div className="relative inline-block mb-2">
                      {nivel.insignia_url
                        ? <img src={nivel.insignia_url} alt={nivel.nombre}
                            className="w-16 h-16 mx-auto object-contain drop-shadow transition-transform group-hover:scale-110 group-hover:drop-shadow-lg"
                          />
                        : <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110">
                            {LEVEL_ICONS[nivel.numero_nivel - 1] || '🏅'}
                          </div>
                      }
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                        <span className="text-white text-[9px] font-bold">✓</span>
                      </div>
                    </div>
                    <p className="font-semibold text-[#4a3222] text-xs leading-tight">{nivel.nombre}</p>
                    <p className="text-[10px] text-[#a68a64] mt-0.5">Nivel {nivel.numero_nivel}</p>
                    <p className="text-[9px] text-emerald-600 font-semibold mt-1.5 bg-emerald-50 rounded-full px-2 py-0.5 inline-block">
                      {new Date(insignia.fecha_obtencion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* ── ESTADO VACÍO ── */}
      {totalInsignias === 0 && (
        <div className="bg-white rounded-2xl shadow-md border border-[#e8dcca] p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-50 to-[#f5efe6] flex items-center justify-center border-2 border-dashed border-amber-200 mb-4">
            <span className="text-4xl opacity-50">🏆</span>
          </div>
          <h3 className="text-base font-bold text-[#4a3222] mb-1">Aún no tienes insignias</h3>
          <p className="text-xs text-[#a68a64] max-w-xs mx-auto">
            Completa todos los retos de un nivel en el Mapa de Misiones para ganar tu primera insignia.
          </p>
          <a href="#/" className="mt-4 inline-flex items-center gap-2 bg-[#6b4c3a] text-white px-5 py-2.5 rounded-xl hover:bg-[#4a3222] transition text-sm font-medium">
            <span>🗺️</span> Ir al Mapa de Misiones
          </a>
        </div>
      )}

      {totalInsignias > 0 && (
        <div className="text-center">
          <p className="text-[10px] text-[#a68a64]">
            💡 Las insignias se otorgan al completar todos los retos de un nivel.
          </p>
        </div>
      )}
    </div>
  )
}
