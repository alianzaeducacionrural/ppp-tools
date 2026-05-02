import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'

export function EstudiantesPadrino() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ grado: '', tipo_proyecto: '', municipio: '' })
  const [municipios, setMunicipios] = useState([])

  useEffect(() => {
    cargarMunicipios()
    cargarEstudiantes()
  }, [filtros])

  async function cargarMunicipios() {
    const { data } = await supabase.from('municipios').select('id, nombre').order('nombre')
    if (data) setMunicipios(data)
  }

  async function cargarEstudiantes() {
    setLoading(true)
    
    let query = supabase
      .from('estudiantes')
      .select(`
        *,
        instituciones (nombre),
        municipios (nombre),
        sedes (nombre)
      `)
      .order('created_at', { ascending: false })

    if (filtros.grado) query = query.eq('grado', filtros.grado)
    if (filtros.tipo_proyecto) query = query.eq('tipo_proyecto', filtros.tipo_proyecto)
    if (filtros.municipio) query = query.eq('municipio_id', parseInt(filtros.municipio))

    const { data, error } = await query

    if (error) {
      console.error('Error cargando estudiantes:', error)
    } else {
      setEstudiantes(data || [])
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">👨‍🎓</div>
          <p className="text-[#a68a64]">Cargando estudiantes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
            👨‍🎓 Estudiantes
          </h1>
          <p className="text-[#a68a64] mt-1">Listado de todos los estudiantes registrados</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-[#e8dcca]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Grado</label>
              <select
                value={filtros.grado}
                onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg"
              >
                <option value="">Todos</option>
                {[4,5,6,7,8,9,10,11].map(g => (
                  <option key={g} value={g}>{g}°</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Proyecto</label>
              <select
                value={filtros.tipo_proyecto}
                onChange={(e) => setFiltros({ ...filtros, tipo_proyecto: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg"
              >
                <option value="">Todos</option>
                <option value="cafe">☕ Escuela y Café</option>
                <option value="alimentacion">🌽 Seguridad Alimentaria</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b4c3a] mb-1">Municipio</label>
              <select
                value={filtros.municipio}
                onChange={(e) => setFiltros({ ...filtros, municipio: e.target.value })}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg"
              >
                <option value="">Todos</option>
                {municipios.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setFiltros({ grado: '', tipo_proyecto: '', municipio: '' })}
            className="mt-3 text-sm text-[#6b4c3a] hover:text-[#4a3222] transition"
          >
            🧹 Limpiar filtros
          </button>
        </div>

        {/* Lista de estudiantes */}
        {estudiantes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#e8dcca]">
            <span className="text-6xl mb-4 block">📭</span>
            <p className="text-[#a68a64] text-lg">No hay estudiantes registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estudiantes.map((est) => {
              const avatar = getAvatarById(est.avatar_id || 1)
              return (
                <div key={est.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca] hover:shadow-lg transition">
                  <div className="p-4 border-b bg-gradient-to-r from-[#f5efe6] to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden">
                        <Avatar avatar={avatar} size="lg" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#4a3222]">{est.nombre_completo}</h3>
                        <p className="text-xs text-[#a68a64]">{est.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">📚 Grado:</span>
                      <span className="text-[#4a3222] font-medium">{est.grado}°</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">🌾 Proyecto:</span>
                      <span className="text-[#4a3222]">{est.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">📍 Municipio:</span>
                      <span className="text-[#4a3222]">{est.municipios?.nombre || 'N/A'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">🏫 Institución:</span>
                      <span className="text-[#4a3222] truncate">{est.instituciones?.nombre || 'N/A'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#a68a64]">⭐ Puntos:</span>
                      <span className="text-[#6b4c3a] font-bold">{est.puntuacion_total || 0}</span>
                    </p>
                    <p className="text-xs text-[#a68a64] mt-2">
                      📅 Registrado: {new Date(est.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}