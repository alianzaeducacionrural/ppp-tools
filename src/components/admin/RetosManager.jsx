import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export function RetosManager() {
  const [retos, setRetos] = useState([])
  const [niveles, setNiveles] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtros, setFiltros] = useState({ grado: '', tipo_proyecto: '', nivel_id: '' })

  useEffect(() => {
    cargarNiveles()
  }, [])

  useEffect(() => {
    cargarRetos()
  }, [filtros])

  async function cargarNiveles() {
    const { data } = await supabase
      .from('niveles')
      .select('id, nombre, grado, tipo_proyecto, numero_nivel')
      .order('tipo_proyecto')
      .order('grado')
      .order('numero_nivel')
    if (data) setNiveles(data)
  }

  async function cargarRetos() {
    setLoading(true)
    let query = supabase
      .from('retos')
      .select(`*, nivel:nivel_id (id, nombre, grado, tipo_proyecto, numero_nivel)`)
      .order('nivel_id')
      .order('orden')

    if (filtros.nivel_id) {
      query = query.eq('nivel_id', filtros.nivel_id)
    }

    const { data, error } = await query
    if (error) {
      toast.error('Error al cargar retos')
    } else {
      setRetos(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (confirm('¿Eliminar este reto? También se eliminarán sus preguntas asociadas.')) {
      const { error } = await supabase.from('retos').delete().eq('id', id)
      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Reto eliminado')
        cargarRetos()
      }
    }
  }

  const gradosUnicos = [...new Map(niveles.map(n => [n.grado, { grado: n.grado }])).values()].sort((a, b) => a.grado - b.grado)
  const tiposProyectoUnicos = [...new Map(niveles.map(n => [n.tipo_proyecto, { tipo_proyecto: n.tipo_proyecto }])).values()]

  const nivelesFiltrados = niveles.filter(n => {
    if (filtros.grado && n.grado !== filtros.grado) return false
    if (filtros.tipo_proyecto && n.tipo_proyecto !== filtros.tipo_proyecto) return false
    return true
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4a3222]">Gestión de Retos</h2>
        <button
          onClick={() => { setEditando(null); setMostrarFormulario(true) }}
          className="bg-[#6b4c3a] text-white px-4 py-2 rounded-lg hover:bg-[#4a3222] transition"
        >
          + Nuevo Reto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-[#6b4c3a] mb-1 font-medium">Proyecto</label>
            <select
              value={filtros.tipo_proyecto}
              onChange={(e) => setFiltros({ ...filtros, tipo_proyecto: e.target.value, nivel_id: '' })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
            >
              <option value="">Todos</option>
              {tiposProyectoUnicos.map(tp => (
                <option key={tp.tipo_proyecto} value={tp.tipo_proyecto}>
                  {tp.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#6b4c3a] mb-1 font-medium">Grado</label>
            <select
              value={filtros.grado}
              onChange={(e) => setFiltros({ ...filtros, grado: e.target.value, nivel_id: '' })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
            >
              <option value="">Todos</option>
              {gradosUnicos.map(g => (
                <option key={g.grado} value={g.grado}>{g.grado}°</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#6b4c3a] mb-1 font-medium">Nivel</label>
            <select
              value={filtros.nivel_id}
              onChange={(e) => setFiltros({ ...filtros, nivel_id: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
            >
              <option value="">Todos</option>
              {nivelesFiltrados.map(n => (
                <option key={n.id} value={n.id}>
                  {n.tipo_proyecto === 'cafe' ? '☕' : '🌽'} Nivel {n.numero_nivel}: {n.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <FormularioReto
          reto={editando}
          niveles={niveles}
          onClose={() => setMostrarFormulario(false)}
          onSave={() => { setMostrarFormulario(false); cargarRetos() }}
        />
      )}

      {loading ? (
        <div className="text-center py-8 text-[#a68a64]">Cargando...</div>
      ) : retos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-8 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-[#a68a64]">No hay retos creados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f5efe6]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Nivel</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Orden</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Reto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Archivos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Preguntas</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b4c3a]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retos.map((reto) => (
                <tr key={reto.id} className="border-t border-[#e8dcca] hover:bg-[#f5efe6] transition">
                  <td className="px-4 py-3 text-sm text-[#4a3222]">
                    {reto.nivel?.grado}° - N{reto.nivel?.numero_nivel}: {reto.nivel?.nombre}
                  </td>
                  <td className="px-4 py-3 text-[#4a3222]">{reto.orden}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-md truncate text-[#4a3222]" title={reto.texto}>{reto.texto}</div>
                    {reto.instruccion_evidencia && (
                      <div className="text-xs text-[#a68a64] mt-1">📌 {reto.instruccion_evidencia}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#4a3222]">
                    {reto.tipo_evidencia === 'texto' && '📝 Texto'}
                    {reto.tipo_evidencia === 'imagen' && '🖼️ Imagen'}
                    {reto.tipo_evidencia === 'video' && '🎥 Video'}
                    {reto.tipo_evidencia === 'audio' && '🎵 Audio'}
                    {reto.tipo_evidencia === 'ambos' && '📝+🖼️ Ambos'}
                    {reto.tipo_evidencia === 'multimedia' && '🎬 Multimedia'}
                    {reto.tipo_evidencia === 'preguntas' && '❓ Cuestionario'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {reto.tipos_archivo?.map(tipo => (
                        <span key={tipo} className="text-xs px-1.5 py-0.5 bg-[#f5efe6] border border-[#e8dcca] rounded text-[#6b4c3a]">
                          {tipo === 'imagen' && '🖼️'}
                          {tipo === 'video' && '🎥'}
                          {tipo === 'audio' && '🎵'}
                          {tipo === 'texto' && '📝'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reto.tiene_preguntas ? (
                      <span className="text-xs bg-[#f5efe6] border border-[#e8dcca] text-[#6b4c3a] px-2 py-1 rounded-full">
                        Preguntas
                      </span>
                    ) : (
                      <span className="text-[#a68a64] text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => { setEditando(reto); setMostrarFormulario(true) }}
                      className="text-[#6b4c3a] hover:text-[#4a3222] mr-3 text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(reto.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================
// FORMULARIO PARA CREAR/EDITAR RETOS
// ============================================
function FormularioReto({ reto, niveles, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nivel_id: reto?.nivel_id || '',
    orden: reto?.orden || 1,
    texto: reto?.texto || '',
    instruccion_evidencia: reto?.instruccion_evidencia || '',
    tipos_archivo: reto?.tipos_archivo || [],
    tiene_preguntas: reto?.tiene_preguntas || false,
    puntuacion_por_pregunta: reto?.puntuacion_por_pregunta || false
  })
  const [preguntas, setPreguntas] = useState([])
  const [loading, setLoading] = useState(false)
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false)
  const [tipoProyectoSeleccionado, setTipoProyectoSeleccionado] = useState('')
  const [gradoSeleccionado, setGradoSeleccionado] = useState('')
  const [nivelesDisponibles, setNivelesDisponibles] = useState([])

  const opcionesArchivos = [
    { valor: 'imagen', label: '🖼️ Imagen', descripcion: 'JPG, PNG, GIF' },
    { valor: 'video', label: '🎥 Video', descripcion: 'MP4, MOV, AVI' },
    { valor: 'audio', label: '🎵 Audio', descripcion: 'MP3, WAV' },
    { valor: 'texto', label: '📝 Texto', descripcion: 'Respuesta escrita' }
  ]

  const tiposProyecto = [...new Map(niveles.map(n => [n.tipo_proyecto, n.tipo_proyecto])).values()]
  const grados = [...new Map(niveles.map(n => [n.grado, n.grado])).values()].sort()

  useEffect(() => {
    if (reto?.id && reto.tiene_preguntas) cargarPreguntas()
  }, [reto])

  useEffect(() => {
    if (reto?.nivel_id) {
      const nivel = niveles.find(n => n.id === reto.nivel_id)
      if (nivel) {
        setGradoSeleccionado(nivel.grado)
        setTipoProyectoSeleccionado(nivel.tipo_proyecto)
      }
    }
  }, [reto, niveles])

  useEffect(() => {
    if (gradoSeleccionado && tipoProyectoSeleccionado) {
      setNivelesDisponibles(niveles.filter(n => n.grado === gradoSeleccionado && n.tipo_proyecto === tipoProyectoSeleccionado))
    } else {
      setNivelesDisponibles([])
    }
  }, [gradoSeleccionado, tipoProyectoSeleccionado, niveles])

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
        : formData.tipos_archivo.filter(t => t !== tipo)
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
    if (!formData.nivel_id) { toast.error('Debes seleccionar un nivel'); return }
    if (formData.tiene_preguntas && preguntas.length === 0) { toast.error('Debes agregar al menos una pregunta'); return }

    setLoading(true)

    const dataToSave = {
      nivel_id: formData.nivel_id,
      orden: formData.orden,
      texto: formData.texto,
      instruccion_evidencia: formData.instruccion_evidencia,
      tipo_evidencia: calcularTipoEvidencia(),
      tipos_archivo: formData.tipos_archivo,
      tiene_preguntas: formData.tiene_preguntas,
      puntuacion_por_pregunta: formData.puntuacion_por_pregunta
    }

    let retoId, error
    if (reto) {
      const { error: updateError } = await supabase.from('retos').update(dataToSave).eq('id', reto.id).select()
      error = updateError
      retoId = reto.id
    } else {
      const { data, error: insertError } = await supabase.from('retos').insert(dataToSave).select()
      error = insertError
      retoId = data?.[0]?.id
    }

    if (error) {
      toast.error('Error al guardar el reto')
      setLoading(false)
      return
    }

    if (formData.tiene_preguntas && retoId) {
      await supabase.from('preguntas').delete().eq('reto_id', retoId)
      if (preguntas.length > 0) {
        const { error: preguntasError } = await supabase.from('preguntas').insert(
          preguntas.map(p => ({ reto_id: retoId, texto: p.texto, orden: p.orden }))
        )
        if (preguntasError) toast.error('Reto guardado pero hubo error con las preguntas')
      }
    }

    toast.success(`Reto ${reto ? 'actualizado' : 'creado'} exitosamente`)
    onSave()
    setLoading(false)
  }

  const tipoEvidenciaActual = calcularTipoEvidencia()
  const tipoEvidenciaLabel = {
    texto: '📝 Solo texto', imagen: '🖼️ Solo imagen', video: '🎥 Solo video',
    audio: '🎵 Solo audio', ambos: '📝+🖼️ Texto e imagen',
    multimedia: '🎬 Múltiples formatos', preguntas: '❓ Cuestionario'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-[#e8dcca]">
        <h3 className="text-lg font-semibold text-[#4a3222] mb-4">
          {reto ? '✏️ Editar Reto' : '+ Nuevo Reto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b border-[#e8dcca] pb-3">
            <h4 className="font-medium text-[#6b4c3a] mb-3">📍 Ubicación del reto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6b4c3a] mb-1 font-medium">Tipo de Proyecto</label>
                <select
                  value={tipoProyectoSeleccionado}
                  onChange={(e) => { setTipoProyectoSeleccionado(e.target.value); setFormData({ ...formData, nivel_id: '' }) }}
                  className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                  required
                >
                  <option value="">Seleccionar</option>
                  {tiposProyecto.map(tp => (
                    <option key={tp} value={tp}>{tp === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#6b4c3a] mb-1 font-medium">Grado</label>
                <select
                  value={gradoSeleccionado}
                  onChange={(e) => { setGradoSeleccionado(e.target.value); setFormData({ ...formData, nivel_id: '' }) }}
                  className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                  required
                >
                  <option value="">Seleccionar</option>
                  {grados.map(g => <option key={g} value={g}>{g}°</option>)}
                </select>
              </div>
            </div>
            {tipoProyectoSeleccionado && gradoSeleccionado && (
              <div className="mt-3">
                <label className="block text-[#6b4c3a] mb-1 font-medium">Nivel</label>
                <select
                  name="nivel_id"
                  value={formData.nivel_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                  required
                >
                  <option value="">Seleccionar nivel</option>
                  {nivelesDisponibles.map(nivel => (
                    <option key={nivel.id} value={nivel.id}>Nivel {nivel.numero_nivel}: {nivel.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-b border-[#e8dcca] pb-3">
            <h4 className="font-medium text-[#6b4c3a] mb-3">📝 Contenido del reto</h4>
            <div>
              <label className="block text-[#6b4c3a] mb-1 font-medium">Orden dentro del nivel</label>
              <input
                type="number"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                min="1"
                required
              />
            </div>
            <div className="mt-3">
              <label className="block text-[#6b4c3a] mb-1 font-medium">Texto del reto</label>
              <textarea
                name="texto"
                value={formData.texto}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                rows="3"
                required
              />
            </div>
            <div className="mt-3">
              <label className="block text-[#6b4c3a] mb-1 font-medium">Instrucción de evidencia</label>
              <textarea
                name="instruccion_evidencia"
                value={formData.instruccion_evidencia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                rows="2"
                placeholder="Ej: Subir foto del portafolio decorado, video de la entrevista, etc."
              />
            </div>
          </div>

          <div className="border-b border-[#e8dcca] pb-3">
            <h4 className="font-medium text-[#6b4c3a] mb-3">📎 ¿Qué debe entregar el estudiante?</h4>
            <label className="flex items-center gap-3 mb-4 p-3 bg-[#f5efe6] border border-[#e8dcca] rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tiene_preguntas}
                onChange={(e) => handleTienePreguntasChange(e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <span className="font-medium text-[#4a3222]">❓ Este reto es un cuestionario de preguntas</span>
                <p className="text-sm text-[#a68a64]">El estudiante responderá preguntas individualmente</p>
              </div>
            </label>

            {!formData.tiene_preguntas && (
              <>
                <label className="block text-[#6b4c3a] mb-2 font-medium">
                  Tipos de archivo permitidos (selecciona uno o varios)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {opcionesArchivos.map(op => (
                    <label key={op.valor} className="flex items-start gap-2 p-3 border border-[#e8dcca] rounded-lg cursor-pointer hover:bg-[#f5efe6]">
                      <input
                        type="checkbox"
                        value={op.valor}
                        checked={formData.tipos_archivo.includes(op.valor)}
                        onChange={(e) => handleTipoArchivoChange(op.valor, e.target.checked)}
                        className="w-4 h-4 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-[#4a3222]">{op.label}</div>
                        <div className="text-xs text-[#a68a64]">{op.descripcion}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {formData.tiene_preguntas && (
            <div className="border-b border-[#e8dcca] pb-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-[#6b4c3a]">❓ Preguntas del cuestionario</h4>
                <button
                  type="button"
                  onClick={() => setPreguntas([...preguntas, { texto: '', orden: preguntas.length + 1 }])}
                  className="text-sm bg-[#6b4c3a] text-white px-3 py-1 rounded-lg hover:bg-[#4a3222] transition"
                >
                  + Agregar pregunta
                </button>
              </div>

              {cargandoPreguntas ? (
                <div className="text-center py-4 text-[#a68a64]">Cargando preguntas...</div>
              ) : preguntas.length === 0 ? (
                <div className="text-center py-6 bg-[#f5efe6] rounded-lg text-[#a68a64]">
                  No hay preguntas. Haz clic en "Agregar pregunta" para comenzar.
                </div>
              ) : (
                <div className="space-y-3">
                  {preguntas.map((pregunta, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm text-[#6b4c3a] mb-1">Pregunta {idx + 1}</label>
                        <textarea
                          value={pregunta.texto}
                          onChange={(e) => {
                            const copia = [...preguntas]
                            copia[idx].texto = e.target.value
                            setPreguntas(copia)
                          }}
                          className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
                          rows="2"
                          placeholder="Escribe la pregunta aquí..."
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const filtradas = preguntas.filter((_, i) => i !== idx)
                          filtradas.forEach((p, i) => { p.orden = i + 1 })
                          setPreguntas(filtradas)
                        }}
                        className="mt-6 text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 p-3 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.puntuacion_por_pregunta}
                    onChange={(e) => setFormData({ ...formData, puntuacion_por_pregunta: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#4a3222]">Calificar cada pregunta individualmente</span>
                </label>
                <p className="text-xs text-[#a68a64] mt-2">
                  Si activas esto, el padrino podrá asignar una puntuación por cada pregunta (0-100).
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
            <p className="text-sm text-[#6b4c3a]">
              📊 <strong>Resumen:</strong> {tipoEvidenciaLabel[tipoEvidenciaActual]}
              {!formData.tiene_preguntas && formData.tipos_archivo.length > 0 && (
                <> · Archivos: {formData.tipos_archivo.join(', ')}</>
              )}
              {formData.tiene_preguntas && <> · {preguntas.length} pregunta(s)</>}
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#e8dcca]">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#6b4c3a] text-white py-2 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition"
            >
              {loading ? 'Guardando...' : 'Guardar Reto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#e8dcca] text-[#6b4c3a] py-2 rounded-lg hover:bg-[#d4c4a8] transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
