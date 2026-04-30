import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function InsigniasEstudiante({ estudianteId, niveles }) {
  const [insigniasObtenidas, setInsigniasObtenidas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarInsignias()
  }, [estudianteId])

  async function cargarInsignias() {
    const { data } = await supabase
      .from('insignias_obtenidas')
      .select('*, niveles(nombre, insignia_url, numero_nivel)')
      .eq('estudiante_id', estudianteId)
      .order('fecha_obtencion', { ascending: false })

    if (data) setInsigniasObtenidas(data)
    setLoading(false)
  }

  // Combinar insignias obtenidas con niveles disponibles
  const todasLasInsignias = niveles.map(nivel => ({
    ...nivel,
    obtenida: insigniasObtenidas.some(i => i.nivel_id === nivel.id),
    fecha: insigniasObtenidas.find(i => i.nivel_id === nivel.id)?.fecha_obtencion
  }))

  if (loading) {
    return <div className="text-center py-8 text-[#a68a64]">Cargando insignias...</div>
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-xl shadow-md p-5 text-white text-center">
        <p className="text-3xl font-bold">{insigniasObtenidas.length}</p>
        <p className="text-sm opacity-90">de {niveles.length} insignias obtenidas</p>
        <div className="w-full bg-[#8b6b54] rounded-full h-2 mt-3">
          <div 
            className="bg-[#d4c4a8] h-2 rounded-full transition-all" 
            style={{ width: `${(insigniasObtenidas.length / niveles.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Grid de insignias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {todasLasInsignias.map((insignia, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-xl shadow-md p-4 border transition-all ${insignia.obtenida ? 'border-[#6b4c3a]' : 'border-[#e8dcca] opacity-60'}`}
          >
            <div className="text-center">
              {insignia.insignia_url ? (
                <img 
                  src={insignia.insignia_url} 
                  alt={insignia.nombre} 
                  className="w-24 h-24 object-contain mx-auto mb-3" 
                />
              ) : (
                <div className="w-24 h-24 mx-auto mb-3 bg-[#f5efe6] rounded-full flex items-center justify-center text-4xl">
                  {insignia.obtenida ? (['🌱', '🌿', '☕', '🏆'][insignia.numero_nivel - 1] || '🏅') : '🔒'}
                </div>
              )}
              <h3 className="font-bold text-[#4a3222]">{insignia.nombre}</h3>
              <p className="text-sm text-[#a68a64] mt-1">Nivel {insignia.numero_nivel}</p>
              {insignia.obtenida && insignia.fecha && (
                <p className="text-xs text-green-600 mt-2">
                  Obtenida el {new Date(insignia.fecha).toLocaleDateString('es-CO')}
                </p>
              )}
              {!insignia.obtenida && (
                <p className="text-xs text-[#a68a64] mt-2">Completa este nivel para obtenerla</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}