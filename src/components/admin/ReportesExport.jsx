import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export function ReportesExport() {
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({
    municipio: '',
    institucion: '',
    grado: '',
    tipo_proyecto: ''
  })

  async function exportarExcel() {
    setLoading(true)

    let query = supabase
      .from('estudiantes')
      .select(`
        *,
        municipios(nombre),
        instituciones(nombre),
        evidencias (
          id,
          estado,
          puntuacion,
          fecha_envio,
          reto:reto_id (
            texto,
            nivel:nivel_id (nombre, numero_nivel)
          )
        )
      `)

    if (filtros.grado) query = query.eq('grado', filtros.grado)
    if (filtros.tipo_proyecto) query = query.eq('tipo_proyecto', filtros.tipo_proyecto)

    const { data: estudiantes, error } = await query

    if (error) {
      toast.error('Error al generar el reporte')
      setLoading(false)
      return
    }

    let resultado = estudiantes || []

    if (filtros.municipio) {
      resultado = resultado.filter(e =>
        e.municipios?.nombre?.toLowerCase().includes(filtros.municipio.toLowerCase())
      )
    }
    if (filtros.institucion) {
      resultado = resultado.filter(e =>
        e.instituciones?.nombre?.toLowerCase().includes(filtros.institucion.toLowerCase())
      )
    }

    const datosExcel = []
    resultado.forEach(est => {
      est.evidencias?.forEach(ev => {
        datosExcel.push({
          'Nombre': est.nombre_completo,
          'Documento': est.numero_documento,
          'Municipio': est.municipios?.nombre || '-',
          'Institución': est.instituciones?.nombre || '-',
          'Grado': `${est.grado}°`,
          'Proyecto': est.tipo_proyecto === 'cafe' ? 'Escuela y Café' : 'Seguridad Alimentaria',
          'Nivel': ev.reto?.nivel?.nombre || 'N/A',
          'Número Nivel': ev.reto?.nivel?.numero_nivel || 'N/A',
          'Reto': ev.reto?.texto || 'N/A',
          'Estado': ev.estado === 'pendiente' ? 'Pendiente' : ev.estado === 'aprobado' ? 'Aprobado' : 'Rechazado',
          'Puntuación': ev.puntuacion || 'N/A',
          'Fecha Envío': new Date(ev.fecha_envio).toLocaleDateString('es-CO')
        })
      })
    })

    if (datosExcel.length === 0) {
      toast.error('No hay datos para exportar con los filtros seleccionados')
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
            <input
              type="text"
              value={filtros.municipio}
              onChange={(e) => setFiltros({ ...filtros, municipio: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium">Institución</label>
            <input
              type="text"
              value={filtros.institucion}
              onChange={(e) => setFiltros({ ...filtros, institucion: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222] placeholder-[#a68a64]"
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="block text-[#6b4c3a] mb-1 font-medium">Grado</label>
            <select
              value={filtros.grado}
              onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222]"
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
              onChange={(e) => setFiltros({ ...filtros, tipo_proyecto: e.target.value })}
              className="w-full px-3 py-2 border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none text-[#4a3222]"
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
