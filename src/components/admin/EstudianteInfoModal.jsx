import { useEffect } from 'react'

// Muestra toda la información de un estudiante en un modal de solo lectura,
// para el panel de administrador.
function Campo({ icon, label, value, full }) {
  return (
    <div className={`${full ? 'sm:col-span-2' : ''} bg-[#faf7f3] rounded-xl p-3 border border-[#e8dcca]`}>
      <p className="text-[10px] font-bold text-[#a68a64] uppercase tracking-widest mb-0.5">{icon} {label}</p>
      <p className="text-sm font-medium text-[#4a3222] break-words">{value ?? '—'}</p>
    </div>
  )
}

export function EstudianteInfoModal({ estudiante, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const e = estudiante
  const proyecto = e.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'
  const documento = [e.tipo_documento, e.numero_documento].filter(Boolean).join(' ')
  const registro = e.created_at
    ? new Date(e.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#e8dcca]"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="relative bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] px-5 py-4 sm:px-6 sm:py-5 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="pr-8">
            <h2 className="text-lg sm:text-xl font-bold text-white">{e.nombre_completo}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white">
                {e.grado}° · {proyecto}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white">
                ⭐ {e.puntuacion_total || 0} pts
              </span>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Campo icon="🪪" label="Documento" value={documento} />
            <Campo icon="🎂" label="Edad" value={e.edad ? `${e.edad} años` : null} />
            <Campo icon="📧" label="Correo" value={e.email} full />
            <Campo icon="📞" label="Teléfono" value={e.telefono} />
            <Campo icon="📍" label="Dirección" value={e.direccion} />
            <Campo icon="📚" label="Grado" value={`${e.grado}°`} />
            <Campo icon="🌾" label="Proyecto" value={proyecto} />
            <Campo icon="🏙️" label="Municipio" value={e.municipios?.nombre} />
            <Campo icon="🏫" label="Institución" value={e.instituciones?.nombre} full />
            <Campo icon="🏫" label="Sede" value={e.sedes?.nombre} full />
            <Campo icon="⭐" label="Puntuación total" value={e.puntuacion_total || 0} />
            <Campo icon="📅" label="Registrado" value={registro} />
          </div>
        </div>
      </div>
    </div>
  )
}
