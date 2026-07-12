import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { FormularioProyectoDirigido } from './FormularioProyectoDirigido'

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    aprobado: 'bg-green-100 text-green-800 border-green-200',
    rechazado: 'bg-red-100 text-red-800 border-red-200'
  }
  const textos = {
    pendiente: '⏳ Pendiente',
    aprobado: '✅ Aprobado',
    rechazado: '❌ Rechazado'
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${estilos[estado] || 'bg-gray-100 text-gray-600'}`}>
      {textos[estado] || estado}
    </span>
  )
}

export function MisProyectosDocente() {
  const [docente, setDocente] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('lista') // 'lista' | 'formulario'
  const [proyectoEditando, setProyectoEditando] = useState(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: docenteData } = await supabase
      .from('docentes')
      .select('*, municipios (nombre), instituciones (nombre), sedes (nombre)')
      .eq('user_id', user.id)
      .single()

    if (!docenteData) { setLoading(false); return }
    setDocente(docenteData)

    const { data: proyectosData } = await supabase
      .from('proyectos_dirigidos')
      .select('*')
      .eq('docente_id', docenteData.id)
      .order('created_at', { ascending: false })

    if (proyectosData?.length) {
      const proyectoIds = proyectosData.map(p => p.id)
      const [{ data: costosData }, { data: utilidadesData }, { data: archivosData }] = await Promise.all([
        supabase.from('proyecto_dirigido_costos').select('*').in('proyecto_dirigido_id', proyectoIds).order('orden'),
        supabase.from('proyecto_dirigido_utilidades').select('*').in('proyecto_dirigido_id', proyectoIds).order('orden'),
        supabase.from('proyecto_dirigido_archivos').select('*').in('proyecto_dirigido_id', proyectoIds).order('orden')
      ])
      const conRelaciones = proyectosData.map(p => ({
        ...p,
        costos: (costosData || []).filter(c => c.proyecto_dirigido_id === p.id),
        utilidades: (utilidadesData || []).filter(u => u.proyecto_dirigido_id === p.id),
        archivos: (archivosData || []).filter(a => a.proyecto_dirigido_id === p.id)
      }))
      setProyectos(conRelaciones)
    } else {
      setProyectos([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function abrirNuevo() {
    setProyectoEditando(null)
    setVista('formulario')
  }

  function abrirEdicion(proyecto) {
    setProyectoEditando(proyecto)
    setVista('formulario')
  }

  function handleGuardado() {
    setVista('lista')
    setProyectoEditando(null)
    cargarDatos()
  }

  if (loading) {
    return (
      <div className="p-6 text-center py-12 text-[#a68a64]">
        <div className="text-4xl animate-pulse mb-2">🌱</div>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!docente) {
    return (
      <div className="p-6 text-center py-12 text-[#a68a64]">
        <p>No se encontró tu registro de docente.</p>
      </div>
    )
  }

  if (vista === 'formulario') {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#4a3222]">
            {proyectoEditando ? '✏️ Editar Proyecto Dirigido' : '🌱 Nuevo Proyecto Dirigido'}
          </h1>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-[#e8dcca] p-4 sm:p-6">
          <FormularioProyectoDirigido
            docente={docente}
            proyectoExistente={proyectoEditando}
            onGuardado={handleGuardado}
            onCancelar={() => { setVista('lista'); setProyectoEditando(null) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">🌱 Mis Proyectos Dirigidos</h1>
          <p className="text-[#a68a64] mt-1">{docente.instituciones?.nombre} · {docente.municipios?.nombre}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
        >
          + Nuevo proyecto dirigido
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#e8dcca]">
          <span className="text-6xl mb-4 block">🌱</span>
          <p className="text-[#a68a64] text-lg">Aún no has inscrito ningún proyecto dirigido</p>
          <p className="text-sm text-[#a68a64] mt-2">Haz clic en "Nuevo proyecto dirigido" para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proyectos.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-md border border-[#e8dcca] overflow-hidden">
              <div className="p-4 border-b border-[#e8dcca] bg-gradient-to-r from-[#f5efe6] to-white">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#4a3222] leading-tight">{p.titulo}</h3>
                  <EstadoBadge estado={p.estado} />
                </div>
                <p className="text-xs text-[#a68a64] mt-1">
                  {p.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}
                </p>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <p className="text-[#6b4c3a]">
                  Enviado: {new Date(p.fecha_envio).toLocaleDateString('es-CO')}
                </p>
                {p.estado === 'aprobado' && (
                  <p className="text-[#6b4c3a] font-semibold">⭐ Puntuación: {p.puntuacion}/100</p>
                )}
                {p.estado === 'rechazado' && p.comentario_padrino && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-red-700 text-xs">
                    <strong>Motivo:</strong> {p.comentario_padrino}
                  </div>
                )}
                {(p.estado === 'pendiente' || p.estado === 'rechazado') && (
                  <button
                    onClick={() => abrirEdicion(p)}
                    className="mt-2 w-full bg-[#f5efe6] text-[#6b4c3a] py-2 rounded-lg text-sm font-medium hover:bg-[#e8dcca] transition"
                  >
                    ✏️ {p.estado === 'rechazado' ? 'Editar y reenviar' : 'Editar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
