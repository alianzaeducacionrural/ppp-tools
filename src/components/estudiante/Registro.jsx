import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

export function Registro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    tipo_documento: 'CC',
    numero_documento: '',
    municipio: '',
    institucion: '',
    sede: '',
    grado: '4',
    edad: '',
    tipo_proyecto: 'cafe'
  })

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)

  // 1. Crear usuario en auth
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

  // Esperar un momento para que el usuario se cree completamente
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 2. Crear registro en tabla estudiantes
  const { error: estudianteError } = await supabase
    .from('estudiantes')
    .insert({
      user_id: authData.user.id,
      nombre_completo: formData.nombre_completo,
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento,
      municipio: formData.municipio,
      institucion: formData.institucion,
      sede: formData.sede,
      grado: formData.grado,
      edad: parseInt(formData.edad),
      tipo_proyecto: formData.tipo_proyecto
    })

  if (estudianteError) {
    toast.error('Error al guardar tus datos: ' + estudianteError.message)
    console.error('Error detallado:', estudianteError)
  } else {
    toast.success('¡Registro exitoso! Ya puedes iniciar sesión')
    navigate('/login')
  }

  setLoading(false)
}

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-green-800 mb-6">
          Registro de Estudiante
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Correo electrónico *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Tipo documento</label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="CC">Cédula de ciudadanía</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="CE">Cédula de extranjería</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Número documento *</label>
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Municipio *</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Institución educativa *</label>
              <input
                type="text"
                name="institucion"
                value={formData.institucion}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Sede *</label>
              <input
                type="text"
                name="sede"
                value={formData.sede}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Grado *</label>
              <select
                name="grado"
                value={formData.grado}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[4,5,6,7,8,9,10,11].map(g => (
                  <option key={g} value={g}>{g}°</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Edad *</label>
              <input
                type="number"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-gray-700 mb-1">Tipo de proyecto *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo_proyecto"
                    value="cafe"
                    checked={formData.tipo_proyecto === 'cafe'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Escuela y Café
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo_proyecto"
                    value="alimentacion"
                    checked={formData.tipo_proyecto === 'alimentacion'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Seguridad Alimentaria
                </label>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-green-600 hover:underline"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  )
}