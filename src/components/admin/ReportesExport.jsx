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

    // Obtener estudiantes con filtros
    let query = supabase
      .from('estudiantes')
      .select(`
        *,
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

    if (filtros.municipio) {
      query = query.ilike('municipio', `%${filtros.municipio}%`)
    }
    if (filtros.institucion) {
      query = query.ilike('institucion', `%${filtros.institucion}%`)
    }
    if (filtros.grado) {
      query = query.eq('grado', filtros.grado)
    }
    if (filtros.tipo_proyecto) {
      query = query.eq('tipo_proyecto', filtros.tipo_proyecto)
    }

    const { data: estudiantes, error } = await query

    if (error) {
      toast.error('Error al generar el reporte')
      setLoading(false)
      return
    }

    // Preparar datos para Excel
    const datosExcel = []
    estudiantes.forEach(est => {
      est.evidencias?.forEach(ev => {
        datosExcel.push({
          'Nombre': est.nombre_completo,
          'Documento': est.numero_documento,
          'Municipio': est.municipio,
          'Institución': est.institucion,
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

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(datosExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte PPP Tools')
    
    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
      { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
      { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
    ]

    // Descargar
    XLSX.writeFile(wb, `reporte_ppp_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Reporte exportado exitosamente')
    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Exportar Reportes</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium mb-4">Filtros para el reporte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-1">Municipio</label>
            <input
              type="text"
              value={filtros.municipio}
              onChange={(e) => setFiltros({...filtros, municipio: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Institución</label>
            <input
              type="text"
              value={filtros.institucion}
              onChange={(e) => setFiltros({...filtros, institucion: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Grado</label>
            <select
              value={filtros.grado}
              onChange={(e) => setFiltros({...filtros, grado: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos</option>
              {[4,5,6,7,8,9,10,11].map(g => (
                <option key={g} value={g}>{g}°</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Tipo de Proyecto</label>
            <select
              value={filtros.tipo_proyecto}
              onChange={(e) => setFiltros({...filtros, tipo_proyecto: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos</option>
              <option value="cafe">Escuela y Café</option>
              <option value="alimentacion">Seguridad Alimentaria</option>
            </select>
          </div>
        </div>

        <button
          onClick={exportarExcel}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Generando reporte...' : '📊 Exportar a Excel'}
        </button>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 El reporte incluirá todos los estudiantes y sus evidencias con los filtros seleccionados.
            Se generará un archivo Excel listo para presentar en reuniones.
          </p>
        </div>
      </div>
    </div>
  )
}