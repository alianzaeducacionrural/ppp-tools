import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ImageViewer } from '../comunes/ImageViewer'
import { SkeletonCard } from '../comunes/Skeleton'

export function DashboardEstudiante() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [estudiante, setEstudiante] = useState(null)
  const [niveles, setNiveles] = useState([])
  const [loading, setLoading] = useState(true)
  const [completados, setCompletados] = useState(0)

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

  async function cargarDatos() {
    setLoading(true)
    
    try {
      // 1. Obtener datos del estudiante
      const { data: estudianteData, error: estudianteError } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (estudianteError) throw estudianteError
      setEstudiante(estudianteData)

      // 2. Obtener niveles según su grado y tipo de proyecto
      const { data: nivelesData, error: nivelesError } = await supabase
        .from('niveles')
        .select('*')
        .eq('grado', estudianteData.grado)
        .eq('tipo_proyecto', estudianteData.tipo_proyecto)
        .order('numero_nivel', { ascending: true })

      if (nivelesError) throw nivelesError
      setNiveles(nivelesData || [])

      // 3. Contar niveles completados
      const { data: progresoData } = await supabase
        .from('progreso_nivel')
        .select('nivel_id')
        .eq('estudiante_id', estudianteData.id)
        .eq('completado', true)

      setCompletados(progresoData?.length || 0)

    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar tus datos')
    }

    setLoading(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const porcentajeProgreso = niveles.length > 0 ? (completados / niveles.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-700 text-white py-6">
          <div className="container mx-auto px-4">
            <div className="h-8 w-48 bg-green-600 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-green-600 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">☕</span>
                Mi Progreso
              </h1>
              <p className="text-green-100 mt-1">
                {estudiante?.nombre_completo} · {estudiante?.grado}° · 
                {estudiante?.tipo_proyecto === 'cafe' ? ' Escuela y Café' : ' Seguridad Alimentaria'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <span>🚪</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {/* Barra de progreso general */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">📊 Progreso general</h3>
            <span className="text-lg font-bold text-green-600">{Math.round(porcentajeProgreso)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${porcentajeProgreso}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {completados} de {niveles.length} niveles completados
          </p>
        </div>

        {/* Niveles */}
        <div className="grid gap-6">
          {niveles.map((nivel) => (
            <NivelCard 
              key={nivel.id} 
              nivel={nivel} 
              estudianteId={estudiante?.id}
              onProgresoChange={cargarDatos}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente para cada nivel
function NivelCard({ nivel, estudianteId, onProgresoChange }) {
  const [retos, setRetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(false)
  const [evidenciasCompletadas, setEvidenciasCompletadas] = useState(0)

  useEffect(() => {
    cargarRetos()
  }, [nivel.id])

  async function cargarRetos() {
    // Cargar retos del nivel
    const { data: retosData } = await supabase
      .from('retos')
      .select('*')
      .eq('nivel_id', nivel.id)
      .order('orden', { ascending: true })
    
    if (retosData) {
      setRetos(retosData)
      
      // Contar retos completados
      const { data: evidenciasData } = await supabase
        .from('evidencias')
        .select('reto_id, estado')
        .eq('estudiante_id', estudianteId)
        .in('reto_id', retosData.map(r => r.id))
        .eq('estado', 'aprobado')
      
      setEvidenciasCompletadas(evidenciasData?.length || 0)
    }
    setLoading(false)
  }

  const porcentajeRetos = retos.length > 0 ? (evidenciasCompletadas / retos.length) * 100 : 0
  const estaCompleto = porcentajeRetos === 100

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${expandido ? 'ring-2 ring-green-300' : 'hover:shadow-lg'}`}>
      {/* Cabecera del nivel */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-50 to-white flex justify-between items-center hover:bg-green-50 transition"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
            estaCompleto ? 'bg-green-600' : 'bg-gray-400'
          }`}>
            {estaCompleto ? '✓' : nivel.numero_nivel}
          </div>
          <div className="text-left">
            <h2 className="text-xl font-semibold text-gray-800">{nivel.nombre}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">
                {retos.length} {retos.length === 1 ? 'reto' : 'retos'}
              </p>
              {!estaCompleto && retos.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${porcentajeRetos}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(porcentajeRetos)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <span className="text-2xl text-gray-400">{expandido ? '▲' : '▼'}</span>
      </button>

      {/* Retos del nivel */}
      {expandido && (
        <div className="border-t border-gray-200 p-6 animate-fade-in">
          {loading ? (
            <p className="text-gray-500 text-center py-4">Cargando retos...</p>
          ) : (
            <div className="space-y-4">
              {retos.map((reto, index) => (
                <RetoItem 
                  key={reto.id} 
                  reto={reto} 
                  index={index} 
                  estudianteId={estudianteId}
                  onCompletado={cargarRetos}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para cada reto
function RetoItem({ reto, index, estudianteId, onCompletado }) {
  const [evidencia, setEvidencia] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    verificarEvidencia()
  }, [])

  async function verificarEvidencia() {
    const { data, error } = await supabase
      .from('evidencias')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .eq('reto_id', reto.id)
      .maybeSingle()

    if (!error && data) {
      setEvidencia(data)
    }
  }

  const getEstadoBadge = () => {
    if (!evidencia) return null
    switch (evidencia.estado) {
      case 'pendiente':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⏳ Pendiente</span>
      case 'aprobado':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✅ Aprobado</span>
      case 'rechazado':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">❌ Rechazado</span>
      default:
        return null
    }
  }

  return (
    <div className={`border rounded-lg p-4 transition-all ${evidencia?.estado === 'aprobado' ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            evidencia?.estado === 'aprobado' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {evidencia?.estado === 'aprobado' ? '✓' : index + 1}
          </div>
          <div className="flex-1">
            <p className="text-gray-800">{reto.texto}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                {reto.tipo_evidencia === 'texto' && '📝 Solo texto'}
                {reto.tipo_evidencia === 'imagen' && '🖼️ Solo imagen'}
                {reto.tipo_evidencia === 'ambos' && '📝+🖼️ Texto e imagen'}
              </span>
              {getEstadoBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Mostrar evidencia existente */}
      {evidencia && evidencia.estado === 'aprobado' && evidencia.texto_respuesta && (
        <div className="mt-3 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Tu respuesta:</strong> {evidencia.texto_respuesta}
          </p>
          {evidencia.imagenes && evidencia.imagenes.length > 0 && (
            <ImageViewer images={evidencia.imagenes} />
          )}
          {evidencia.comentario_padrino && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>💬 Comentario del padrino:</strong> {evidencia.comentario_padrino}
            </p>
          )}
          {evidencia.puntuacion && (
            <p className="text-sm text-gray-600 mt-1">
              <strong>⭐ Puntuación:</strong> {evidencia.puntuacion}/5
            </p>
          )}
        </div>
      )}

      {/* Mostrar comentario de rechazo */}
      {evidencia && evidencia.estado === 'rechazado' && evidencia.comentario_padrino && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            <strong>❌ Motivo del rechazo:</strong> {evidencia.comentario_padrino}
          </p>
        </div>
      )}

      {/* Botón para subir/editar evidencia */}
      {(!evidencia || evidencia.estado === 'rechazado') && (
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
        >
          {mostrarFormulario ? '✕ Cancelar' : evidencia ? '✏️ Editar evidencia' : '📤 Subir evidencia'}
        </button>
      )}

      {/* Formulario para subir evidencia */}
      {mostrarFormulario && (
        <FormularioEvidencia
          reto={reto}
          estudianteId={estudianteId}
          evidenciaExistente={evidencia}
          onEnviado={() => {
            setMostrarFormulario(false)
            verificarEvidencia()
            onCompletado()
          }}
        />
      )}
    </div>
  )
}

// Formulario para subir evidencia
function FormularioEvidencia({ reto, estudianteId, evidenciaExistente, onEnviado }) {
  const [texto, setTexto] = useState(evidenciaExistente?.texto_respuesta || '')
  const [imagenes, setImagenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState([])

  const handleImagenes = (e) => {
    const files = Array.from(e.target.files)
    setImagenes(files)
    
    // Crear vistas previas
    const previews = files.map(file => URL.createObjectURL(file))
    setVistaPrevia(previews)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (reto.tipo_evidencia === 'texto' && !texto.trim()) {
      toast.error('Debes escribir una respuesta')
      return
    }
    if (reto.tipo_evidencia === 'imagen' && imagenes.length === 0) {
      toast.error('Debes subir al menos una imagen')
      return
    }
    
    setLoading(true)

    // Subir imágenes si hay
    const urlsImagenes = []
    for (const imagen of imagenes) {
      const fileName = `${Date.now()}_${imagen.name}`
      const { error } = await supabase.storage
        .from('evidencias')
        .upload(`estudiante_${estudianteId}/${fileName}`, imagen)

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('evidencias')
          .getPublicUrl(`estudiante_${estudianteId}/${fileName}`)
        urlsImagenes.push(urlData.publicUrl)
      }
    }

    // Combinar imágenes existentes con nuevas
    const imagenesFinales = evidenciaExistente?.imagenes || []
    if (urlsImagenes.length > 0) {
      imagenesFinales.push(...urlsImagenes)
    }

    // Guardar evidencia
    const evidenciaData = {
      estudiante_id: estudianteId,
      reto_id: reto.id,
      texto_respuesta: reto.tipo_evidencia !== 'imagen' ? texto : null,
      imagenes: imagenesFinales.length > 0 ? imagenesFinales : null,
      estado: 'pendiente'
    }

    let error
    if (evidenciaExistente) {
      const { error: updateError } = await supabase
        .from('evidencias')
        .update(evidenciaData)
        .eq('id', evidenciaExistente.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('evidencias')
        .insert(evidenciaData)
      error = insertError
    }

    if (error) {
      toast.error('Error al enviar la evidencia')
      console.error(error)
    } else {
      toast.success('¡Evidencia enviada! Espera la revisión del padrino')
      onEnviado()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg">
      {(reto.tipo_evidencia === 'texto' || reto.tipo_evidencia === 'ambos') && (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-medium">Tu respuesta:</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            rows="4"
            placeholder="Escribe aquí tu respuesta..."
            required={reto.tipo_evidencia === 'texto'}
          />
        </div>
      )}

      {(reto.tipo_evidencia === 'imagen' || reto.tipo_evidencia === 'ambos') && (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-medium">Subir imagen(es):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagenes}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {vistaPrevia.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {vistaPrevia.map((preview, idx) => (
                <img key={idx} src={preview} alt={`Vista previa ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          {loading ? 'Enviando...' : '📨 Enviar evidencia'}
        </button>
        <button
          type="button"
          onClick={() => {
            setTexto('')
            setImagenes([])
            setVistaPrevia([])
          }}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          Limpiar
        </button>
      </div>
    </form>
  )
}