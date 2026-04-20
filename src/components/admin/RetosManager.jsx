import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export function RetosManager() {
  const [retos, setRetos] = useState([])
  const [niveles, setNiveles] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroNivel, setFiltroNivel] = useState('')

  useEffect(() => {
    cargarNiveles()
    cargarRetos()
  }, [])

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
    let query = supabase
      .from('retos')
      .select(`
        *,
        nivel:nivel_id (id, nombre, grado, tipo_proyecto, numero_nivel)
      `)
      .order('nivel_id')
      .order('orden')

    if (filtroNivel) {
      query = query.eq('nivel_id', filtroNivel)
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
    if (confirm('¿Eliminar este reto?')) {
      const { error } = await supabase
        .from('retos')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Reto eliminado')
        cargarRetos()
      }
    }
  }

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

      {/* Filtro por nivel */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Filtrar retos por nivel</label>
        <select
          value={filtroNivel}
          onChange={(e) => {
            setFiltroNivel(e.target.value)
            setLoading(true)
            setTimeout(() => cargarRetos(), 100)
          }}
          className="px-3 py-2 border rounded-lg w-full md:w-96"
        >
          <option value="">Todos los niveles</option>
          {niveles.map(nivel => (
            <option key={nivel.id} value={nivel.id}>
              {nivel.tipo_proyecto === 'cafe' ? '☕' : '🌽'} {nivel.grado}° - Nivel {nivel.numero_nivel}: {nivel.nombre}
            </option>
          ))}
        </select>
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
                <th className="px-4 py-3 text-left">Tipo Evidencia</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retos.map((reto) => (
                <tr key={reto.id} className="border-t">
                  <td className="px-4 py-3 text-sm">
                    {reto.nivel?.grado}° - N{reto.nivel?.numero_nivel}: {reto.nivel?.nombre}
                  </td>
                  <td className="px-4 py-3">{reto.orden}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-md truncate">{reto.texto}</div>
                  </td>
                  <td className="px-4 py-3">
                    {reto.tipo_evidencia === 'texto' && '📝 Solo texto'}
                    {reto.tipo_evidencia === 'imagen' && '🖼️ Solo imagen'}
                    {reto.tipo_evidencia === 'ambos' && '📝+🖼️ Ambos'}
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

// Formulario para crear/editar retos
function FormularioReto({ reto, niveles, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nivel_id: reto?.nivel_id || '',
    texto: reto?.texto || '',
    tipo_evidencia: reto?.tipo_evidencia || 'texto',
    orden: reto?.orden || 1
  })
  const [loading, setLoading] = useState(false)
  
  // Estados para el selector por pasos
  const [tipoProyectoSeleccionado, setTipoProyectoSeleccionado] = useState('')
  const [gradoSeleccionado, setGradoSeleccionado] = useState('')
  const [nivelesDisponibles, setNivelesDisponibles] = useState([])

  // Obtener valores únicos para los filtros
  const tiposProyecto = [...new Set(niveles.map(n => n.tipo_proyecto))]
  const grados = [...new Set(niveles.map(n => n.grado))].sort()

  // Filtrar niveles por grado (sin importar el tipo de proyecto primero)
  useEffect(() => {
    if (gradoSeleccionado) {
      const filtrados = niveles.filter(n => n.grado === gradoSeleccionado)
      setNivelesDisponibles(filtrados)
    } else {
      setNivelesDisponibles([])
    }
  }, [gradoSeleccionado, niveles])

  // Si estamos editando, precargar los filtros
  useEffect(() => {
    if (reto && reto.nivel_id) {
      const nivel = niveles.find(n => n.id === reto.nivel_id)
      if (nivel) {
        setGradoSeleccionado(nivel.grado)
        setTipoProyectoSeleccionado(nivel.tipo_proyecto)
      }
    }
  }, [reto, niveles])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.nivel_id) {
      toast.error('Debes seleccionar un nivel')
      return
    }
    
    setLoading(true)

    let error
    if (reto) {
      const { error: updateError } = await supabase
        .from('retos')
        .update(formData)
        .eq('id', reto.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('retos')
        .insert(formData)
      error = insertError
    }

    if (error) {
      toast.error('Error al guardar el reto')
      console.error(error)
    } else {
      toast.success(`Reto ${reto ? 'actualizado' : 'creado'} exitosamente`)
      onSave()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {reto ? 'Editar Reto' : 'Nuevo Reto'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paso 1: Seleccionar GRADO (principal filtro) */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              1. Seleccionar Grado *
            </label>
            <select
              value={gradoSeleccionado}
              onChange={(e) => {
                setGradoSeleccionado(e.target.value)
                setTipoProyectoSeleccionado('')
                setFormData({...formData, nivel_id: ''})
              }}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">-- Seleccionar grado --</option>
              {grados.map(g => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </div>

          {/* Paso 2: Mostrar niveles disponibles para ese grado */}
          {gradoSeleccionado && (
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                2. Seleccionar Nivel *
              </label>
              <select
                name="nivel_id"
                value={formData.nivel_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">-- Seleccionar nivel --</option>
                {nivelesDisponibles.map(nivel => (
                  <option key={nivel.id} value={nivel.id}>
                    {nivel.tipo_proyecto === 'cafe' ? '☕' : '🌽'} Nivel {nivel.numero_nivel}: {nivel.nombre}
                  </option>
                ))}
              </select>
              {nivelesDisponibles.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  ⚠️ No hay niveles creados para este grado. Primero crea niveles en la pestaña "Niveles".
                </p>
              )}
            </div>
          )}

          {/* Paso 3: Orden dentro del nivel */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              3. Orden dentro del nivel *
            </label>
            <input
              type="number"
              name="orden"
              value={formData.orden}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ej: 1, 2, 3... Define el orden en que aparecerán los retos</p>
          </div>

          {/* Paso 4: Texto del Reto */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              4. Texto del Reto *
            </label>
            <textarea
              name="texto"
              value={formData.texto}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Escribe aquí el enunciado del reto..."
              required
            />
          </div>

          {/* Paso 5: Tipo de Evidencia */}
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              5. Tipo de Evidencia *
            </label>
            <select
              name="tipo_evidencia"
              value={formData.tipo_evidencia}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="texto">📝 Solo texto</option>
              <option value="imagen">🖼️ Solo imagen</option>
              <option value="ambos">📝 + 🖼️ Texto e imagen</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
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

        {/* Nota informativa */}
        {gradoSeleccionado && nivelesDisponibles.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 Los retos se mostrarán a los estudiantes en el orden que definiste. 
              Un mismo nivel puede tener múltiples retos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}