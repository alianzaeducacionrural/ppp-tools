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
      .select(`
        *,
        nivel:nivel_id (id, nombre, grado, tipo_proyecto, numero_nivel)
      `)
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
        <h2 className="text-xl font-semibold">Gestión de Retos</h2>
        <button
          onClick={() => {
            setEditando(null)
            setMostrarFormulario(true)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + Nuevo Reto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Proyecto</label>
            <select
              value={filtros.tipo_proyecto}
              onChange={(e) => setFiltros({ ...filtros, tipo_proyecto: e.target.value, nivel_id: '' })}
              className="w-full px-3 py-2 border rounded-lg"
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
            <label className="block text-sm text-gray-600 mb-1">Grado</label>
            <select
              value={filtros.grado}
              onChange={(e) => setFiltros({ ...filtros, grado: e.target.value, nivel_id: '' })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos</option>
              {gradosUnicos.map(g => (
                <option key={g.grado} value={g.grado}>{g.grado}°</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nivel</label>
            <select
              value={filtros.nivel_id}
              onChange={(e) => setFiltros({ ...filtros, nivel_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
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
          onSave={() => {
            setMostrarFormulario(false)
            cargarRetos()
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : retos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No hay retos creados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Reto</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Archivos</th>
                <th className="px-4 py-3 text-left">Preguntas</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retos.map((reto) => (
                <tr key={reto.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {reto.nivel?.grado}° - N{reto.nivel?.numero_nivel}: {reto.nivel?.nombre}
                  </td>
                  <td className="px-4 py-3">{reto.orden}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-md truncate" title={reto.texto}>{reto.texto}</div>
                    {reto.instruccion_evidencia && (
                      <div className="text-xs text-gray-400 mt-1">
                        📌 {reto.instruccion_evidencia}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
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
                        <span key={tipo} className="text-xs px-1 py-0.5 bg-gray-100 rounded" title={tipo}>
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
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Preguntas
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setEditando(reto)
                        setMostrarFormulario(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(reto.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
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
    if (reto && reto.id && reto.tiene_preguntas) {
      cargarPreguntas()
    }
  }, [reto])

  async function cargarPreguntas() {
    setCargandoPreguntas(true)
    const { data } = await supabase
      .from('preguntas')
      .select('*')
      .eq('reto_id', reto.id)
      .order('orden')
    if (data) setPreguntas(data)
    setCargandoPreguntas(false)
  }

  useEffect(() => {
    if (gradoSeleccionado && tipoProyectoSeleccionado) {
      const filtrados = niveles.filter(n => 
        n.grado === gradoSeleccionado && n.tipo_proyecto === tipoProyectoSeleccionado
      )
      setNivelesDisponibles(filtrados)
    } else {
      setNivelesDisponibles([])
    }
  }, [gradoSeleccionado, tipoProyectoSeleccionado, niveles])

  useEffect(() => {
    if (reto && reto.nivel_id) {
      const nivel = niveles.find(n => n.id === reto.nivel_id)
      if (nivel) {
        setGradoSeleccionado(nivel.grado)
        setTipoProyectoSeleccionado(nivel.tipo_proyecto)
      }
    }
  }, [reto, niveles])

  const handleTipoArchivoChange = (tipo, checked) => {
    let nuevosTipos
    if (checked) {
      nuevosTipos = [...formData.tipos_archivo, tipo]
    } else {
      nuevosTipos = formData.tipos_archivo.filter(t => t !== tipo)
    }
    setFormData({ ...formData, tipos_archivo: nuevosTipos })
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
    setFormData({ 
      ...formData, 
      tiene_preguntas: checked,
      tipos_archivo: checked ? [] : formData.tipos_archivo
    })
    if (!checked) setPreguntas([])
  }

  const handlePreguntaChange = (index, field, value) => {
    const nuevasPreguntas = [...preguntas]
    nuevasPreguntas[index][field] = value
    setPreguntas(nuevasPreguntas)
  }

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { texto: '', orden: preguntas.length + 1 }])
  }

  const eliminarPregunta = (index) => {
    const nuevasPreguntas = preguntas.filter((_, i) => i !== index)
    nuevasPreguntas.forEach((p, i) => p.orden = i + 1)
    setPreguntas(nuevasPreguntas)
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.nivel_id) {
      toast.error('Debes seleccionar un nivel')
      return
    }
    
    if (formData.tiene_preguntas && preguntas.length === 0) {
      toast.error('Debes agregar al menos una pregunta')
      return
    }
    
    setLoading(true)

    const tipoEvidencia = calcularTipoEvidencia()
    const dataToSave = {
      nivel_id: formData.nivel_id,
      orden: formData.orden,
      texto: formData.texto,
      instruccion_evidencia: formData.instruccion_evidencia,
      tipo_evidencia: tipoEvidencia,
      tipos_archivo: formData.tipos_archivo,
      tiene_preguntas: formData.tiene_preguntas,
      puntuacion_por_pregunta: formData.puntuacion_por_pregunta
    }

    let retoId
    let error

    if (reto) {
      const { data, error: updateError } = await supabase
        .from('retos')
        .update(dataToSave)
        .eq('id', reto.id)
        .select()
      error = updateError
      retoId = reto.id
    } else {
      const { data, error: insertError } = await supabase
        .from('retos')
        .insert(dataToSave)
        .select()
      error = insertError
      retoId = data?.[0]?.id
    }

    if (error) {
      toast.error('Error al guardar el reto')
      console.error(error)
      setLoading(false)
      return
    }

    if (formData.tiene_preguntas && retoId) {
      await supabase.from('preguntas').delete().eq('reto_id', retoId)
      
      if (preguntas.length > 0) {
        const preguntasToInsert = preguntas.map(p => ({
          reto_id: retoId,
          texto: p.texto,
          orden: p.orden
        }))
        const { error: preguntasError } = await supabase
          .from('preguntas')
          .insert(preguntasToInsert)
        
        if (preguntasError) {
          toast.error('Reto guardado pero hubo error con las preguntas')
          console.error(preguntasError)
        }
      }
    }

    toast.success(`Reto ${reto ? 'actualizado' : 'creado'} exitosamente`)
    onSave()
    setLoading(false)
  }

  const tipoEvidenciaActual = calcularTipoEvidencia()
  const tipoEvidenciaLabel = {
    texto: '📝 Solo texto',
    imagen: '🖼️ Solo imagen',
    video: '🎥 Solo video',
    audio: '🎵 Solo audio',
    ambos: '📝+🖼️ Texto e imagen',
    multimedia: '🎬 Múltiples formatos',
    preguntas: '❓ Cuestionario'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {reto ? 'Editar Reto' : 'Nuevo Reto'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b pb-3">
            <h4 className="font-medium text-gray-700 mb-3">📍 Ubicación del reto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Tipo de Proyecto</label>
                <select
                  value={tipoProyectoSeleccionado}
                  onChange={(e) => {
                    setTipoProyectoSeleccionado(e.target.value)
                    setFormData({ ...formData, nivel_id: '' })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar</option>
                  {tiposProyecto.map(tp => (
                    <option key={tp} value={tp}>
                      {tp === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Grado</label>
                <select
                  value={gradoSeleccionado}
                  onChange={(e) => {
                    setGradoSeleccionado(e.target.value)
                    setFormData({ ...formData, nivel_id: '' })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar</option>
                  {grados.map(g => (
                    <option key={g} value={g}>{g}°</option>
                  ))}
                </select>
              </div>
            </div>
            {tipoProyectoSeleccionado && gradoSeleccionado && (
              <div className="mt-3">
                <label className="block text-gray-700 mb-1">Nivel</label>
                <select
                  name="nivel_id"
                  value={formData.nivel_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar nivel</option>
                  {nivelesDisponibles.map(nivel => (
                    <option key={nivel.id} value={nivel.id}>
                      Nivel {nivel.numero_nivel}: {nivel.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-b pb-3">
            <h4 className="font-medium text-gray-700 mb-3">📝 Contenido del reto</h4>
            <div>
              <label className="block text-gray-700 mb-1">Orden dentro del nivel</label>
              <input
                type="number"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                required
              />
            </div>
            <div className="mt-3">
              <label className="block text-gray-700 mb-1">Texto del reto</label>
              <textarea
                name="texto"
                value={formData.texto}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
                required
              />
            </div>
            <div className="mt-3">
              <label className="block text-gray-700 mb-1">
                Instrucción de evidencia (qué debe subir el estudiante)
              </label>
              <textarea
                name="instruccion_evidencia"
                value={formData.instruccion_evidencia}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                rows="2"
                placeholder="Ej: Subir foto del portafolio decorado, video de la entrevista, etc."
              />
            </div>
          </div>

          <div className="border-b pb-3">
            <h4 className="font-medium text-gray-700 mb-3">📎 ¿Qué debe entregar el estudiante?</h4>
            
            <label className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tiene_preguntas}
                onChange={(e) => handleTienePreguntasChange(e.target.checked)}
                className="w-5 h-5 text-blue-600"
              />
              <div>
                <span className="font-medium">❓ Este reto es un cuestionario de preguntas</span>
                <p className="text-sm text-gray-500">El estudiante responderá preguntas individualmente (no subirá archivos)</p>
              </div>
            </label>

            {!formData.tiene_preguntas && (
              <>
                <label className="block text-gray-700 mb-2 font-medium">
                  Tipos de archivo permitidos (selecciona uno o varios)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {opcionesArchivos.map(op => (
                    <label key={op.valor} className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={op.valor}
                        checked={formData.tipos_archivo.includes(op.valor)}
                        onChange={(e) => handleTipoArchivoChange(op.valor, e.target.checked)}
                        className="w-4 h-4 mt-0.5"
                      />
                      <div>
                        <div className="font-medium">{op.label}</div>
                        <div className="text-xs text-gray-400">{op.descripcion}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {formData.tiene_preguntas && (
            <div className="border-b pb-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">❓ Preguntas del cuestionario</h4>
                <button
                  type="button"
                  onClick={agregarPregunta}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                >
                  + Agregar pregunta
                </button>
              </div>
              
              {cargandoPreguntas ? (
                <div className="text-center py-4">Cargando preguntas...</div>
              ) : preguntas.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500">
                  No hay preguntas agregadas. Haz clic en "Agregar pregunta" para comenzar.
                </div>
              ) : (
                <div className="space-y-3">
                  {preguntas.map((pregunta, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Pregunta {idx + 1}</label>
                        <textarea
                          value={pregunta.texto}
                          onChange={(e) => handlePreguntaChange(idx, 'texto', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows="2"
                          placeholder="Escribe la pregunta aquí..."
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarPregunta(idx)}
                        className="mt-6 text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.puntuacion_por_pregunta}
                    onChange={(e) => setFormData({ ...formData, puntuacion_por_pregunta: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Calificar cada pregunta individualmente</span>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Si activas esto, el padrino podrá asignar una puntuación por cada pregunta (0-100).
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              📊 <strong>Resumen del reto:</strong> {tipoEvidenciaLabel[tipoEvidenciaActual]}
              {!formData.tiene_preguntas && formData.tipos_archivo.length > 0 && (
                <> · Archivos permitidos: {formData.tipos_archivo.join(', ')}</>
              )}
              {formData.tiene_preguntas && (
                <> · {preguntas.length} pregunta(s) configurada(s)</>
              )}
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Reto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}