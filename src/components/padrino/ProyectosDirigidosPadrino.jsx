import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ImageViewer } from '../comunes/ImageViewer'

function DashboardProyectosDirigidos() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ estado: 'pendiente', tipo_proyecto: '', municipio: '' })
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, rechazados: 0 })
  const [municipios, setMunicipios] = useState([])

  useEffect(() => {
    cargarMunicipios()
  }, [])

  useEffect(() => {
    cargarProyectos()
  }, [filtros])

  async function cargarMunicipios() {
    const { data } = await supabase.from('municipios').select('id, nombre').order('nombre')
    if (data) setMunicipios(data)
  }

  async function cargarProyectos() {
    setLoading(true)
    try {
      let query = supabase.from('proyectos_dirigidos').select('*').order('fecha_envio', { ascending: false })
      if (filtros.estado) query = query.eq('estado', filtros.estado)
      if (filtros.tipo_proyecto) query = query.eq('tipo_proyecto', filtros.tipo_proyecto)

      const { data: proyectosData, error } = await query
      if (error) {
        toast.error('Error al cargar los proyectos dirigidos')
        setLoading(false)
        return
      }
      if (!proyectosData?.length) {
        setProyectos([])
        setStats({ pendientes: 0, aprobados: 0, rechazados: 0 })
        setLoading(false)
        return
      }

      const docenteIds = [...new Set(proyectosData.map(p => p.docente_id))]
      const proyectoIds = proyectosData.map(p => p.id)

      const [{ data: docentesData }, { data: costosData }, { data: utilidadesData }, { data: archivosData }] = await Promise.all([
        supabase.from('docentes').select('id, nombre_completo, cargo, telefono, email, municipio_id, institucion_id, municipios (nombre), instituciones (nombre)').in('id', docenteIds),
        supabase.from('proyecto_dirigido_costos').select('*').in('proyecto_dirigido_id', proyectoIds).order('orden'),
        supabase.from('proyecto_dirigido_utilidades').select('*').in('proyecto_dirigido_id', proyectoIds).order('orden'),
        supabase.from('proyecto_dirigido_archivos').select('*').in('proyecto_dirigido_id', proyectoIds).order('orden')
      ])

      const docentesMap = Object.fromEntries((docentesData || []).map(d => [d.id, d]))

      let completos = proyectosData
        .map(p => ({
          ...p,
          docente: docentesMap[p.docente_id],
          costos: (costosData || []).filter(c => c.proyecto_dirigido_id === p.id),
          utilidades: (utilidadesData || []).filter(u => u.proyecto_dirigido_id === p.id),
          archivos: (archivosData || []).filter(a => a.proyecto_dirigido_id === p.id)
        }))
        .filter(p => p.docente != null)

      if (filtros.municipio) {
        completos = completos.filter(p => p.docente?.municipio_id === parseInt(filtros.municipio))
      }

      setProyectos(completos)
      setStats({
        pendientes: proyectosData.filter(p => p.estado === 'pendiente').length,
        aprobados: proyectosData.filter(p => p.estado === 'aprobado').length,
        rechazados: proyectosData.filter(p => p.estado === 'rechazado').length
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar los proyectos dirigidos')
    }
    setLoading(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#4a3222] flex items-center gap-2">🌱 Proyectos Dirigidos</h1>
        <p className="text-sm text-[#a68a64] mt-0.5">Revisa y califica los proyectos dirigidos de los docentes</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-amber-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg mb-2">⏳</div>
          <p className="text-2xl font-bold text-[#4a3222]">{stats.pendientes}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-0.5">Pendientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg mb-2">✅</div>
          <p className="text-2xl font-bold text-[#4a3222]">{stats.aprobados}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-0.5">Aprobados</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-lg mb-2">❌</div>
          <p className="text-2xl font-bold text-[#4a3222]">{stats.rechazados}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-0.5">Rechazados</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8dcca] p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Estado', key: 'estado', opts: [
              { v: 'pendiente', l: '⏳ Pendientes' },
              { v: 'aprobado',  l: '✅ Aprobados'  },
              { v: 'rechazado', l: '❌ Rechazados' },
              { v: '',          l: '📋 Todos'       },
            ]},
            { label: 'Proyecto', key: 'tipo_proyecto', opts: [
              { v: '',             l: 'Todos'                 },
              { v: 'cafe',         l: '☕ Escuela y Café'     },
              { v: 'alimentacion', l: '🌽 Seg. Alimentaria'   },
            ]},
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">{label}</label>
              <select
                value={filtros[key]}
                onChange={(e) => setFiltros(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition"
              >
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Municipio</label>
            <select
              value={filtros.municipio}
              onChange={(e) => setFiltros(prev => ({ ...prev, municipio: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition"
            >
              <option value="">Todos</option>
              {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f5efe6]">
          <button
            onClick={() => setFiltros({ estado: 'pendiente', tipo_proyecto: '', municipio: '' })}
            className="text-xs text-[#6b4c3a] hover:text-[#4a3222] transition font-medium"
          >
            Limpiar filtros
          </button>
          <button onClick={cargarProyectos} className="text-xs text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center gap-1 font-medium">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#e8dcca] p-5 animate-pulse">
              <div className="h-4 bg-[#e8dcca] rounded-full w-1/2 mb-3" />
              <div className="h-3 bg-[#f5efe6] rounded-full w-3/4 mb-2" />
              <div className="h-3 bg-[#f5efe6] rounded-full w-2/3" />
            </div>
          ))}
        </div>
      ) : proyectos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8dcca] p-12 text-center">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-sm font-semibold text-[#4a3222]">No hay proyectos dirigidos con esos filtros</p>
          <p className="text-xs text-[#a68a64] mt-1">Prueba cambiando los criterios de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proyectos.map(proyecto => (
            <TarjetaProyectoDirigido key={proyecto.id} proyecto={proyecto} onActualizar={cargarProyectos} />
          ))}
        </div>
      )}
    </div>
  )
}

function TarjetaProyectoDirigido({ proyecto, onActualizar }) {
  const [puntuacion, setPuntuacion] = useState(proyecto.puntuacion || '')
  const [comentario, setComentario] = useState(proyecto.comentario_padrino || '')
  const [loading, setLoading] = useState(false)
  const [comentarioError, setComentarioError] = useState(false)

  const docente = proyecto.docente
  const imagenes = proyecto.archivos?.filter(a => a.tipo_archivo === 'imagen').map(a => a.url) || []
  const videos = proyecto.archivos?.filter(a => a.tipo_archivo === 'video') || []
  const totalCostos = (proyecto.costos || []).reduce((s, c) => s + (c.valor || 0), 0)
  const totalUtilidadesEconomicas = (proyecto.utilidades || []).filter(u => u.tipo === 'economica').reduce((s, u) => s + (u.valor || 0), 0)
  const utilidadesFormativas = (proyecto.utilidades || []).filter(u => u.tipo === 'formativa')

  const estadoStyle = {
    pendiente: { pill: 'bg-amber-50 text-amber-700 border border-amber-200', bar: 'bg-amber-400', texto: '⏳ Pendiente' },
    aprobado: { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bar: 'bg-emerald-500', texto: '✅ Aprobado' },
    rechazado: { pill: 'bg-red-50 text-red-600 border border-red-200', bar: 'bg-red-500', texto: '❌ Rechazado' },
  }[proyecto.estado] || { pill: 'bg-[#f5efe6] text-[#6b4c3a] border border-[#e8dcca]', bar: 'bg-[#d4c4a8]', texto: proyecto.estado }

  async function handleAprobar() {
    if (!puntuacion) {
      toast.error('Debes asignar una puntuación (0-100)')
      return
    }
    const puntuacionNum = parseInt(puntuacion)
    if (isNaN(puntuacionNum) || puntuacionNum < 0 || puntuacionNum > 100) {
      toast.error('La puntuación debe estar entre 0 y 100')
      return
    }
    setLoading(true)
    setComentarioError(false)

    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('proyectos_dirigidos')
      .update({
        estado: 'aprobado',
        puntuacion: puntuacionNum,
        comentario_padrino: comentario || null,
        fecha_revision: new Date().toISOString(),
        padrino_id: userData.user?.id
      })
      .eq('id', proyecto.id)

    if (error) {
      toast.error('Error al aprobar el proyecto')
      console.error(error)
    } else {
      toast.success('✅ Proyecto dirigido aprobado')
      onActualizar()
    }
    setLoading(false)
  }

  async function handleRechazar() {
    if (!comentario.trim()) {
      setComentarioError(true)
      toast.error('Debes escribir un comentario explicando el motivo del rechazo')
      return
    }
    setComentarioError(false)
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('proyectos_dirigidos')
      .update({
        estado: 'rechazado',
        comentario_padrino: comentario,
        fecha_revision: new Date().toISOString(),
        padrino_id: userData.user?.id
      })
      .eq('id', proyecto.id)

    if (error) {
      toast.error('Error al rechazar el proyecto')
      console.error(error)
    } else {
      toast.success('Proyecto dirigido rechazado')
      onActualizar()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8dcca] overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 ${estadoStyle.bar}`} />

      <div className="px-5 py-4 border-b border-[#f5efe6] bg-gradient-to-r from-[#faf7f3] to-white">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[#4a3222] text-sm">{proyecto.titulo}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${estadoStyle.pill}`}>
                {estadoStyle.texto}
              </span>
            </div>
            <p className="text-xs text-[#a68a64] flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span>👤 {docente?.nombre_completo}</span>
              <span>📍 {docente?.municipios?.nombre || 'N/A'}</span>
              <span>🏫 {docente?.instituciones?.nombre || 'N/A'}</span>
              <span>{proyecto.tipo_proyecto === 'cafe' ? '☕ Café' : '🌽 Alimentaria'}</span>
            </p>
          </div>
          <p className="text-xs text-[#a68a64] flex-shrink-0">
            {new Date(proyecto.fecha_envio).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#f0e8dc]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Tipo</p>
            <p className="text-[#4a3222]">{proyecto.tipo_proyecto_agropecuario === 'pecuario' ? 'Pecuario' : 'Agrícola'} · {proyecto.raza || '—'} · {proyecto.variedad || '—'}</p>
          </div>
          <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#f0e8dc]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Área y densidad</p>
            <p className="text-[#4a3222]">{proyecto.area_total || '—'} · {proyecto.densidad_siembra || '—'}</p>
          </div>
          <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#f0e8dc]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Contacto del docente</p>
            <p className="text-[#4a3222]">{proyecto.cargo} · {proyecto.telefono} · {proyecto.correo_electronico}</p>
          </div>
          <div className="bg-[#faf7f3] rounded-xl p-3 border border-[#f0e8dc]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Cantidad de especies</p>
            <p className="text-[#4a3222]">{proyecto.cantidad_especies || '—'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Objetivo general</p>
            <p className="text-xs text-[#6b4c3a] whitespace-pre-wrap leading-relaxed">{proyecto.objetivo_general}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Objetivos específicos</p>
            <p className="text-xs text-[#6b4c3a] whitespace-pre-wrap leading-relaxed">{proyecto.objetivos_especificos}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Justificación</p>
            <p className="text-xs text-[#6b4c3a] whitespace-pre-wrap leading-relaxed">{proyecto.justificacion}</p>
          </div>
        </div>

        {proyecto.costos?.length > 0 && (
          <div className="bg-[#faf7f3] rounded-xl p-4 border border-[#f0e8dc]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-2">💰 Costos y gastos</p>
            <div className="space-y-1">
              {proyecto.costos.map(c => (
                <div key={c.id} className="flex justify-between text-xs text-[#6b4c3a]">
                  <span>{c.concepto}</span>
                  <span className="font-medium">${(c.valor || 0).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-bold text-[#4a3222] mt-2 pt-2 border-t border-[#e8dcca]">
              <span>Total</span>
              <span>${totalCostos.toLocaleString('es-CO')}</span>
            </div>
          </div>
        )}

        {proyecto.utilidades?.length > 0 && (
          <div className="bg-[#faf7f3] rounded-xl p-4 border border-[#f0e8dc]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-2">📈 Utilidades</p>
            <div className="space-y-1">
              {proyecto.utilidades.filter(u => u.tipo === 'economica').map(u => (
                <div key={u.id} className="flex justify-between text-xs text-[#6b4c3a]">
                  <span>{u.concepto}</span>
                  <span className="font-medium">${(u.valor || 0).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
            {totalUtilidadesEconomicas > 0 && (
              <div className="flex justify-between text-xs font-bold text-[#4a3222] mt-2 pt-2 border-t border-[#e8dcca]">
                <span>Total económicas</span>
                <span>${totalUtilidadesEconomicas.toLocaleString('es-CO')}</span>
              </div>
            )}
            {utilidadesFormativas.length > 0 && (
              <ul className="mt-2 pt-2 border-t border-[#e8dcca] list-disc pl-4 space-y-1">
                {utilidadesFormativas.map(u => (
                  <li key={u.id} className="text-xs text-[#6b4c3a]">{u.concepto}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-[#faf7f3] rounded-xl p-4 border border-[#f0e8dc]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-2">🎥 Video y evidencias</p>
          {videos.map((video, idx) => (
            <a
              key={idx}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border border-[#e8dcca] hover:border-[#6b4c3a] rounded-xl px-4 py-3 mb-2 transition group"
            >
              <span className="text-xl">▶️</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[#4a3222]">Ver video de la clase</span>
                <span className="block text-[10px] text-[#a68a64] truncate">{video.url}</span>
              </span>
              <span className="text-[#a68a64] group-hover:text-[#6b4c3a] text-xs flex-shrink-0">Abrir ↗</span>
            </a>
          ))}
          {imagenes.length > 0 && <ImageViewer images={imagenes} />}
          {videos.length === 0 && imagenes.length === 0 && (
            <p className="text-xs text-[#a68a64] italic">No se ha subido contenido</p>
          )}
        </div>

        {proyecto.estado === 'pendiente' && (
          <div className="space-y-3 pt-2 border-t border-[#f5efe6]">
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">Puntuación (0–100)</label>
                <input
                  type="number"
                  value={puntuacion}
                  onChange={(e) => setPuntuacion(e.target.value)}
                  min="0"
                  max="100"
                  className="w-28 px-3 py-2 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] transition"
                  placeholder="0-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1">
                Comentario{' '}
                {!comentario && <span className="text-red-400 normal-case font-normal">(obligatorio si rechazas)</span>}
              </label>
              <textarea
                value={comentario}
                onChange={(e) => { setComentario(e.target.value); setComentarioError(false) }}
                className={`w-full px-3 py-2 text-xs border rounded-xl bg-[#faf7f3] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] resize-none transition ${
                  comentarioError ? 'border-red-400 ring-red-200' : 'border-[#e8dcca]'
                }`}
                rows="3"
                placeholder="Retroalimentación para el docente..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAprobar}
                disabled={loading}
                className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✅'} Aprobar
              </button>
              <button
                onClick={handleRechazar}
                disabled={loading}
                className="flex-1 sm:flex-none bg-red-500 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 disabled:opacity-50 transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '❌'} Rechazar
              </button>
            </div>
          </div>
        )}

        {proyecto.estado !== 'pendiente' && proyecto.comentario_padrino && (
          <div className={`p-4 rounded-xl border ${proyecto.estado === 'aprobado' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-xs font-bold text-[#4a3222] mb-1">
              {proyecto.estado === 'aprobado' ? '✅ Comentario del padrino' : '❌ Motivo de rechazo'}
            </p>
            <p className="text-xs text-[#6b4c3a] leading-relaxed">{proyecto.comentario_padrino}</p>
            {proyecto.puntuacion != null && (
              <p className="text-xs font-semibold text-emerald-700 mt-2">⭐ Puntuación: {proyecto.puntuacion}/100</p>
            )}
            {proyecto.fecha_revision && (
              <p className="text-[10px] text-[#a68a64] mt-1">Revisado el {new Date(proyecto.fecha_revision).toLocaleDateString('es-CO')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProyectosDirigidosPadrino() {
  return <DashboardProyectosDirigidos />
}
