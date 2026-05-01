import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'

export function InsigniasEstudiante({ estudianteId, niveles }) {
  const [insigniasObtenidas, setInsigniasObtenidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [ultimaInsignia, setUltimaInsignia] = useState(null)

  useEffect(() => {
    cargarInsignias()
    // Escuchar cambios en tiempo real
    const subscription = supabase
      .channel('insignias-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insignias_obtenidas',
          filter: `estudiante_id=eq.${estudianteId}`
        },
        (payload) => {
          const nuevaInsignia = niveles.find(n => n.id === payload.new.nivel_id)
          if (nuevaInsignia) {
            setUltimaInsignia(nuevaInsignia)
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 4000)
            cargarInsignias()
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [estudianteId, niveles])

  async function cargarInsignias() {
    const { data } = await supabase
      .from('insignias_obtenidas')
      .select(`
        *,
        niveles!inner (
          id,
          nombre,
          insignia_url,
          numero_nivel,
          grado,
          tipo_proyecto
        )
      `)
      .eq('estudiante_id', estudianteId)
      .order('fecha_obtencion', { ascending: false })

    if (data) setInsigniasObtenidas(data)
    setLoading(false)
  }

  // Obtener el avatar del estudiante para mostrar en la celebración
  const [estudiante, setEstudiante] = useState(null)
  useEffect(() => {
    const getEstudiante = async () => {
      const { data } = await supabase
        .from('estudiantes')
        .select('avatar_id, nombre_completo')
        .eq('id', estudianteId)
        .single()
      if (data) setEstudiante(data)
    }
    getEstudiante()
  }, [estudianteId])

  const avatarEstudiante = estudiante ? getAvatarById(estudiante.avatar_id || 1) : null

  // Calcular estadísticas
  const totalInsignias = insigniasObtenidas.length
  const totalNiveles = niveles.length
  const porcentaje = totalNiveles > 0 ? (totalInsignias / totalNiveles) * 100 : 0

  // Agrupar por grado
  const insigniasPorGrado = insigniasObtenidas.reduce((acc, ins) => {
    const grado = ins.niveles.grado
    if (!acc[grado]) acc[grado] = []
    acc[grado].push(ins)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center border border-[#e8dcca]">
        <div className="text-4xl animate-pulse mb-2">🏆</div>
        <p className="text-[#a68a64]">Cargando tus insignias...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Efecto de celebración al obtener nueva insignia */}
      {showCelebration && ultimaInsignia && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-6 text-center shadow-2xl transform scale-110 animate-bounce">
            <div className="text-6xl mb-3">🎉🏆🎉</div>
            <p className="text-white font-bold text-xl">¡Nueva insignia desbloqueada!</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              {ultimaInsignia.insignia_url ? (
                <img src={ultimaInsignia.insignia_url} alt={ultimaInsignia.nombre} className="w-20 h-20 object-contain" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center text-4xl">
                  {['🌱', '🌿', '☕', '🏆'][ultimaInsignia.numero_nivel - 1] || '🏅'}
                </div>
              )}
              <div className="text-left text-white">
                <p className="font-bold">{ultimaInsignia.nombre}</p>
                <p className="text-sm opacity-90">Nivel {ultimaInsignia.numero_nivel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm opacity-90">Total de insignias</p>
            <p className="text-4xl font-bold">{totalInsignias}</p>
            <p className="text-xs opacity-75">de {totalNiveles} niveles</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90">Progreso</p>
            <p className="text-2xl font-bold">{Math.round(porcentaje)}%</p>
            <div className="w-32 h-2 bg-white/30 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
          {avatarEstudiante && (
            <div className="bg-white/20 rounded-full p-2">
              <Avatar avatar={avatarEstudiante} size="lg" className="w-12 h-12" />
            </div>
          )}
        </div>
      </div>

      {/* Lista de insignias por grado */}
      {Object.keys(insigniasPorGrado).sort().map(grado => (
        <div key={grado} className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
          <div className="bg-[#f5efe6] px-6 py-3 border-b border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2">
              <span>📚</span> Grado {grado}
              <span className="text-sm text-[#a68a64] ml-2">({insigniasPorGrado[grado].length} insignias)</span>
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {insigniasPorGrado[grado].map((insignia) => {
                const nivel = insignia.niveles
                return (
                  <div key={insignia.id} className="bg-[#f5efe6] rounded-xl p-3 text-center hover:shadow-md transition-all group">
                    <div className="relative">
                      {nivel.insignia_url ? (
                        <img 
                          src={nivel.insignia_url} 
                          alt={nivel.nombre}
                          className="w-20 h-20 mx-auto object-contain transform transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-4xl transform transition-transform group-hover:scale-110">
                          {['🌱', '🌿', '☕', '🏆'][nivel.numero_nivel - 1] || '🏅'}
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    </div>
                    <p className="font-medium text-[#4a3222] text-sm mt-2">{nivel.nombre}</p>
                    <p className="text-xs text-[#a68a64]">Nivel {nivel.numero_nivel}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {new Date(insignia.fecha_obtencion).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Mensaje cuando no hay insignias */}
      {totalInsignias === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-[#e8dcca]">
          <div className="text-6xl mb-3">🏆</div>
          <h3 className="text-lg font-semibold text-[#4a3222] mb-2">Aún no tienes insignias</h3>
          <p className="text-[#a68a64]">
            Completa los niveles del mapa de misiones para ganar tus primeras insignias.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 inline-block bg-[#6b4c3a] text-white px-6 py-2 rounded-lg hover:bg-[#4a3222] transition"
          >
            Ir al mapa de misiones
          </button>
        </div>
      )}

      {/* Leyenda de niveles */}
      {totalInsignias > 0 && (
        <div className="bg-[#f5efe6] rounded-xl p-4 border border-[#e8dcca]">
          <p className="text-sm text-[#a68a64] text-center">
            💡 Las insignias se obtienen automáticamente al completar todos los retos de un nivel.
          </p>
        </div>
      )}
    </div>
  )
}