import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const TIPO = {
  cafe:        { texto: 'Escuela y Café',    icono: '☕', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  alimentacion:{ texto: 'Seg. Alimentaria', icono: '🌽', color: 'bg-green-100 text-green-800 border-green-200' },
}

const TIPO_EVIDENCIA_LABEL = {
  texto:      '📝 Texto',
  imagen:     '🖼️ Imagen',
  video:      '🎥 Video',
  audio:      '🎵 Audio',
  ambos:      '📝+🖼️ Texto e imagen',
  multimedia: '🎬 Multimedia',
  preguntas:  '❓ Cuestionario',
}

// ============================================
// MANAGER PRINCIPAL
// ============================================
export function NivelesManager() {
  const [niveles, setNiveles]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [nivelAbierto, setNivelAbierto]     = useState(null)
  const [retosMap, setRetosMap]             = useState({})
  const [loadingRetosId, setLoadingRetosId] = useState(null)

  const [filtros, setFiltros] = useState({ tipo_proyecto: '', grado: '' })

  const [mostrarFormNivel, setMostrarFormNivel] = useState(false)
  const [editandoNivel, setEditandoNivel]       = useState(null)

  const [mostrarFormReto, setMostrarFormReto] = useState(false)
  const [editandoReto, setEditandoReto]       = useState(null)
  const [nivelParaReto, setNivelParaReto]     = useState(null)

  useEffect(() => { cargarNiveles() }, [])

  async function cargarNiveles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('niveles')
      .select('*')
      .order('tipo_proyecto')
      .order('grado')
      .order('numero_nivel')
    if (error) toast.error('Error al cargar niveles')
    else setNiveles(data || [])
    setLoading(false)
  }

  async function cargarRetos(nivelId) {
    setLoadingRetosId(nivelId)
    const { data, error } = await supabase
      .from('retos')
      .select('*')
      .eq('nivel_id', nivelId)
      .order('orden')
    if (error) toast.error('Error al cargar retos')
    else setRetosMap(prev => ({ ...prev, [nivelId]: data || [] }))
    setLoadingRetosId(null)
  }

  function toggleNivel(nivelId) {
    if (nivelAbierto === nivelId) {
      setNivelAbierto(null)
    } else {
      setNivelAbierto(nivelId)
      if (!retosMap[nivelId]) cargarRetos(nivelId)
    }
  }

  async function handleDeleteNivel(nivel) {
    if (!confirm(`¿Eliminar "${nivel.nombre}"? También se eliminarán todos sus retos.`)) return
    const { error } = await supabase.from('niveles').delete().eq('id', nivel.id)
    if (error) {
      toast.error('Error al eliminar el nivel')
    } else {
      toast.success('Nivel eliminado')
      setRetosMap(prev => { const c = { ...prev }; delete c[nivel.id]; return c })
      if (nivelAbierto === nivel.id) setNivelAbierto(null)
      cargarNiveles()
    }
  }

  async function handleDeleteReto(reto, nivelId) {
    if (!confirm(`¿Eliminar este reto?`)) return
    const { error } = await supabase.from('retos').delete().eq('id', reto.id)
    if (error) toast.error('Error al eliminar el reto')
    else { toast.success('Reto eliminado'); cargarRetos(nivelId) }
  }

  const gradosDisponibles = [...new Set(niveles.map(n => n.grado))].sort((a, b) => a - b)

  const nivelesFiltrados = niveles.filter(n => {
    if (filtros.tipo_proyecto && n.tipo_proyecto !== filtros.tipo_proyecto) return false
    if (filtros.grado && String(n.grado) !== filtros.grado) return false
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#4a3222]">Gestión de Niveles</h2>
          <p className="text-sm text-[#a68a64] mt-0.5">Haz clic en un nivel para ver y gestionar sus retos</p>
        </div>
        <button
          onClick={() => { setEditandoNivel(null); setMostrarFormNivel(true) }}
          className="bg-[#6b4c3a] text-white px-4 py-2 rounded-lg hover:bg-[#4a3222] transition text-sm font-medium"
        >
          + Nuevo Nivel
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filtros.tipo_proyecto}
          onChange={e => setFiltros(prev => ({ ...prev, tipo_proyecto: e.target.value }))}
          className="px-3 py-2 text-sm border border-[#e8dcca] rounded-lg bg-white text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a]"
        >
          <option value="">Todos los proyectos</option>
          <option value="cafe">☕ Escuela y Café</option>
          <option value="alimentacion">🌽 Seg. Alimentaria</option>
        </select>

        <select
          value={filtros.grado}
          onChange={e => setFiltros(prev => ({ ...prev, grado: e.target.value }))}
          className="px-3 py-2 text-sm border border-[#e8dcca] rounded-lg bg-white text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a]"
        >
          <option value="">Todos los grados</option>
          {gradosDisponibles.map(g => <option key={g} value={g}>{g}°</option>)}
        </select>

        {(filtros.tipo_proyecto || filtros.grado) && (
          <button
            onClick={() => setFiltros({ tipo_proyecto: '', grado: '' })}
            className="text-sm text-[#6b4c3a] hover:text-[#4a3222] font-medium transition"
          >
            Limpiar filtros
          </button>
        )}

        {!loading && (
          <span className="text-sm text-[#a68a64] self-center ml-auto">
            {nivelesFiltrados.length} nivel{nivelesFiltrados.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-[#e8dcca] p-4 animate-pulse">
              <div className="h-4 bg-[#e8dcca] rounded w-1/3 mb-2" />
              <div className="h-3 bg-[#f5efe6] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : nivelesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8dcca] p-12 text-center">
          <span className="text-4xl block mb-3">📚</span>
          {niveles.length === 0
            ? <><p className="text-[#a68a64] font-medium">No hay niveles creados</p><p className="text-sm text-[#a68a64] mt-1">Crea el primer nivel para comenzar</p></>
            : <><p className="text-[#a68a64] font-medium">Sin resultados</p><p className="text-sm text-[#a68a64] mt-1">Prueba cambiando los filtros</p></>
          }
        </div>
      ) : (
        <div className="space-y-2">
          {nivelesFiltrados.map(nivel => {
            const isOpen  = nivelAbierto === nivel.id
            const retos   = retosMap[nivel.id] || []
            const cargando = loadingRetosId === nivel.id
            const tipo    = TIPO[nivel.tipo_proyecto] || TIPO.cafe

            return (
              <div key={nivel.id} className={`bg-white rounded-xl border overflow-hidden transition-shadow ${isOpen ? 'border-[#a68a64] shadow-md' : 'border-[#e8dcca] hover:shadow-sm'}`}>

                {/* ── Cabecera del nivel ── */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none ${isOpen ? 'bg-[#f5efe6]' : 'hover:bg-[#faf7f3]'}`}
                  onClick={() => toggleNivel(nivel.id)}
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${tipo.color}`}>
                    {tipo.icono} {tipo.texto}
                  </span>
                  <span className="text-xs bg-[#e8dcca] text-[#6b4c3a] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    {nivel.grado}°
                  </span>
                  <span className="text-xs text-[#a68a64] flex-shrink-0">N{nivel.numero_nivel}</span>
                  <span className="font-semibold text-[#4a3222] flex-1 truncate text-sm">{nivel.nombre}</span>

                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {isOpen && !cargando && (
                      <span className="text-xs text-[#a68a64] mr-1">
                        {retos.length} reto{retos.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => { setEditandoNivel(nivel); setMostrarFormNivel(true) }}
                      className="text-[#6b4c3a] hover:text-[#4a3222] text-xs px-2 py-1 rounded hover:bg-[#e8dcca] transition"
                      title="Editar nivel"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteNivel(nivel)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                      title="Eliminar nivel"
                    >
                      🗑️
                    </button>
                    <span className={`text-[#a68a64] text-xs transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180' : ''}`} style={{ display: 'inline-block' }}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* ── Panel de retos ── */}
                {isOpen && (
                  <div className="border-t border-[#e8dcca]">
                    {cargando ? (
                      <div className="p-6 text-center text-sm text-[#a68a64]">Cargando retos...</div>
                    ) : (
                      <>
                        {retos.length === 0 ? (
                          <div className="p-8 text-center text-sm text-[#a68a64]">
                            <span className="text-3xl block mb-2">🎯</span>
                            Este nivel no tiene retos aún
                          </div>
                        ) : (
                          <div className="divide-y divide-[#f5efe6]">
                            {retos.map(reto => (
                              <div key={reto.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#faf7f3] transition">
                                <span className="w-6 h-6 rounded-full bg-[#e8dcca] text-[#6b4c3a] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                                  {reto.orden}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[#4a3222] leading-snug">{reto.texto}</p>
                                  {reto.instruccion_evidencia && (
                                    <p className="text-xs text-[#a68a64] mt-0.5 italic">💡 {reto.instruccion_evidencia}</p>
                                  )}
                                  <div className="flex gap-1.5 mt-1 flex-wrap">
                                    <span className="text-[10px] bg-[#f5efe6] text-[#6b4c3a] border border-[#e8dcca] px-1.5 py-0.5 rounded">
                                      {TIPO_EVIDENCIA_LABEL[reto.tipo_evidencia] || reto.tipo_evidencia}
                                    </span>
                                    {reto.tiene_preguntas && (
                                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                                        ❓ Cuestionario
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => { setEditandoReto(reto); setNivelParaReto(nivel); setMostrarFormReto(true) }}
                                    className="text-[#6b4c3a] hover:text-[#4a3222] text-xs px-2 py-1 rounded hover:bg-[#e8dcca] transition"
                                    title="Editar reto"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReto(reto, nivel.id)}
                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                                    title="Eliminar reto"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="px-5 py-3 border-t border-[#f5efe6]">
                          <button
                            onClick={() => { setEditandoReto(null); setNivelParaReto(nivel); setMostrarFormReto(true) }}
                            className="text-sm text-[#6b4c3a] hover:text-[#4a3222] font-medium flex items-center gap-2 transition"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#e8dcca] flex items-center justify-center text-xs font-bold">+</span>
                            Agregar reto
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {mostrarFormNivel && (
        <FormularioNivel
          nivel={editandoNivel}
          onClose={() => setMostrarFormNivel(false)}
          onSave={() => { setMostrarFormNivel(false); cargarNiveles() }}
        />
      )}

      {mostrarFormReto && nivelParaReto && (
        <FormularioReto
          reto={editandoReto}
          nivel={nivelParaReto}
          onClose={() => setMostrarFormReto(false)}
          onSave={() => { setMostrarFormReto(false); cargarRetos(nivelParaReto.id) }}
        />
      )}
    </div>
  )
}

// ============================================
// FORMULARIO NIVEL
// ============================================
function FormularioNivel({ nivel, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tipo_proyecto: nivel?.tipo_proyecto || 'cafe',
    grado:         String(nivel?.grado || '5'),
    numero_nivel:  String(nivel?.numero_nivel || '1'),
    nombre:        nivel?.nombre || '',
    imagen_url:    nivel?.imagen_url || '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { data: existing } = await supabase
      .from('niveles')
      .select('id')
      .eq('tipo_proyecto', formData.tipo_proyecto)
      .eq('grado', Number(formData.grado))
      .eq('numero_nivel', Number(formData.numero_nivel))
      .maybeSingle()

    if (existing && (!nivel || existing.id !== nivel.id)) {
      const tipoLabel = formData.tipo_proyecto === 'cafe' ? 'Escuela y Café' : 'Seguridad Alimentaria'
      toast.error(`Ya existe el Nivel ${formData.numero_nivel} para ${formData.grado}° en ${tipoLabel}`)
      setLoading(false)
      return
    }

    const dataToSave = {
      ...formData,
      grado:        Number(formData.grado),
      numero_nivel: Number(formData.numero_nivel),
    }

    let error
    if (nivel) {
      const { error: e } = await supabase.from('niveles').update(dataToSave).eq('id', nivel.id)
      error = e
    } else {
      const { error: e } = await supabase.from('niveles').insert(dataToSave)
      error = e
    }

    if (error) toast.error('Error al guardar el nivel')
    else { toast.success(`Nivel ${nivel ? 'actualizado' : 'creado'} exitosamente`); onSave() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-[#e8dcca]">
        <h3 className="text-lg font-semibold text-[#4a3222] mb-4">
          {nivel ? '✏️ Editar Nivel' : '+ Nuevo Nivel'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Tipo de Proyecto</label>
            <select name="tipo_proyecto" value={formData.tipo_proyecto} onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm" required>
              <option value="cafe">☕ Escuela y Café</option>
              <option value="alimentacion">🌽 Seguridad Alimentaria</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Grado</label>
              <select name="grado" value={formData.grado} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm" required>
                {[4,5,6,7,8,9,10,11].map(g => <option key={g} value={g}>{g}°</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Número de Nivel</label>
              <select name="numero_nivel" value={formData.numero_nivel} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm" required>
                {[1,2,3,4].map(n => <option key={n} value={n}>Nivel {n}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Nombre del Nivel</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm" required />
          </div>

          <div>
            <label className="block text-sm text-[#6b4c3a] font-medium mb-1">URL de Imagen (opcional)</label>
            <input type="url" name="imagen_url" value={formData.imagen_url} onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm"
              placeholder="https://..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#6b4c3a] text-white py-2 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition text-sm">
              {loading ? 'Verificando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#e8dcca] text-[#6b4c3a] py-2 rounded-lg hover:bg-[#d4c4a8] transition text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// FORMULARIO RETO (nivel ya fijado)
// ============================================
function FormularioReto({ reto, nivel, onClose, onSave }) {
  const [formData, setFormData] = useState({
    orden:                  String(reto?.orden || '1'),
    texto:                  reto?.texto || '',
    instruccion_evidencia:  reto?.instruccion_evidencia || '',
    tipos_archivo:          reto?.tipos_archivo || [],
    tiene_preguntas:        reto?.tiene_preguntas || false,
    puntuacion_por_pregunta:reto?.puntuacion_por_pregunta || false,
  })
  const [preguntas, setPreguntas]             = useState([])
  const [loading, setLoading]                 = useState(false)
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false)

  const opcionesArchivos = [
    { valor: 'imagen', label: '🖼️ Imagen',  descripcion: 'JPG, PNG, GIF' },
    { valor: 'video',  label: '🎥 Video',   descripcion: 'MP4, MOV'      },
    { valor: 'audio',  label: '🎵 Audio',   descripcion: 'MP3, WAV'      },
    { valor: 'texto',  label: '📝 Texto',   descripcion: 'Respuesta escrita' },
  ]

  useEffect(() => {
    if (reto?.id && reto.tiene_preguntas) cargarPreguntas()
  }, [reto])

  async function cargarPreguntas() {
    setCargandoPreguntas(true)
    const { data } = await supabase.from('preguntas').select('*').eq('reto_id', reto.id).order('orden')
    if (data) setPreguntas(data)
    setCargandoPreguntas(false)
  }

  const handleTipoArchivoChange = (tipo, checked) => {
    setFormData({
      ...formData,
      tipos_archivo: checked
        ? [...formData.tipos_archivo, tipo]
        : formData.tipos_archivo.filter(t => t !== tipo),
    })
  }

  const calcularTipoEvidencia = () => {
    const tipos = formData.tipos_archivo
    if (formData.tiene_preguntas) return 'preguntas'
    if (tipos.length === 0) return 'texto'
    if (tipos.length === 1) return tipos[0]
    if (tipos.length === 2 && tipos.includes('texto') && tipos.includes('imagen')) return 'ambos'
    return 'multimedia'
  }

  const handleTienePreguntasChange = (checked) => {
    setFormData({ ...formData, tiene_preguntas: checked, tipos_archivo: checked ? [] : formData.tipos_archivo })
    if (!checked) setPreguntas([])
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (formData.tiene_preguntas && preguntas.length === 0) {
      toast.error('Debes agregar al menos una pregunta')
      return
    }
    setLoading(true)

    const { data: existingOrden } = await supabase
      .from('retos')
      .select('id')
      .eq('nivel_id', nivel.id)
      .eq('orden', Number(formData.orden))
      .maybeSingle()

    if (existingOrden && (!reto || existingOrden.id !== reto.id)) {
      toast.error(`Ya existe un reto con el orden ${formData.orden} en este nivel`)
      setLoading(false)
      return
    }

    const dataToSave = {
      nivel_id:              nivel.id,
      orden:                 Number(formData.orden),
      texto:                 formData.texto,
      instruccion_evidencia: formData.instruccion_evidencia,
      tipo_evidencia:        calcularTipoEvidencia(),
      tipos_archivo:         formData.tipos_archivo,
      tiene_preguntas:       formData.tiene_preguntas,
      puntuacion_por_pregunta: formData.puntuacion_por_pregunta,
    }

    let retoId, error
    if (reto) {
      const { error: e } = await supabase.from('retos').update(dataToSave).eq('id', reto.id).select()
      error = e; retoId = reto.id
    } else {
      const { data, error: e } = await supabase.from('retos').insert(dataToSave).select()
      error = e; retoId = data?.[0]?.id
    }

    if (error) { toast.error('Error al guardar el reto'); setLoading(false); return }

    if (formData.tiene_preguntas && retoId) {
      await supabase.from('preguntas').delete().eq('reto_id', retoId)
      if (preguntas.length > 0) {
        const { error: ep } = await supabase.from('preguntas').insert(
          preguntas.map(p => ({ reto_id: retoId, texto: p.texto, orden: p.orden }))
        )
        if (ep) toast.error('Reto guardado, pero hubo un error con las preguntas')
      }
    }

    toast.success(`Reto ${reto ? 'actualizado' : 'creado'} exitosamente`)
    onSave()
    setLoading(false)
  }

  const tipo = TIPO[nivel.tipo_proyecto] || TIPO.cafe

  const tipoEvidenciaLabel = {
    texto: '📝 Solo texto', imagen: '🖼️ Solo imagen', video: '🎥 Solo video',
    audio: '🎵 Solo audio', ambos: '📝+🖼️ Texto e imagen',
    multimedia: '🎬 Múltiples formatos', preguntas: '❓ Cuestionario',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-[#e8dcca]">

        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#4a3222]">
            {reto ? '✏️ Editar Reto' : '+ Nuevo Reto'}
          </h3>
          <p className="text-sm text-[#a68a64] mt-0.5">
            {tipo.icono} {nivel.grado}° · Nivel {nivel.numero_nivel}: {nivel.nombre}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Orden + texto */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Orden</label>
              <input type="number" name="orden" value={formData.orden} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm"
                min="1" required />
            </div>
            <div className="col-span-3">
              <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Texto del reto</label>
              <textarea name="texto" value={formData.texto} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm"
                rows="2" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#6b4c3a] font-medium mb-1">Instrucción de evidencia</label>
            <textarea name="instruccion_evidencia" value={formData.instruccion_evidencia} onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm"
              rows="2" placeholder="Ej: Sube una foto del portafolio, graba un video de la entrevista..." />
          </div>

          {/* Tipo de entrega */}
          <div className="border border-[#e8dcca] rounded-lg p-3">
            <h4 className="text-sm font-medium text-[#6b4c3a] mb-3">📎 ¿Qué debe entregar el estudiante?</h4>
            <label className="flex items-center gap-3 mb-3 p-2.5 bg-[#f5efe6] border border-[#e8dcca] rounded-lg cursor-pointer">
              <input type="checkbox" checked={formData.tiene_preguntas}
                onChange={e => handleTienePreguntasChange(e.target.checked)} className="w-4 h-4" />
              <div>
                <span className="text-sm font-medium text-[#4a3222]">❓ Este reto es un cuestionario</span>
                <p className="text-xs text-[#a68a64]">El estudiante responderá preguntas individualmente</p>
              </div>
            </label>

            {!formData.tiene_preguntas && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {opcionesArchivos.map(op => (
                  <label key={op.valor} className="flex items-center gap-2 p-2.5 border border-[#e8dcca] rounded-lg cursor-pointer hover:bg-[#f5efe6]">
                    <input type="checkbox" value={op.valor} checked={formData.tipos_archivo.includes(op.valor)}
                      onChange={e => handleTipoArchivoChange(op.valor, e.target.checked)} className="w-3.5 h-3.5" />
                    <div>
                      <div className="text-xs font-medium text-[#4a3222]">{op.label}</div>
                      <div className="text-[10px] text-[#a68a64]">{op.descripcion}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preguntas */}
          {formData.tiene_preguntas && (
            <div className="border border-[#e8dcca] rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-[#6b4c3a]">❓ Preguntas del cuestionario</h4>
                <button type="button"
                  onClick={() => setPreguntas([...preguntas, { texto: '', orden: preguntas.length + 1 }])}
                  className="text-xs bg-[#6b4c3a] text-white px-3 py-1 rounded-lg hover:bg-[#4a3222] transition">
                  + Agregar
                </button>
              </div>
              {cargandoPreguntas ? (
                <div className="text-center py-3 text-sm text-[#a68a64]">Cargando...</div>
              ) : preguntas.length === 0 ? (
                <div className="text-center py-4 bg-[#f5efe6] rounded-lg text-sm text-[#a68a64]">
                  Sin preguntas. Haz clic en "+ Agregar" para comenzar.
                </div>
              ) : (
                <div className="space-y-2">
                  {preguntas.map((pregunta, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2.5 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
                      <span className="w-5 h-5 rounded-full bg-[#d4c4a8] text-[#6b4c3a] text-xs flex items-center justify-center flex-shrink-0 mt-1 font-bold">
                        {idx + 1}
                      </span>
                      <textarea
                        value={pregunta.texto}
                        onChange={e => { const c = [...preguntas]; c[idx].texto = e.target.value; setPreguntas(c) }}
                        className="flex-1 px-2.5 py-1.5 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-sm"
                        rows="2" placeholder="Escribe la pregunta aquí..." required />
                      <button type="button"
                        onClick={() => { const f = preguntas.filter((_, i) => i !== idx); f.forEach((p, i) => { p.orden = i + 1 }); setPreguntas(f) }}
                        className="text-red-500 hover:text-red-700 mt-1 px-1.5 py-1 rounded hover:bg-red-50 transition text-xs">
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center gap-2 mt-3 cursor-pointer p-2 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
                <input type="checkbox" checked={formData.puntuacion_por_pregunta}
                  onChange={e => setFormData({ ...formData, puntuacion_por_pregunta: e.target.checked })}
                  className="w-4 h-4" />
                <div>
                  <span className="text-sm text-[#4a3222]">Calificar cada pregunta individualmente</span>
                  <p className="text-xs text-[#a68a64]">El padrino podrá asignar puntuación por pregunta</p>
                </div>
              </label>
            </div>
          )}

          {/* Resumen */}
          <div className="p-2.5 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
            <p className="text-xs text-[#6b4c3a]">
              📊 <strong>Tipo de evidencia:</strong> {tipoEvidenciaLabel[calcularTipoEvidencia()]}
              {formData.tiene_preguntas && <> · {preguntas.length} pregunta(s)</>}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#6b4c3a] text-white py-2 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition text-sm">
              {loading ? 'Verificando...' : 'Guardar Reto'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#e8dcca] text-[#6b4c3a] py-2 rounded-lg hover:bg-[#d4c4a8] transition text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
