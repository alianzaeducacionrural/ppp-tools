import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

export function Registro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingInstituciones, setLoadingInstituciones] = useState(false)
  const [loadingSedes, setLoadingSedes] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [municipios, setMunicipios] = useState([])
  const [instituciones, setInstituciones] = useState([])
  const [sedes, setSedes] = useState([])
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    tipo_documento: 'CC',
    numero_documento: '',
    municipio_id: '',
    institucion_id: '',
    sede_id: '',
    grado: '4',
    edad: '',
    tipo_proyecto: 'cafe'
  })

  // Cargar municipios
  useEffect(() => {
    cargarMunicipios()
  }, [])

  async function cargarMunicipios() {
    const { data } = await supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
    if (data) setMunicipios(data)
  }

  async function cargarInstituciones(municipioId) {
    if (!municipioId) {
      setInstituciones([])
      return
    }
    setLoadingInstituciones(true)
    setFormData(prev => ({ ...prev, institucion_id: '', sede_id: '' }))
    setSedes([])
    const { data } = await supabase
      .from('instituciones')
      .select('id, nombre')
      .eq('municipio_id', municipioId)
      .order('nombre')
    if (data) setInstituciones(data)
    setLoadingInstituciones(false)
  }

  async function cargarSedes(institucionId) {
    if (!institucionId) {
      setSedes([])
      return
    }
    setLoadingSedes(true)
    setFormData(prev => ({ ...prev, sede_id: '' }))
    const { data } = await supabase
      .from('sedes')
      .select('id, nombre')
      .eq('institucion_id', institucionId)
      .order('nombre')
    if (data) setSedes(data)
    setLoadingSedes(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    if (name === 'municipio_id') {
      cargarInstituciones(value)
    }
    if (name === 'institucion_id') {
      cargarSedes(value)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (!formData.municipio_id || !formData.institucion_id || !formData.sede_id) {
      toast.error('Por favor selecciona tu ubicación completa')
      return
    }
    
    if (!formData.edad || parseInt(formData.edad) < 4 || parseInt(formData.edad) > 18) {
      toast.error('La edad debe estar entre 4 y 18 años')
      return
    }

    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.nombre_completo
        }
      }
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    const { error: estudianteError } = await supabase
      .from('estudiantes')
      .insert({
        user_id: authData.user.id,
        nombre_completo: formData.nombre_completo,
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento,
        municipio_id: parseInt(formData.municipio_id),
        institucion_id: parseInt(formData.institucion_id),
        sede_id: parseInt(formData.sede_id),
        grado: formData.grado,
        edad: parseInt(formData.edad),
        tipo_proyecto: formData.tipo_proyecto,
        email: formData.email
      })

    if (estudianteError) {
      toast.error('Error al guardar tus datos: ' + estudianteError.message)
      console.error(estudianteError)
    } else {
      toast.success('¡Registro exitoso! Ya puedes iniciar sesión')
      navigate('/login')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5efe6] py-6 sm:py-10 px-4 relative overflow-hidden">
      {/* Decoración sutil */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#e8dcca] rounded-full translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#d4c4a8] rounded-full -translate-x-1/3 translate-y-1/3 opacity-30 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 text-[100px] opacity-[0.04] select-none pointer-events-none leading-none">🌱</div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-6 text-center relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute bottom-0 right-0 text-[80px] opacity-[0.05] leading-none select-none">☕</div>
            <div className="relative">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/15 flex items-center justify-center text-2xl mb-3 border border-white/20">📝</div>
              <h1 className="text-xl font-bold text-white">Registro de Estudiante</h1>
              <p className="text-[#d4c4a8] text-xs mt-1">Crea tu cuenta para empezar</p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Sección: Información Personal */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">👤</span>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64]">Información Personal</h3>
                  <div className="flex-1 h-px bg-[#e8dcca]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Nombre completo *</label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                      placeholder="Escribe tu nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Correo electrónico *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Contraseña *</label>
                    <div className="relative">
                      <input
                        type={mostrarPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition ${
                          formData.password && formData.password.length < 6 ? 'border-red-300' : 'border-[#e8dcca]'
                        }`}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a68a64] hover:text-[#6b4c3a] transition"
                      >
                        {mostrarPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {formData.password && formData.password.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Tipo documento</label>
                    <select
                      name="tipo_documento"
                      value={formData.tipo_documento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    >
                      <option value="CC">Cédula de ciudadanía</option>
                      <option value="TI">Tarjeta de identidad</option>
                      <option value="CE">Cédula de extranjería</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Número documento *</label>
                    <input
                      type="text"
                      name="numero_documento"
                      value={formData.numero_documento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                      placeholder="Número de documento"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Ubicación */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📍</span>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64]">Ubicación</h3>
                  <div className="flex-1 h-px bg-[#e8dcca]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Municipio *</label>
                    <select
                      name="municipio_id"
                      value={formData.municipio_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {municipios.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm flex items-center gap-1">
                      Institución *
                      {loadingInstituciones && <span className="animate-spin text-xs">⏳</span>}
                    </label>
                    <select
                      name="institucion_id"
                      value={formData.institucion_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition disabled:opacity-60"
                      required
                      disabled={!formData.municipio_id || loadingInstituciones}
                    >
                      <option value="">
                        {loadingInstituciones ? 'Cargando...' : !formData.municipio_id ? 'Primero el municipio' : 'Seleccionar...'}
                      </option>
                      {instituciones.map(i => (
                        <option key={i.id} value={i.id}>{i.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm flex items-center gap-1">
                      Sede *
                      {loadingSedes && <span className="animate-spin text-xs">⏳</span>}
                    </label>
                    <select
                      name="sede_id"
                      value={formData.sede_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition disabled:opacity-60"
                      required
                      disabled={!formData.institucion_id || loadingSedes}
                    >
                      <option value="">
                        {loadingSedes ? 'Cargando...' : !formData.institucion_id ? 'Primero la institución' : 'Seleccionar...'}
                      </option>
                      {sedes.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección: Datos Académicos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📚</span>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a68a64]">Datos Académicos</h3>
                  <div className="flex-1 h-px bg-[#e8dcca]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Grado *</label>
                    <select
                      name="grado"
                      value={formData.grado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    >
                      {[4,5,6,7,8,9,10,11].map(g => (
                        <option key={g} value={g}>{g}°</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#4a3222] font-medium mb-1 text-sm">Edad *</label>
                    <input
                      type="number"
                      name="edad"
                      value={formData.edad}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                      placeholder="Entre 4 y 18 años"
                      min={4}
                      max={18}
                      required
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[#4a3222] font-medium mb-2 text-sm">Tipo de proyecto *</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition flex-1 ${formData.tipo_proyecto === 'cafe' ? 'border-[#6b4c3a] bg-[#f5efe6]' : 'border-[#e8dcca] hover:border-[#a68a64]'}`}>
                        <input
                          type="radio"
                          name="tipo_proyecto"
                          value="cafe"
                          checked={formData.tipo_proyecto === 'cafe'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#6b4c3a]"
                        />
                        <span className="text-[#4a3222] text-sm font-medium">☕ Escuela y Café</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition flex-1 ${formData.tipo_proyecto === 'alimentacion' ? 'border-[#6b4c3a] bg-[#f5efe6]' : 'border-[#e8dcca] hover:border-[#a68a64]'}`}>
                        <input
                          type="radio"
                          name="tipo_proyecto"
                          value="alimentacion"
                          checked={formData.tipo_proyecto === 'alimentacion'}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#6b4c3a]"
                        />
                        <span className="text-[#4a3222] text-sm font-medium">🌽 Seguridad Alimentaria</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 mt-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registrando...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>
            
            <div className="mt-5 text-center">
              <p className="text-[#a68a64] text-xs">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#6b4c3a] hover:text-[#4a3222] font-semibold hover:underline transition"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}