import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Instituciones que pueden seguir enviando evidencias tras el cierre del concurso.
// Una institución está habilitada si tiene al menos un padrino asignado.
export function InstitucionesHabilitadasManager() {
  const [instituciones, setInstituciones] = useState([])
  const [padrinos, setPadrinos] = useState([])
  const [filas, setFilas] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ institucion_id: '', padrino_user_id: '' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [inst, pad, hab] = await Promise.all([
      supabase.from('instituciones').select('id, nombre').order('nombre'),
      supabase.from('padrinos').select('user_id, nombre').eq('activo', true).order('nombre'),
      supabase.from('habilitaciones_institucion').select('id, institucion_id, padrino_user_id')
    ])
    if (inst.error || pad.error || hab.error) {
      toast.error('Error al cargar: ' + (inst.error || pad.error || hab.error).message)
    }
    setInstituciones(inst.data || [])
    setPadrinos(pad.data || [])
    setFilas(hab.data || [])
    setLoading(false)
  }

  async function handleAsignar(e) {
    e.preventDefault()
    if (!form.institucion_id || !form.padrino_user_id) {
      toast.error('Elige la institución y el padrino')
      return
    }
    const { error } = await supabase.from('habilitaciones_institucion').insert({
      institucion_id: Number(form.institucion_id),
      padrino_user_id: form.padrino_user_id
    })
    if (error) {
      toast.error(error.code === '23505' ? 'Ese padrino ya está asignado a la institución' : 'Error: ' + error.message)
      return
    }
    toast.success('Institución habilitada')
    setForm({ institucion_id: '', padrino_user_id: '' })
    cargar()
  }

  async function quitarFila(id) {
    const { error } = await supabase.from('habilitaciones_institucion').delete().eq('id', id)
    if (error) toast.error('Error: ' + error.message)
    else cargar()
  }

  async function deshabilitar(institucionId) {
    const { error } = await supabase.from('habilitaciones_institucion').delete().eq('institucion_id', institucionId)
    if (error) toast.error('Error: ' + error.message)
    else { toast.success('Institución deshabilitada'); cargar() }
  }

  const nombreInst = (id) => instituciones.find(i => i.id === id)?.nombre || `Institución ${id}`
  const nombrePadrino = (uid) => padrinos.find(p => p.user_id === uid)?.nombre || 'Padrino (inactivo o eliminado)'

  const porInstitucion = filas.reduce((acc, f) => {
    (acc[f.institucion_id] ||= []).push(f)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="bg-[#fff8e6] border border-amber-200 rounded-2xl p-4 text-sm text-[#6b4c3a]">
        Los estudiantes de una institución habilitada pueden seguir enviando evidencias aunque el plazo esté cerrado.
        Esas evidencias <strong>no suman puntos</strong>, no aparecen en el ranking ni en las estadísticas, y solo las ven
        el estudiante, el docente de su institución y los padrinos asignados aquí.
      </div>

      <form onSubmit={handleAsignar} className="bg-white rounded-2xl border border-[#e8dcca] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Institución</label>
          <select
            value={form.institucion_id}
            onChange={(e) => setForm(f => ({ ...f, institucion_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222]"
          >
            <option value="">Selecciona…</option>
            {instituciones.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Padrino que revisa</label>
          <select
            value={form.padrino_user_id}
            onChange={(e) => setForm(f => ({ ...f, padrino_user_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222]"
          >
            <option value="">Selecciona…</option>
            {padrinos.map(p => <option key={p.user_id} value={p.user_id}>{p.nombre}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
          Habilitar / asignar padrino
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[#a68a64]">Cargando…</p>
      ) : Object.keys(porInstitucion).length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8dcca] p-10 text-center text-sm text-[#a68a64]">
          Ninguna institución habilitada por ahora.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(porInstitucion).map(([institucionId, asignadas]) => (
            <div key={institucionId} className="bg-white rounded-2xl border border-[#e8dcca] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#4a3222]">🏫 {nombreInst(Number(institucionId))}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-0.5">Envío habilitado</p>
                </div>
                <button onClick={() => deshabilitar(Number(institucionId))} className="text-xs text-red-600 hover:text-red-700 font-medium">
                  Deshabilitar
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {asignadas.map(f => (
                  <span key={f.id} className="inline-flex items-center gap-1.5 text-xs bg-[#f5efe6] border border-[#e8dcca] text-[#6b4c3a] px-2.5 py-1 rounded-full">
                    👥 {nombrePadrino(f.padrino_user_id)}
                    <button onClick={() => quitarFila(f.id)} title="Quitar padrino" className="text-[#a68a64] hover:text-red-600">✕</button>
                  </span>
                ))}
              </div>
              {asignadas.length === 1 && (
                <p className="text-[11px] text-[#a68a64] mt-2">Si quitas al único padrino, la institución se deshabilita.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
