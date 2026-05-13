import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const SELECT_CLS = 'w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] bg-white disabled:opacity-50 disabled:cursor-not-allowed'

export function ReportesExport() {
  const [loading, setLoading] = useState(false)
  const [municipios, setMunicipios] = useState([])
  const [instituciones, setInstituciones] = useState([])
  const [loadingInstituciones, setLoadingInstituciones] = useState(false)
  const [filtros, setFiltros] = useState({
    municipio_id: '',
    institucion_id: '',
    grado: '',
    tipo_proyecto: ''
  })

  useEffect(() => {
    supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setMunicipios(data || []))
  }, [])

  async function handleMunicipioChange(municipioId) {
    setFiltros(prev => ({ ...prev, municipio_id: municipioId, institucion_id: '' }))
    setInstituciones([])

    if (!municipioId) return

    setLoadingInstituciones(true)
    const { data } = await supabase
      .from('instituciones')
      .select('id, nombre')
      .eq('municipio_id', municipioId)
      .order('nombre')
    setInstituciones(data || [])
    setLoadingInstituciones(false)
  }

  async function exportarExcel() {
    setLoading(true)

    try {
      // Query 1: students with municipio/institucion names
      let studentQuery = supabase
        .from('estudiantes')
        .select('id, nombre_completo, numero_documento, grado, tipo_proyecto, municipios(nombre), instituciones(nombre)')

      if (filtros.municipio_id)   studentQuery = studentQuery.eq('municipio_id', filtros.municipio_id)
      if (filtros.institucion_id) studentQuery = studentQuery.eq('institucion_id', filtros.institucion_id)
      if (filtros.grado)          studentQuery = studentQuery.eq('grado', filtros.grado)
      if (filtros.tipo_proyecto)  studentQuery = studentQuery.eq('tipo_proyecto', filtros.tipo_proyecto)

      const { data: estudiantes, error: estError } = await studentQuery

      if (estError) throw estError

      if (!estudiantes || estudiantes.length === 0) {
        toast.error('No hay estudiantes con los filtros seleccionados')
        setLoading(false)
        return
      }

      // Query 2: evidencias for those students, with reto and nivel info
      const estudianteIds = estudiantes.map(e => e.id)
      const { data: evidencias, error: evError } = await supabase
        .from('evidencias')
        .select('id, estado, puntuacion, fecha_envio, estudiante_id, retos!reto_id(texto, niveles!nivel_id(nombre, numero_nivel))')
        .in('estudiante_id', estudianteIds)

      if (evError) throw evError

      const estudiantesMap = Object.fromEntries(estudiantes.map(e => [e.id, e]))

      const datosExcel = []
      ;(evidencias || []).forEach(ev => {
        const est = estudiantesMap[ev.estudiante_id]
        if (!est) return
        datosExcel.push({
          'Nombre':       est.nombre_completo,
          'Documento':    est.numero_documento,
          'Municipio':    est.municipios?.nombre || '-',
          'Institución':  est.instituciones?.nombre || '-',
          'Grado':        `${est.grado}°`,
          'Proyecto':     est.tipo_proyecto === 'cafe' ? 'Escuela y Café' : 'Seguridad Alimentaria',
          'Nivel':        ev.retos?.niveles?.nombre || 'N/A',
          'Número Nivel': ev.retos?.niveles?.numero_nivel || 'N/A',
          'Reto':         ev.retos?.texto || 'N/A',
          'Estado':       ev.estado === 'pendiente' ? 'Pendiente' : ev.estado === 'aprobado' ? 'Aprobado' : 'Rechazado',
          'Puntuación':   ev.puntuacion ?? 'N/A',
          'Fecha Envío':  ev.fecha_envio ? new Date(ev.fecha_envio).toLocaleDateString('es-CO') : 'N/A'
        })
      })

      if (datosExcel.length === 0) {
        toast.error('No hay evidencias para exportar con los filtros seleccionados')
        setLoading(false)
        return
      }

      const ws = XLSX.utils.json_to_sheet(datosExcel)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte PPP Tools')

      ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
        { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
        { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
      ]

      XLSX.writeFile(wb, `reporte_ppp_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Reporte exportado exitosamente')
    } catch (err) {
      console.error('Error exportando reporte:', err)
      toast.error('Error al generar el reporte')
    }

    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4a3222] mb-6">Exportar Reportes</h2>

      <div className="bg-white rounded-xl shadow-md border border-[#e8dcca] p-6">
        <h3 className="font-semibold text-[#4a3222] mb-4">Filtros para el reporte</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium">Municipio</label>
            <select
              value={filtros.municipio_id}
              onChange={(e) => handleMunicipioChange(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Todos los municipios</option>
              {municipios.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium">Institución</label>
            <select
              value={filtros.institucion_id}
              onChange={(e) => setFiltros(prev => ({ ...prev, institucion_id: e.target.value }))}
              disabled={!filtros.municipio_id || loadingInstituciones}
              className={SELECT_CLS}
            >
              <option value="">
                {loadingInstituciones
                  ? 'Cargando...'
                  : !filtros.municipio_id
                    ? 'Selecciona un municipio primero'
                    : 'Todas las instituciones'}
              </option>
              {instituciones.map(i => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium">Grado</label>
            <select
              value={filtros.grado}
              onChange={(e) => setFiltros(prev => ({ ...prev, grado: e.target.value }))}
              className={SELECT_CLS}
            >
              <option value="">Todos</option>
              {[4,5,6,7,8,9,10,11].map(g => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium">Tipo de Proyecto</label>
            <select
              value={filtros.tipo_proyecto}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo_proyecto: e.target.value }))}
              className={SELECT_CLS}
            >
              <option value="">Todos</option>
              <option value="cafe">☕ Escuela y Café</option>
              <option value="alimentacion">🌽 Seguridad Alimentaria</option>
            </select>
          </div>
        </div>

        <button
          onClick={exportarExcel}
          disabled={loading}
          className="w-full bg-[#6b4c3a] text-white py-3 rounded-lg hover:bg-[#4a3222] disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
        >
          {loading ? '⏳ Generando reporte...' : '📊 Exportar a Excel'}
        </button>

        <div className="mt-4 p-3 bg-[#f5efe6] border border-[#e8dcca] rounded-lg">
          <p className="text-sm text-[#6b4c3a]">
            💡 El reporte incluirá todos los estudiantes y sus evidencias con los filtros seleccionados.
            Se generará un archivo Excel listo para presentar en reuniones.
          </p>
        </div>
      </div>
    </div>
  )
}
