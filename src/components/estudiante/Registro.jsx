import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

export function Registro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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
    const { data } = await supabase
      .from('instituciones')
      .select('id, nombre')
      .eq('municipio_id', municipioId)
      .order('nombre')
    if (data) setInstituciones(data)
    setFormData(prev => ({ ...prev, institucion_id: '', sede_id: '' }))
  }

  async function cargarSedes(institucionId) {
    if (!institucionId) {
      setSedes([])
      return
    }
    const { data } = await supabase
      .from('sedes')
      .select('id, nombre')
      .eq('institucion_id', institucionId)
      .order('nombre')
    if (data) setSedes(data)
    setFormData(prev => ({ ...prev, sede_id: '' }))
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5efe6] via-[#e8dcca] to-[#d4c4a8] py-6 sm:py-8 px-4 relative overflow-hidden">
      {/* Elementos decorativos flotantes - responsive */}
      <div className="absolute top-20 left-10 text-5xl sm:text-6xl opacity-5 animate-bounce pointer-events-none hidden sm:block">🌱</div>
      <div className="absolute bottom-20 right-10 text-5xl sm:text-6xl opacity-5 animate-pulse pointer-events-none hidden md:block">🍃</div>
      <div className="absolute top-1/3 right-1/4 text-4xl sm:text-5xl opacity-5 animate-spin-slow pointer-events-none hidden lg:block">☕</div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500">
          {/* Header - responsive */}
          <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] p-4 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl mb-2 animate-bounce">📝</div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Registro de Estudiante</h1>
            <p className="text-[#d4c4a8] text-xs sm:text-sm mt-1">Completa tu aventura cafetera</p>
          </div>
          
          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Nombre completo *</label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Correo electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
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
                  <p className="text-xs text-[#a68a64] mt-1">Mínimo 6 caracteres</p>
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Tipo documento</label>
                  <select
                    name="tipo_documento"
                    value={formData.tipo_documento}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                  >
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="TI">Tarjeta de identidad</option>
                    <option value="CE">Cédula de extranjería</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Número documento *</label>
                  <input
                    type="text"
                    name="numero_documento"
                    value={formData.numero_documento}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    required
                  />
                </div>
                
                {/* Ubicación */}
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Municipio *</label>
                  <select
                    name="municipio_id"
                    value={formData.municipio_id}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    required
                  >
                    <option value="">Seleccionar municipio</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Institución *</label>
                  <select
                    name="institucion_id"
                    value={formData.institucion_id}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    required
                    disabled={!formData.municipio_id}
                  >
                    <option value="">Seleccionar institución</option>
                    {instituciones.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Sede *</label>
                  <select
                    name="sede_id"
                    value={formData.sede_id}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    required
                    disabled={!formData.institucion_id}
                  >
                    <option value="">Seleccionar sede</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Grado *</label>
                  <select
                    name="grado"
                    value={formData.grado}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                  >
                    {[4,5,6,7,8,9,10,11].map(g => (
                      <option key={g} value={g}>{g}°</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#4a3222] font-medium mb-1 text-sm sm:text-base">Edad *</label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] bg-[#faf8f5] transition"
                    placeholder="4 - 18 años"
                    required
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[#4a3222] font-medium mb-2 text-sm sm:text-base">Tipo de proyecto *</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 p-3 border border-[#e8dcca] rounded-xl cursor-pointer hover:bg-[#f5efe6] transition flex-1">
                      <input
                        type="radio"
                        name="tipo_proyecto"
                        value="cafe"
                        checked={formData.tipo_proyecto === 'cafe'}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#6b4c3a]"
                      />
                      <span className="text-[#4a3222] text-sm sm:text-base">☕ Escuela y Café</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border border-[#e8dcca] rounded-xl cursor-pointer hover:bg-[#f5efe6] transition flex-1">
                      <input
                        type="radio"
                        name="tipo_proyecto"
                        value="alimentacion"
                        checked={formData.tipo_proyecto === 'alimentacion'}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#6b4c3a]"
                      />
                      <span className="text-[#4a3222] text-sm sm:text-base">🌽 Seguridad Alimentaria</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 mt-4 text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Registrando...
                  </span>
                ) : (
                  '🌱 Registrarse'
                )}
              </button>
            </form>
            
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-[#a68a64] text-xs sm:text-sm">
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

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  )
}