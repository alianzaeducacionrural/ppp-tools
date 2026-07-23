import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition'
const ROW_INPUT = 'px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition'
const LABEL_CLS = 'block text-[#4a3222] font-medium mb-1 text-sm'
const SECTION_TITLE_CLS = 'text-[10px] font-bold uppercase tracking-widest text-[#a68a64]'
const MAX_ARCHIVO_BYTES = 200 * 1024 * 1024 // 200 MB (límite del bucket, aplica a las fotos)

function formatearMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(0)
}

function ValorInput({ value, onChange }) {
  return (
    <div className="relative flex-1 sm:flex-none sm:w-40">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a68a64] text-sm pointer-events-none">$</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${ROW_INPUT} w-full pl-6`}
        placeholder="Valor"
        min="0"
      />
    </div>
  )
}

function BotonQuitar({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
      title="Quitar renglón"
    >
      ✕
    </button>
  )
}

function FilaRenglon({ concepto, valor, onConceptoChange, onValorChange, onQuitar, placeholderConcepto }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <input
        type="text"
        value={concepto}
        onChange={(e) => onConceptoChange(e.target.value)}
        className={`${ROW_INPUT} flex-1 min-w-0`}
        placeholder={placeholderConcepto}
      />
      <div className="flex gap-2 items-center">
        <ValorInput value={valor} onChange={onValorChange} />
        <BotonQuitar onClick={onQuitar} />
      </div>
    </div>
  )
}

export function FormularioProyectoDirigido({ docente, proyectoExistente, onGuardado, onCancelar }) {
  const [loading, setLoading] = useState(false)
  const proyectoId = proyectoExistente?.id

  const [formData, setFormData] = useState({
    titulo: proyectoExistente?.titulo || '',
    tipo_proyecto: proyectoExistente?.tipo_proyecto || 'cafe',
    tipo_proyecto_agropecuario: proyectoExistente?.tipo_proyecto_agropecuario || 'agricola',
    raza: proyectoExistente?.raza || '',
    variedad: proyectoExistente?.variedad || '',
    cantidad_especies: proyectoExistente?.cantidad_especies || '',
    area_total: proyectoExistente?.area_total || '',
    densidad_siembra: proyectoExistente?.densidad_siembra || '',
    nombre_docente: proyectoExistente?.nombre_docente || docente?.nombre_completo || '',
    cargo: proyectoExistente?.cargo || docente?.cargo || '',
    telefono: proyectoExistente?.telefono || docente?.telefono || '',
    correo_electronico: proyectoExistente?.correo_electronico || docente?.email || '',
    objetivo_general: proyectoExistente?.objetivo_general || '',
    objetivos_especificos: proyectoExistente?.objetivos_especificos || '',
    justificacion: proyectoExistente?.justificacion || ''
  })

  const [costos, setCostos] = useState(
    (proyectoExistente?.costos || []).map(c => ({ ...c, _key: c.id })).length
      ? (proyectoExistente.costos || []).map(c => ({ ...c, _key: c.id }))
      : [{ _key: crypto.randomUUID(), concepto: '', valor: '' }]
  )
  const [utilidades, setUtilidades] = useState(
    (proyectoExistente?.utilidades || []).length
      ? proyectoExistente.utilidades.map(u => ({ ...u, _key: u.id }))
      : [{ _key: crypto.randomUUID(), tipo: 'economica', concepto: '', valor: '' }]
  )

  // El video es un enlace externo; las fotos sí se suben a la plataforma
  const videoExistente = (proyectoExistente?.archivos || []).find(a => a.tipo_archivo === 'video')
  const videoArchivoId = videoExistente?.id

  const [archivosExistentes, setArchivosExistentes] = useState(
    (proyectoExistente?.archivos || []).filter(a => a.tipo_archivo === 'imagen')
  )
  const [eliminados, setEliminados] = useState([])
  const [videoUrl, setVideoUrl] = useState(videoExistente?.url || '')
  const [fotosNuevas, setFotosNuevas] = useState([])
  const [mostrarRecomendaciones, setMostrarRecomendaciones] = useState(false)
  const fotosInputRef = useRef(null)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function actualizarCosto(key, campo, valor) {
    setCostos(prev => prev.map(c => c._key === key ? { ...c, [campo]: valor } : c))
  }
  function agregarCosto() {
    setCostos(prev => [...prev, { _key: crypto.randomUUID(), concepto: '', valor: '' }])
  }
  function quitarCosto(key) {
    setCostos(prev => prev.filter(c => c._key !== key))
  }
  const totalCostos = costos.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)

  function actualizarUtilidad(key, campo, valor) {
    setUtilidades(prev => prev.map(u => u._key === key ? { ...u, [campo]: valor } : u))
  }
  function agregarUtilidad() {
    setUtilidades(prev => [...prev, { _key: crypto.randomUUID(), tipo: 'economica', concepto: '', valor: '' }])
  }
  function quitarUtilidad(key) {
    setUtilidades(prev => prev.filter(u => u._key !== key))
  }
  const totalUtilidadesEconomicas = utilidades
    .filter(u => u.tipo === 'economica')
    .reduce((s, u) => s + (parseFloat(u.valor) || 0), 0)

  function handleSeleccionarFotos(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    const validas = files.filter(f => {
      if (f.size > MAX_ARCHIVO_BYTES) {
        toast.error(`La foto "${f.name}" pesa ${formatearMB(f.size)} MB y supera el máximo de 200 MB.`)
        return false
      }
      return true
    })
    if (validas.length) setFotosNuevas(prev => [...prev, ...validas])
  }

  function quitarFotoNueva(idx) {
    setFotosNuevas(prev => prev.filter((_, i) => i !== idx))
  }

  function quitarArchivoExistente(archivo) {
    setArchivosExistentes(prev => prev.filter(a => a.id !== archivo.id))
    setEliminados(prev => [...prev, archivo])
  }

  async function subirArchivo(file, tipo, idProyecto) {
    const ext = file.name.split('.').pop().toLowerCase()
    const safeExt = ext.replace(/[^a-z0-9]/g, '')
    const fileName = `${idProyecto}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
    const { error: uploadError } = await supabase.storage
      .from('proyectos-dirigidos')
      .upload(fileName, file, { upsert: true })
    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      throw new Error(`No se pudo subir "${file.name}". Verifica que no supere 200 MB e inténtalo de nuevo.`)
    }
    const { data: urlData } = supabase.storage.from('proyectos-dirigidos').getPublicUrl(fileName)
    const { error: insertError } = await supabase.from('proyecto_dirigido_archivos').insert({
      proyecto_dirigido_id: idProyecto,
      tipo_archivo: tipo,
      url: urlData.publicUrl,
      nombre_original: file.name,
      tamanio_bytes: file.size
    })
    if (insertError) {
      console.error('Error registrando archivo:', insertError)
      throw new Error(`No se pudo registrar "${file.name}".`)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      toast.error('El título del proyecto es obligatorio')
      return
    }
    if (!videoUrl.trim()) {
      toast.error('Debes pegar el enlace del video de tu clase')
      return
    }
    if (!/^https?:\/\//i.test(videoUrl.trim())) {
      toast.error('El enlace del video debe empezar con http:// o https://')
      return
    }

    setLoading(true)
    try {
      const proyectoData = {
        docente_id: docente.id,
        titulo: formData.titulo,
        tipo_proyecto: formData.tipo_proyecto,
        tipo_proyecto_agropecuario: formData.tipo_proyecto_agropecuario,
        raza: formData.raza,
        variedad: formData.variedad,
        cantidad_especies: formData.cantidad_especies,
        area_total: formData.area_total,
        densidad_siembra: formData.densidad_siembra,
        nombre_docente: formData.nombre_docente,
        cargo: formData.cargo,
        telefono: formData.telefono,
        correo_electronico: formData.correo_electronico,
        objetivo_general: formData.objetivo_general,
        objetivos_especificos: formData.objetivos_especificos,
        justificacion: formData.justificacion
      }

      let idProyecto = proyectoId
      if (proyectoExistente) {
        // Si estaba rechazado y se reenvía, vuelve a quedar pendiente
        const { error } = await supabase
          .from('proyectos_dirigidos')
          .update({ ...proyectoData, estado: 'pendiente', puntuacion: null, comentario_padrino: null, fecha_revision: null })
          .eq('id', idProyecto)
        if (error) throw error

        for (const archivo of eliminados) {
          const marker = '/object/public/proyectos-dirigidos/'
          const i = archivo.url?.indexOf(marker) ?? -1
          if (i !== -1) {
            await supabase.storage.from('proyectos-dirigidos').remove([archivo.url.slice(i + marker.length)])
          }
          await supabase.from('proyecto_dirigido_archivos').delete().eq('id', archivo.id)
        }

        await supabase.from('proyecto_dirigido_costos').delete().eq('proyecto_dirigido_id', idProyecto)
        await supabase.from('proyecto_dirigido_utilidades').delete().eq('proyecto_dirigido_id', idProyecto)
      } else {
        const { data, error } = await supabase.from('proyectos_dirigidos').insert(proyectoData).select()
        if (error) throw error
        idProyecto = data?.[0]?.id
      }

      if (!idProyecto) throw new Error('No se pudo obtener el ID del proyecto')

      const costosValidos = costos.filter(c => c.concepto.trim())
      if (costosValidos.length) {
        await supabase.from('proyecto_dirigido_costos').insert(
          costosValidos.map((c, idx) => ({
            proyecto_dirigido_id: idProyecto,
            concepto: c.concepto,
            valor: parseFloat(c.valor) || 0,
            orden: idx
          }))
        )
      }

      const utilidadesValidas = utilidades.filter(u => u.concepto.trim())
      if (utilidadesValidas.length) {
        await supabase.from('proyecto_dirigido_utilidades').insert(
          utilidadesValidas.map((u, idx) => ({
            proyecto_dirigido_id: idProyecto,
            tipo: u.tipo,
            concepto: u.concepto,
            valor: u.tipo === 'economica' ? (parseFloat(u.valor) || 0) : null,
            orden: idx
          }))
        )
      }

      // El video es un enlace: se guarda/actualiza la URL, no se sube archivo
      const urlLimpia = videoUrl.trim()
      if (videoArchivoId) {
        await supabase.from('proyecto_dirigido_archivos')
          .update({ url: urlLimpia, nombre_original: 'Enlace del video' })
          .eq('id', videoArchivoId)
      } else {
        await supabase.from('proyecto_dirigido_archivos').insert({
          proyecto_dirigido_id: idProyecto,
          tipo_archivo: 'video',
          url: urlLimpia,
          nombre_original: 'Enlace del video'
        })
      }

      for (const foto of fotosNuevas) await subirArchivo(foto, 'imagen', idProyecto)

      toast.success('¡Proyecto dirigido enviado! Espera la revisión del padrino')
      onGuardado()
    } catch (error) {
      console.error('Error guardando proyecto dirigido:', error)
      toast.error(error.message || 'Error al guardar el proyecto. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Información general */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📋</span>
          <h3 className={SECTION_TITLE_CLS}>Información general</h3>
          <div className="flex-1 h-px bg-[#e8dcca]" />
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLS}>Título del proyecto dirigido *</label>
            <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className={INPUT_CLS} required
              placeholder="Ej: Cultivo de café especial en la IE..." />
          </div>

          <div>
            <label className={LABEL_CLS + ' mb-2'}>Tipo de proyecto *</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition flex-1 ${formData.tipo_proyecto === 'cafe' ? 'border-[#6b4c3a] bg-[#f5efe6]' : 'border-[#e8dcca] hover:border-[#a68a64]'}`}>
                <input type="radio" name="tipo_proyecto" value="cafe" checked={formData.tipo_proyecto === 'cafe'} onChange={handleChange} className="w-4 h-4 text-[#6b4c3a]" />
                <span className="text-[#4a3222] text-sm font-medium">☕ Escuela y Café</span>
              </label>
              <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition flex-1 ${formData.tipo_proyecto === 'alimentacion' ? 'border-[#6b4c3a] bg-[#f5efe6]' : 'border-[#e8dcca] hover:border-[#a68a64]'}`}>
                <input type="radio" name="tipo_proyecto" value="alimentacion" checked={formData.tipo_proyecto === 'alimentacion'} onChange={handleChange} className="w-4 h-4 text-[#6b4c3a]" />
                <span className="text-[#4a3222] text-sm font-medium">🌽 Seguridad Alimentaria</span>
              </label>
            </div>
          </div>

          <div className="bg-[#f5efe6] rounded-xl p-3 border border-[#e8dcca] grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div><span className="text-[#a68a64]">Departamento: </span><span className="text-[#4a3222] font-medium">Caldas</span></div>
            <div><span className="text-[#a68a64]">Municipio: </span><span className="text-[#4a3222] font-medium">{docente?.municipios?.nombre || 'N/A'}</span></div>
            <div><span className="text-[#a68a64]">Institución: </span><span className="text-[#4a3222] font-medium">{docente?.instituciones?.nombre || 'N/A'}</span></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Tipo (agrícola / pecuario) *</label>
              <select name="tipo_proyecto_agropecuario" value={formData.tipo_proyecto_agropecuario} onChange={handleChange} className={INPUT_CLS}>
                <option value="agricola">Agrícola</option>
                <option value="pecuario">Pecuario</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Raza</label>
              <input type="text" name="raza" value={formData.raza} onChange={handleChange} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Variedad</label>
              <input type="text" name="variedad" value={formData.variedad} onChange={handleChange} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Cantidad de especies</label>
              <input type="text" name="cantidad_especies" value={formData.cantidad_especies} onChange={handleChange} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Área total del proyecto</label>
              <input type="text" name="area_total" value={formData.area_total} onChange={handleChange} className={INPUT_CLS} placeholder="Ej: 200 m²" />
            </div>
            <div>
              <label className={LABEL_CLS}>Densidad de siembra / población por M²</label>
              <input type="text" name="densidad_siembra" value={formData.densidad_siembra} onChange={handleChange} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Nombre del docente *</label>
              <input type="text" name="nombre_docente" value={formData.nombre_docente} onChange={handleChange} className={INPUT_CLS} required />
            </div>
            <div>
              <label className={LABEL_CLS}>Cargo *</label>
              <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} className={INPUT_CLS} required />
            </div>
            <div>
              <label className={LABEL_CLS}>Teléfono *</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className={INPUT_CLS} required />
            </div>
            <div>
              <label className={LABEL_CLS}>Correo electrónico *</label>
              <input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} className={INPUT_CLS} required />
            </div>
          </div>
        </div>
      </div>

      {/* Objetivos y justificación */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎯</span>
          <h3 className={SECTION_TITLE_CLS}>Objetivos y justificación</h3>
          <div className="flex-1 h-px bg-[#e8dcca]" />
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLS}>Objetivo general *</label>
            <textarea name="objetivo_general" value={formData.objetivo_general} onChange={handleChange} className={INPUT_CLS} rows="3" required />
          </div>
          <div>
            <label className={LABEL_CLS}>Objetivos específicos *</label>
            <textarea name="objetivos_especificos" value={formData.objetivos_especificos} onChange={handleChange} className={INPUT_CLS} rows="3" required />
          </div>
          <div>
            <label className={LABEL_CLS}>Justificación *</label>
            <textarea name="justificacion" value={formData.justificacion} onChange={handleChange} className={INPUT_CLS} rows="3" required />
          </div>
        </div>
      </div>

      {/* Costos y gastos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">💰</span>
          <h3 className={SECTION_TITLE_CLS}>Registro de costos y gastos</h3>
          <div className="flex-1 h-px bg-[#e8dcca]" />
        </div>
        <div className="space-y-2">
          {costos.map(c => (
            <FilaRenglon
              key={c._key}
              concepto={c.concepto}
              valor={c.valor}
              onConceptoChange={(v) => actualizarCosto(c._key, 'concepto', v)}
              onValorChange={(v) => actualizarCosto(c._key, 'valor', v)}
              onQuitar={() => quitarCosto(c._key)}
              placeholderConcepto="Ej: Semillas, abono, mano de obra..."
            />
          ))}
          <button type="button" onClick={agregarCosto} className="text-sm text-[#6b4c3a] hover:text-[#4a3222] font-medium">
            + Agregar renglón
          </button>
          <div className="text-right text-sm font-semibold text-[#4a3222] pt-1">
            Total costos: ${totalCostos.toLocaleString('es-CO')}
          </div>
        </div>
      </div>

      {/* Utilidades */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📈</span>
          <h3 className={SECTION_TITLE_CLS}>Utilidades económicas y formativas</h3>
          <div className="flex-1 h-px bg-[#e8dcca]" />
        </div>
        <div className="space-y-3">
          {utilidades.map(u => (
            <div key={u._key} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-[#f0e8dc] rounded-xl p-2 sm:border-0 sm:p-0">
              <select
                value={u.tipo}
                onChange={(e) => actualizarUtilidad(u._key, 'tipo', e.target.value)}
                className={`${ROW_INPUT} w-full sm:w-36 flex-shrink-0`}
              >
                <option value="economica">Económica</option>
                <option value="formativa">Formativa</option>
              </select>
              <input
                type="text"
                value={u.concepto}
                onChange={(e) => actualizarUtilidad(u._key, 'concepto', e.target.value)}
                className={`${ROW_INPUT} flex-1 min-w-0`}
                placeholder={u.tipo === 'economica' ? 'Ej: Venta de café pergamino' : 'Ej: Los estudiantes aprendieron a manejar presupuesto'}
              />
              <div className="flex gap-2 items-center">
                {u.tipo === 'economica' && (
                  <ValorInput value={u.valor} onChange={(v) => actualizarUtilidad(u._key, 'valor', v)} />
                )}
                <BotonQuitar onClick={() => quitarUtilidad(u._key)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={agregarUtilidad} className="text-sm text-[#6b4c3a] hover:text-[#4a3222] font-medium">
            + Agregar renglón
          </button>
          <div className="text-right text-sm font-semibold text-[#4a3222] pt-1">
            Total utilidades económicas: ${totalUtilidadesEconomicas.toLocaleString('es-CO')}
          </div>
        </div>
      </div>

      {/* Video y evidencias fotográficas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎥</span>
          <h3 className={SECTION_TITLE_CLS}>Video y evidencias fotográficas</h3>
          <div className="flex-1 h-px bg-[#e8dcca]" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className={LABEL_CLS + ' mb-0'}>Enlace del video de tu clase *</label>
              <button
                type="button"
                onClick={() => setMostrarRecomendaciones(true)}
                className="flex items-center gap-1 text-xs font-semibold text-[#6b4c3a] hover:text-[#4a3222] bg-[#f5efe6] hover:bg-[#e8dcca] px-2.5 py-1 rounded-full transition flex-shrink-0"
              >
                💡 Recomendaciones
              </button>
            </div>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={INPUT_CLS}
              placeholder="https://youtu.be/... o enlace de Google Drive"
              required
            />
            <p className="text-xs text-[#a68a64] mt-1">
              Sube tu video a YouTube, Google Drive u otra plataforma y pega aquí el enlace (máximo 6 minutos).
              Asegúrate de que el enlace tenga permiso de visualización para que el padrino pueda verlo.
            </p>
          </div>

          {archivosExistentes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#4a3222] mb-1.5 uppercase tracking-wide">🗂️ Fotos actuales</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {archivosExistentes.map(archivo => (
                  <div key={archivo.id} className="relative group rounded-xl overflow-hidden border border-[#e8dcca] bg-white shadow-sm">
                    <img src={archivo.url} alt={archivo.nombre_original || 'Foto'} className="w-full h-20 sm:h-24 object-cover" />
                    <button type="button" onClick={() => quitarArchivoExistente(archivo)}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Evidencias fotográficas</label>
            <input ref={fotosInputRef} type="file" accept="image/*" multiple onChange={handleSeleccionarFotos} className="hidden" />
            <button type="button" onClick={() => fotosInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#d4c4a8] hover:border-[#6b4c3a] rounded-xl p-4 text-center transition bg-white hover:bg-[#faf7f3]">
              <span className="text-sm text-[#6b4c3a]">Haz clic para agregar fotos</span>
            </button>
            {fotosNuevas.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {fotosNuevas.map((foto, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#e8dcca] bg-white shadow-sm">
                    <img src={URL.createObjectURL(foto)} alt={foto.name} className="w-full h-20 sm:h-24 object-cover" />
                    <button type="button" onClick={() => quitarFotoNueva(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-sm">
          {loading ? 'Guardando...' : proyectoExistente ? 'Guardar y reenviar' : 'Enviar proyecto dirigido'}
        </button>
        <button type="button" onClick={onCancelar} disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#e8dcca] text-[#6b4c3a] hover:bg-[#faf7f3] transition">
          Cancelar
        </button>
      </div>

      {mostrarRecomendaciones && (
        <RecomendacionesVideoModal onClose={() => setMostrarRecomendaciones(false)} />
      )}
    </form>
  )
}

function RecomendacionesVideoModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-5 text-white sticky top-0 rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎥</span>
              <div>
                <h3 className="font-bold text-base leading-tight">Recomendaciones para el video</h3>
                <p className="text-xs text-[#d4c4a8] mt-0.5">Maestro PPP · Ten en cuenta lo siguiente</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-sm font-bold transition flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 text-sm text-[#4a3222]">
          {/* Duración */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <span className="text-lg">⏱️</span>
            <p className="text-[#6b4c3a]"><strong>Duración máxima: 6 minutos.</strong> Graba una clase tuya de Escuela y Café o Escuela y Seguridad Alimentaria, según el proyecto por el que te postulaste.</p>
          </div>

          {/* Qué decir al inicio */}
          <div>
            <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>🗣️</span> En la parte inicial preséntate y cuéntanos:</p>
            <ul className="space-y-1.5 pl-1">
              {[
                'Presentación personal e institucional.',
                'Las razones por las cuales decidiste desarrollar este proyecto dirigido con tus estudiantes.',
                'Brevemente tu trayectoria formativa y experiencia profesional.',
                'Qué has aprendido con el desarrollo de este proyecto dirigido.',
              ].map((txt, i) => (
                <li key={i} className="flex items-start gap-2 text-[#6b4c3a]">
                  <span className="text-[#a68a64] mt-0.5">•</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Qué mostrar */}
          <div>
            <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>📚</span> Durante la clase se debe evidenciar:</p>
            <ul className="space-y-1.5 pl-1">
              {[
                'El desarrollo de los módulos.',
                'El uso del libro de registros.',
                'La implementación del modelo pedagógico Escuela Nueva.',
              ].map((txt, i) => (
                <li key={i} className="flex items-start gap-2 text-[#6b4c3a]">
                  <span className="text-[#a68a64] mt-0.5">•</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cómo compartir el enlace */}
          <div>
            <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>🔗</span> Cómo compartir el enlace:</p>
            <ul className="space-y-1.5 pl-1">
              {[
                'Sube el video a YouTube, Google Drive u otra plataforma.',
                'En YouTube, márcalo como "No listado" o "Público" (no privado).',
                'En Google Drive, activa "Cualquier persona con el enlace" con permiso de lector.',
                'Verifica el enlace en una ventana de incógnito antes de enviarlo, para confirmar que se puede ver.',
              ].map((txt, i) => (
                <li key={i} className="flex items-start gap-2 text-[#6b4c3a]">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Consejos técnicos */}
          <div className="bg-[#f5efe6] border border-[#e8dcca] rounded-xl p-3">
            <p className="font-bold text-[#4a3222] mb-1.5 flex items-center gap-2"><span>💡</span> Consejos para que se vea bien:</p>
            <ul className="space-y-1 text-xs text-[#6b4c3a]">
              <li>• Graba en un lugar con buena iluminación y poco ruido.</li>
              <li>• Usa la cámara en posición horizontal.</li>
              <li>• Habla claro y a un ritmo pausado.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-[#f0e8dc] sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
