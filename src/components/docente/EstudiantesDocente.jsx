import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarById } from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'
import { EstudianteDetalleModal } from '../padrino/EstudianteDetalleModal'

export function EstudiantesDocente() {
  const [docente, setDocente] = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('tarjetas')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: docenteData } = await supabase
      .from('docentes')
      .select('id, institucion_id, instituciones (nombre), municipios (nombre)')
      .eq('user_id', user.id)
      .single()

    if (!docenteData?.institucion_id) { setLoading(false); return }
    setDocente(docenteData)

    const { data, error } = await supabase
      .from('estudiantes')
      .select('*, instituciones (nombre), municipios (nombre), sedes (nombre)')
      .eq('institucion_id', docenteData.institucion_id)
      .order('nombre_completo')

    if (error || !data?.length) {
      setEstudiantes([])
      setLoading(false)
      return
    }

    const ids = data.map(e => e.id)
    const { data: evidencias } = await supabase
      .from('evidencias')
      .select('estudiante_id, puntuacion')
      .eq('estado', 'aprobado')
      .in('estudiante_id', ids)

    const totales = {}
    ;(evidencias || []).forEach(ev => {
      totales[ev.estudiante_id] = (totales[ev.estudiante_id] || 0) + (ev.puntuacion || 0)
    })

    setEstudiantes(data.map(e => ({ ...e, puntuacion_total: totales[e.id] || 0 })))
    setLoading(false)
  }

  const estudiantesFiltrados = busqueda.trim()
    ? estudiantes.filter(e => e.nombre_completo?.toLowerCase().includes(busqueda.trim().toLowerCase()))
    : estudiantes

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">👨‍🎓 Estudiantes de tu institución</h1>
        <p className="text-[#a68a64] mt-1">{docente?.instituciones?.nombre} · {docente?.municipios?.nombre}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-[#e8dcca]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a68a64] text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-8 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a68a64] hover:text-[#4a3222] text-sm"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex bg-[#f5efe6] rounded-lg p-1 border border-[#e8dcca] self-start">
            <button
              onClick={() => setVista('tarjetas')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                vista === 'tarjetas' ? 'bg-white text-[#4a3222] shadow-sm' : 'text-[#a68a64] hover:text-[#6b4c3a]'
              }`}
            >
              ▦ Tarjetas
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                vista === 'lista' ? 'bg-white text-[#4a3222] shadow-sm' : 'text-[#a68a64] hover:text-[#6b4c3a]'
              }`}
            >
              ☰ Lista
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <span className="text-xs text-[#a68a64]">{estudiantesFiltrados.length} estudiantes encontrados</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a68a64]">
          <div className="text-4xl animate-pulse mb-2">👨‍🎓</div>
          <p>Cargando estudiantes...</p>
        </div>
      ) : estudiantesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#e8dcca]">
          <span className="text-6xl mb-4 block">📭</span>
          <p className="text-[#a68a64] text-lg">
            {busqueda ? 'Ningún estudiante coincide con la búsqueda' : 'Aún no hay estudiantes registrados en tu institución'}
          </p>
        </div>
      ) : vista === 'tarjetas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudiantesFiltrados.map((est) => {
            const avatar = getAvatarById(est.avatar_id || 1)
            return (
              <button
                key={est.id}
                onClick={() => setSeleccionado(est)}
                className="text-left bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca] hover:shadow-lg hover:border-[#d4c4a8] transition group"
              >
                <div className="p-4 border-b bg-gradient-to-r from-[#f5efe6] to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden">
                      <Avatar avatar={avatar} size="lg" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#4a3222] truncate">{est.nombre_completo}</h3>
                      <p className="text-xs text-[#a68a64] truncate">{est.email}</p>
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
                    <span className="text-[#a68a64]">🏫 Sede:</span>
                    <span className="text-[#4a3222] truncate">{est.sedes?.nombre || 'N/A'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#a68a64]">⭐ Puntos:</span>
                    <span className="text-[#6b4c3a] font-bold">{est.puntuacion_total || 0}</span>
                  </p>
                  <p className="text-[11px] text-[#8b6b54] mt-2 font-medium group-hover:text-[#6b4c3a]">Ver detalle →</p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-hidden divide-y divide-[#f0e8dc]">
          {estudiantesFiltrados.map((est) => {
            const avatar = getAvatarById(est.avatar_id || 1)
            return (
              <button
                key={est.id}
                onClick={() => setSeleccionado(est)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#faf7f3] transition group"
              >
                <div className="w-10 h-10 rounded-full bg-[#f5efe6] flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Avatar avatar={avatar} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#4a3222] truncate text-sm">{est.nombre_completo}</h3>
                  <p className="text-xs text-[#a68a64] truncate">
                    {est.grado}° · {est.tipo_proyecto === 'cafe' ? '☕ Café' : '🌽 Alimentaria'} · {est.sedes?.nombre || 'N/A'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#6b4c3a] font-bold text-sm">⭐ {est.puntuacion_total || 0}</p>
                </div>
                <span className="text-[#a68a64] group-hover:text-[#6b4c3a] flex-shrink-0">›</span>
              </button>
            )
          })}
        </div>
      )}

      {seleccionado && (
        <EstudianteDetalleModal
          estudiante={seleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </div>
  )
}
