import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export function NivelesManager() {
  const [niveles, setNiveles] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    cargarNiveles()
  }, [])

  async function cargarNiveles() {
    const { data, error } = await supabase
      .from('niveles')
      .select('*')
      .order('tipo_proyecto')
      .order('grado')
      .order('numero_nivel')

    if (error) {
      toast.error('Error al cargar niveles')
    } else {
      setNiveles(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (confirm('¿Eliminar este nivel? También se eliminarán sus retos.')) {
      const { error } = await supabase.from('niveles').delete().eq('id', id)
      if (error) {
        toast.error('Error al eliminar')
      } else {
        toast.success('Nivel eliminado')
        cargarNiveles()
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4a3222]">Gestión de Niveles</h2>
        <button
          onClick={() => { setEditando(null); setMostrarFormulario(true) }}
          className="bg-[#6b4c3a] text-white px-4 py-2 rounded-lg hover:bg-[#4a3222] transition"
        >
          + Nuevo Nivel
        </button>
      </div>

      {mostrarFormulario && (
        <FormularioNivel
          nivel={editando}
          onClose={() => setMostrarFormulario(false)}
          onSave={() => { setMostrarFormulario(false); cargarNiveles() }}
        />
      )}

      {loading ? (
        <div className="text-center py-8 text-[#a68a64]">Cargando...</div>
      ) : niveles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-8 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-[#a68a64]">No hay niveles creados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f5efe6]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Proyecto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Grado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Nivel</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#6b4c3a]">Nombre</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#6b4c3a]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {niveles.map((nivel) => (
                <tr key={nivel.id} className="border-t border-[#e8dcca] hover:bg-[#f5efe6] transition">
                  <td className="px-4 py-3 text-[#4a3222]">
                    {nivel.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
                  </td>
                  <td className="px-4 py-3 text-[#4a3222]">{nivel.grado}°</td>
                  <td className="px-4 py-3 text-[#4a3222]">Nivel {nivel.numero_nivel}</td>
                  <td className="px-4 py-3 text-[#4a3222]">{nivel.nombre}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => { setEditando(nivel); setMostrarFormulario(true) }}
                      className="text-[#6b4c3a] hover:text-[#4a3222] font-medium mr-4 text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(nivel.id)}
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

function FormularioNivel({ nivel, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tipo_proyecto: nivel?.tipo_proyecto || 'cafe',
    grado: nivel?.grado || '5',
    numero_nivel: nivel?.numero_nivel || 1,
    nombre: nivel?.nombre || '',
    imagen_url: nivel?.imagen_url || ''
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    let error
    if (nivel) {
      const { error: updateError } = await supabase.from('niveles').update(formData).eq('id', nivel.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('niveles').insert(formData)
      error = insertError
    }

    if (error) {
      toast.error('Error al guardar el nivel')
    } else {
      toast.success(`Nivel ${nivel ? 'actualizado' : 'creado'} exitosamente`)
      onSave()
    }
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
            <label className="block text-[#6b4c3a] font-medium mb-1">Tipo de Proyecto</label>
            <select
              name="tipo_proyecto"
              value={formData.tipo_proyecto}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
              required
            >
              <option value="cafe">☕ Escuela y Café</option>
              <option value="alimentacion">🌽 Seguridad Alimentaria</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6b4c3a] font-medium mb-1">Grado</label>
            <select
              name="grado"
              value={formData.grado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
              required
            >
              {[4,5,6,7,8,9,10,11].map(g => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6b4c3a] font-medium mb-1">Número de Nivel</label>
            <select
              name="numero_nivel"
              value={formData.numero_nivel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
              required
            >
              {[1,2,3,4].map(n => (
                <option key={n} value={n}>Nivel {n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6b4c3a] font-medium mb-1">Nombre del Nivel</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[#6b4c3a] font-medium mb-1">URL de Imagen (opcional)</label>
            <input
              type="url"
              name="imagen_url"
              value={formData.imagen_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#6b4c3a] text-white py-2 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition"
            >
              {loading ? 'Guardando...' : 'Guardar'}
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
