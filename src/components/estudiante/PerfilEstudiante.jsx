import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { 
  avatares, 
  getAvatarById, 
  getAvataresDesbloqueados
} from '../../data/avatares'
import { Avatar } from '../comunes/Avatar'
import { obtenerRango } from '../../data/rangos'

export function PerfilEstudiante({ estudiante, onActualizar, puntuacionTotal, nivelesCompletados }) {
  const [editando, setEditando] = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [seleccionandoAvatar, setSeleccionandoAvatar] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: estudiante?.nombre_completo || '',
    telefono: estudiante?.telefono || '',
    direccion: estudiante?.direccion || ''
  })
  const [passwordData, setPasswordData] = useState({
    nueva_password: '',
    confirmar_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null)
  const [avataresDesbloqueados, setAvataresDesbloqueados] = useState([])
  const [stats, setStats] = useState({
    totalRetosCompletados: 0,
    totalInsignias: 0,
    promedioPuntuacion: 0
  })

  const rango = obtenerRango(puntuacionTotal, estudiante?.tipo_proyecto || 'cafe')

  useEffect(() => {
    const avatarActual = getAvatarById(estudiante?.avatar_id || 1)
    setAvatarSeleccionado(avatarActual)
    
    const nivelesCompletadosIds = nivelesCompletados?.map(n => n.numero_nivel) || []
    const desbloqueados = getAvataresDesbloqueados(nivelesCompletadosIds)
    setAvataresDesbloqueados(desbloqueados)
  }, [estudiante?.avatar_id, nivelesCompletados])

  useEffect(() => {
    cargarEstadisticas()
  }, [estudiante?.id])

  async function cargarEstadisticas() {
    const { data: evidencias } = await supabase
      .from('evidencias')
      .select('puntuacion')
      .eq('estudiante_id', estudiante?.id)
      .eq('estado', 'aprobado')

    const retosCompletados = evidencias?.length || 0
    const sumaPuntuaciones = evidencias?.reduce((sum, e) => sum + (e.puntuacion || 0), 0)
    const promedio = retosCompletados > 0 ? Math.round(sumaPuntuaciones / retosCompletados) : 0

    const { count: insigniasCount } = await supabase
      .from('insignias_obtenidas')
      .select('*', { count: 'exact', head: true })
      .eq('estudiante_id', estudiante?.id)

    setStats({
      totalRetosCompletados: retosCompletados,
      totalInsignias: insigniasCount || 0,
      promedioPuntuacion: promedio
    })
  }

  const handleCambiarAvatar = async (avatarId) => {
    const avatar = avatares.find(a => a.id === avatarId)
    const estaDesbloqueado = avataresDesbloqueados.some(a => a.id === avatarId)
    
    if (!estaDesbloqueado) {
      toast.error(`❌ El avatar "${avatar?.nombre}" aún no está desbloqueado. Completa más niveles para obtenerlo.`)
      return
    }
    
    setLoading(true)
    
    const { error } = await supabase
      .from('estudiantes')
      .update({ avatar_id: avatarId })
      .eq('id', estudiante.id)

    if (error) {
      toast.error('Error al cambiar avatar')
    } else {
      toast.success('Avatar actualizado correctamente')
      setSeleccionandoAvatar(false)
      setAvatarSeleccionado(getAvatarById(avatarId))
      onActualizar()
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const updateData = {}
    if (formData.nombre_completo !== estudiante?.nombre_completo) {
      updateData.nombre_completo = formData.nombre_completo
    }
    if (formData.telefono !== estudiante?.telefono) {
      updateData.telefono = formData.telefono || null
    }
    if (formData.direccion !== estudiante?.direccion) {
      updateData.direccion = formData.direccion || null
    }

    if (Object.keys(updateData).length === 0) {
      toast.info('No hay cambios para guardar')
      setEditando(false)
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('estudiantes')
      .update(updateData)
      .eq('id', estudiante.id)

    if (error) {
      toast.error('Error al actualizar perfil: ' + error.message)
    } else {
      toast.success('Perfil actualizado correctamente')
      setEditando(false)
      onActualizar()
    }
    setLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.nueva_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (passwordData.nueva_password !== passwordData.confirmar_password) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: passwordData.nueva_password
    })

    if (error) {
      toast.error('Error al cambiar contraseña: ' + error.message)
    } else {
      toast.success('Contraseña actualizada correctamente')
      setCambiandoPassword(false)
      setPasswordData({ nueva_password: '', confirmar_password: '' })
    }
    setLoading(false)
  }

  const emailEstudiante = estudiante?.email || estudiante?.user?.email || 'No registrado'
  const avataresBloqueados = avatares.length - avataresDesbloqueados.length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tarjeta principal del perfil - responsive */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-[#e8dcca]">
        {/* Banner de rango y avatar - responsive */}
        <div className={`${rango.color} ${rango.border} border-b p-4 sm:p-6 text-center`}>
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-3 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-lg">
              <Avatar avatar={avatarSeleccionado} size="xl" className="w-full h-full object-cover rounded-full" />
            </div>
            <button
              onClick={() => setSeleccionandoAvatar(true)}
              className="absolute bottom-0 right-0 bg-[#6b4c3a] text-white p-1.5 rounded-full hover:bg-[#4a3222] transition shadow-md"
              title="Cambiar avatar"
            >
              <span className="text-xs sm:text-sm">✏️</span>
            </button>
          </div>
          
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#4a3222] mt-2">{estudiante?.nombre_completo}</h2>
          <div className={`mt-2 inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${rango.color} border ${rango.border}`}>
            <span className="text-base sm:text-lg">{rango.emoji}</span>
            <span className="text-xs sm:text-sm font-medium">{rango.nombre}</span>
            <span className="text-xs sm:text-sm opacity-75">{puntuacionTotal} pts</span>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {/* Estadísticas rápidas - responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-2 sm:p-4 bg-[#f5efe6] rounded-lg sm:rounded-xl">
              <p className="text-xl sm:text-2xl font-bold text-[#4a3222]">{stats.totalRetosCompletados}</p>
              <p className="text-xs sm:text-sm text-[#a68a64]">Retos completados</p>
            </div>
            <div className="text-center p-2 sm:p-4 bg-[#f5efe6] rounded-lg sm:rounded-xl">
              <p className="text-xl sm:text-2xl font-bold text-[#4a3222]">{stats.totalInsignias}</p>
              <p className="text-xs sm:text-sm text-[#a68a64]">Insignias obtenidas</p>
            </div>
            <div className="text-center p-2 sm:p-4 bg-[#f5efe6] rounded-lg sm:rounded-xl">
              <p className="text-xl sm:text-2xl font-bold text-[#4a3222]">{stats.promedioPuntuacion}</p>
              <p className="text-xs sm:text-sm text-[#a68a64]">Promedio de puntuación</p>
            </div>
          </div>

          {/* Información personal - responsive */}
          <div className="border-t border-[#e8dcca] pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a3222] flex items-center gap-2">
                <span>📋</span> Información personal
              </h3>
              {!editando && !cambiandoPassword && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditando(true)} 
                    className="text-[#a68a64] hover:text-[#4a3222] text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg hover:bg-[#f5efe6] transition"
                  >
                    ✏️ Editar perfil
                  </button>
                  <button 
                    onClick={() => setCambiandoPassword(true)} 
                    className="text-[#a68a64] hover:text-[#4a3222] text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg hover:bg-[#f5efe6] transition"
                  >
                    🔑 Cambiar contraseña
                  </button>
                </div>
              )}
            </div>

            {editando && (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 bg-[#f5efe6] p-3 sm:p-4 rounded-lg sm:rounded-xl">
                <div>
                  <label className="block text-xs sm:text-sm text-[#a68a64] mb-1">Nombre completo *</label>
                  <input 
                    type="text" 
                    name="nombre_completo" 
                    value={formData.nombre_completo} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none bg-white" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[#a68a64] mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    value={emailEstudiante} 
                    disabled 
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-lg bg-gray-100 text-gray-500" 
                  />
                  <p className="text-xs text-[#a68a64] mt-1">El correo no se puede cambiar</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[#a68a64] mb-1">Teléfono</label>
                  <input 
                    type="tel" 
                    name="telefono" 
                    value={formData.telefono} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none bg-white" 
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[#a68a64] mb-1">Dirección</label>
                  <input 
                    type="text" 
                    name="direccion" 
                    value={formData.direccion} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none bg-white" 
                    placeholder="Opcional"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="bg-[#6b4c3a] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#4a3222] transition text-sm">
                    {loading ? 'Guardando...' : '💾 Guardar cambios'}
                  </button>
                  <button type="button" onClick={() => setEditando(false)} className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {cambiandoPassword && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4 bg-[#f5efe6] p-3 sm:p-4 rounded-lg sm:rounded-xl">
                <div>
                  <label className="block text-xs sm:text-sm text-[#a68a64] mb-1">Nueva contraseña</label>
                  <input 
                    type="password" 
                    name="nueva_password" 
                    value={passwordData.nueva_password} 
                    onChange={handlePasswordChange} 
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none bg-white" 
                    placeholder="Mínimo 6 caracteres"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[#a68a64] mb-1">Confirmar contraseña</label>
                  <input 
                    type="password" 
                    name="confirmar_password" 
                    value={passwordData.confirmar_password} 
                    onChange={handlePasswordChange} 
                    className="w-full px-3 py-2 text-sm sm:text-base border border-[#e8dcca] rounded-lg focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none bg-white" 
                    required 
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="bg-[#6b4c3a] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#4a3222] transition text-sm">
                    {loading ? 'Guardando...' : '🔑 Cambiar contraseña'}
                  </button>
                  <button type="button" onClick={() => setCambiandoPassword(false)} className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {!editando && !cambiandoPassword && (
              <div className="space-y-2 sm:space-y-3 text-sm bg-[#f5efe6] p-3 sm:p-4 rounded-lg sm:rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <span className="text-xs sm:text-sm text-[#a68a64]">📧 Correo:</span>
                    <p className="text-sm sm:text-base font-medium text-[#4a3222] break-all">{emailEstudiante}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-[#a68a64]">📞 Teléfono:</span>
                    <p className="text-sm sm:text-base font-medium text-[#4a3222]">{estudiante?.telefono || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-[#a68a64]">📍 Dirección:</span>
                    <p className="text-sm sm:text-base font-medium text-[#4a3222]">{estudiante?.direccion || 'No registrada'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-[#a68a64]">🏫 Institución:</span>
                    <p className="text-sm sm:text-base font-medium text-[#4a3222] break-words">{estudiante?.instituciones?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-[#a68a64]">🌾 Proyecto:</span>
                    <p className="text-sm sm:text-base font-medium text-[#4a3222]">{estudiante?.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seguridad Alimentaria'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-[#a68a64]">📚 Grado:</span>
                    <p className="text-sm sm:text-base font-medium text-[#4a3222]">{estudiante?.grado}°</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de selección de avatar - responsive */}
      {seleccionandoAvatar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a3222]">Selecciona tu avatar</h3>
              <button onClick={() => setSeleccionandoAvatar(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            
            <div className="mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                🔓 {avataresDesbloqueados.length} de {avatares.length} avatares desbloqueados
              </p>
              {avataresBloqueados > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Completa niveles para desbloquear {avataresBloqueados} avatares más
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
              {avatares.map(avatar => {
                const estaDesbloqueado = avataresDesbloqueados.some(a => a.id === avatar.id)
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleCambiarAvatar(avatar.id)}
                    disabled={!estaDesbloqueado}
                    className={`p-2 sm:p-3 rounded-xl transition-all ${
                      avatarSeleccionado?.id === avatar.id 
                        ? 'ring-2 ring-[#6b4c3a] bg-[#f5efe6]' 
                        : estaDesbloqueado 
                          ? 'hover:bg-gray-100' 
                          : 'opacity-40 cursor-not-allowed grayscale'
                    }`}
                    title={estaDesbloqueado ? avatar.descripcion : `🔒 ${avatar.descripcion}`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto flex items-center justify-center">
                      <Avatar avatar={avatar} size="lg" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-center mt-1 text-[#4a3222]">{avatar.nombre}</p>
                    {!estaDesbloqueado && (
                      <p className="text-[10px] sm:text-xs text-center text-gray-400">🔒</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}