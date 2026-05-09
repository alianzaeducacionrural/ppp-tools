import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { avatares, getAvatarById, getAvataresDesbloqueados } from '../../data/avatares'
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
  const [passwordData, setPasswordData] = useState({ nueva_password: '', confirmar_password: '' })
  const [loading, setLoading] = useState(false)
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null)
  const [avataresDesbloqueados, setAvataresDesbloqueados] = useState([])
  const [stats, setStats] = useState({ totalRetosCompletados: 0, totalInsignias: 0, promedioPuntuacion: 0 })

  const rango = obtenerRango(puntuacionTotal, estudiante?.tipo_proyecto || 'cafe')

  useEffect(() => {
    setAvatarSeleccionado(getAvatarById(estudiante?.avatar_id || 1))
    const ids = nivelesCompletados?.map(n => n.numero_nivel) || []
    setAvataresDesbloqueados(getAvataresDesbloqueados(ids))
  }, [estudiante?.avatar_id, nivelesCompletados])

  useEffect(() => { if (estudiante?.id) cargarEstadisticas() }, [estudiante?.id])

  async function cargarEstadisticas() {
    const [{ data: evidencias }, { count: insigniasCount }] = await Promise.all([
      supabase.from('evidencias').select('puntuacion').eq('estudiante_id', estudiante?.id).eq('estado', 'aprobado'),
      supabase.from('insignias_obtenidas').select('*', { count: 'exact', head: true }).eq('estudiante_id', estudiante?.id)
    ])
    const retosCompletados = evidencias?.length || 0
    const suma = evidencias?.reduce((s, e) => s + (e.puntuacion || 0), 0) || 0
    setStats({
      totalRetosCompletados: retosCompletados,
      totalInsignias: insigniasCount || 0,
      promedioPuntuacion: retosCompletados > 0 ? Math.round(suma / retosCompletados) : 0
    })
  }

  const handleCambiarAvatar = async (avatarId) => {
    const avatar = avatares.find(a => a.id === avatarId)
    if (!avataresDesbloqueados.some(a => a.id === avatarId)) {
      toast.error(`❌ "${avatar?.nombre}" aún no está desbloqueado. Completa más niveles.`)
      return
    }
    setLoading(true)
    const { error } = await supabase.from('estudiantes').update({ avatar_id: avatarId }).eq('id', estudiante.id)
    if (error) { toast.error('Error al cambiar avatar') }
    else { toast.success('Avatar actualizado'); setSeleccionandoAvatar(false); setAvatarSeleccionado(getAvatarById(avatarId)); onActualizar() }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const updateData = {}
    if (formData.nombre_completo !== estudiante?.nombre_completo) updateData.nombre_completo = formData.nombre_completo
    if (formData.telefono !== estudiante?.telefono) updateData.telefono = formData.telefono || null
    if (formData.direccion !== estudiante?.direccion) updateData.direccion = formData.direccion || null
    if (Object.keys(updateData).length === 0) { toast.info('No hay cambios'); setEditando(false); setLoading(false); return }
    const { error } = await supabase.from('estudiantes').update(updateData).eq('id', estudiante.id)
    if (error) { toast.error('Error al actualizar: ' + error.message) }
    else { toast.success('Perfil actualizado'); setEditando(false); onActualizar() }
    setLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.nueva_password.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    if (passwordData.nueva_password !== passwordData.confirmar_password) { toast.error('Las contraseñas no coinciden'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwordData.nueva_password })
    if (error) { toast.error('Error: ' + error.message) }
    else { toast.success('Contraseña actualizada'); setCambiandoPassword(false); setPasswordData({ nueva_password: '', confirmar_password: '' }) }
    setLoading(false)
  }

  const emailEstudiante = estudiante?.email || 'No registrado'
  const avataresBloqueados = avatares.length - avataresDesbloqueados.length

  const inputCls = "w-full px-3 py-2.5 text-sm border border-[#e8dcca] rounded-xl focus:ring-2 focus:ring-[#6b4c3a] focus:outline-none bg-white transition"
  const labelCls = "block text-[10px] font-bold text-[#a68a64] uppercase tracking-widest mb-1.5"

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── TARJETA PRINCIPAL ── */}
      <div className="bg-white rounded-2xl shadow-md border border-[#e8dcca] overflow-hidden">

        {/* Banner */}
        <div className="relative bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] px-6 pt-10 pb-14 text-center overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-6 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-3 left-4 text-6xl text-white/[0.06] select-none pointer-events-none">☕</div>

          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-[3px] border-white/30 shadow-xl bg-white/20">
              <Avatar avatar={avatarSeleccionado} size="xl" className="w-full h-full object-cover rounded-full" />
            </div>
            <button
              onClick={() => setSeleccionandoAvatar(true)}
              className="absolute bottom-0 right-0 bg-white text-[#6b4c3a] p-1.5 rounded-full hover:bg-[#f5efe6] transition shadow-md border border-[#e8dcca]"
              title="Cambiar avatar"
            >
              <span className="text-xs">✏️</span>
            </button>
          </div>

          <h2 className="text-white font-bold text-lg mt-3 drop-shadow">{estudiante?.nombre_completo}</h2>
          <p className="text-white/50 text-xs mt-0.5">{estudiante?.grado}° · {estudiante?.instituciones?.nombre}</p>
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
            <span className="text-sm">{rango.emoji}</span>
            <span className="text-white text-xs font-semibold">{rango.nombre}</span>
            <span className="text-white/50 text-xs">{puntuacionTotal} pts</span>
          </div>
        </div>

        {/* Stats flotantes */}
        <div className="mx-4 -mt-6 relative z-10 bg-white rounded-2xl border border-[#e8dcca] shadow-lg grid grid-cols-3 divide-x divide-[#e8dcca]">
          {[
            { icon: '✅', bg: 'bg-emerald-50', border: 'border-emerald-100', value: stats.totalRetosCompletados, label: 'Retos' },
            { icon: '🏆', bg: 'bg-amber-50',   border: 'border-amber-100',   value: stats.totalInsignias,       label: 'Insignias' },
            { icon: '⭐', bg: 'bg-sky-50',      border: 'border-sky-100',     value: stats.promedioPuntuacion,   label: 'Promedio' },
          ].map(({ icon, bg, border, value, label }) => (
            <div key={label} className="px-3 py-4 text-center">
              <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mx-auto mb-1.5 text-base`}>{icon}</div>
              <p className="text-xl font-bold text-[#4a3222]">{value}</p>
              <p className="text-[10px] text-[#a68a64] font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Sección de info */}
        <div className="p-5 mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#4a3222] uppercase tracking-widest">Información personal</h3>
            {!editando && !cambiandoPassword && (
              <div className="flex gap-2">
                <button onClick={() => setEditando(true)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#f5efe6] text-[#6b4c3a] hover:bg-[#e8dcca] transition">✏️ Editar</button>
                <button onClick={() => setCambiandoPassword(true)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#f5efe6] text-[#6b4c3a] hover:bg-[#e8dcca] transition">🔑 Contraseña</button>
              </div>
            )}
          </div>

          {/* Formulario editar */}
          {editando && (
            <form onSubmit={handleSubmit} className="space-y-3 bg-[#faf7f3] p-4 rounded-2xl border border-[#e8dcca]">
              <div>
                <label className={labelCls}>Nombre completo *</label>
                <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Correo electrónico</label>
                <input type="email" value={emailEstudiante} disabled className="w-full px-3 py-2.5 text-sm border border-[#e8dcca] rounded-xl bg-[#f0f0f0] text-gray-400" />
                <p className="text-[10px] text-[#a68a64] mt-1">No se puede cambiar</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={inputCls} placeholder="Opcional" />
                </div>
                <div>
                  <label className={labelCls}>Dirección</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={inputCls} placeholder="Opcional" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={loading} className="flex-1 bg-[#6b4c3a] text-white py-2.5 rounded-xl hover:bg-[#4a3222] transition text-sm font-medium disabled:opacity-50">
                  {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
                </button>
                <button type="button" onClick={() => setEditando(false)} className="px-4 py-2.5 bg-[#e8dcca] text-[#6b4c3a] rounded-xl hover:bg-[#d4c4a8] transition text-sm font-medium">Cancelar</button>
              </div>
            </form>
          )}

          {/* Formulario contraseña */}
          {cambiandoPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3 bg-[#faf7f3] p-4 rounded-2xl border border-[#e8dcca]">
              <div>
                <label className={labelCls}>Nueva contraseña</label>
                <input type="password" name="nueva_password" value={passwordData.nueva_password} onChange={e => setPasswordData({...passwordData, [e.target.name]: e.target.value})} className={inputCls} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className={labelCls}>Confirmar contraseña</label>
                <input type="password" name="confirmar_password" value={passwordData.confirmar_password} onChange={e => setPasswordData({...passwordData, [e.target.name]: e.target.value})} className={inputCls} required />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={loading} className="flex-1 bg-[#6b4c3a] text-white py-2.5 rounded-xl hover:bg-[#4a3222] transition text-sm font-medium disabled:opacity-50">
                  {loading ? '⏳ Cambiando...' : '🔑 Cambiar contraseña'}
                </button>
                <button type="button" onClick={() => setCambiandoPassword(false)} className="px-4 py-2.5 bg-[#e8dcca] text-[#6b4c3a] rounded-xl hover:bg-[#d4c4a8] transition text-sm font-medium">Cancelar</button>
              </div>
            </form>
          )}

          {/* Vista de datos */}
          {!editando && !cambiandoPassword && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { icon: '📧', label: 'Correo', value: emailEstudiante, full: false },
                { icon: '📞', label: 'Teléfono', value: estudiante?.telefono || 'No registrado', full: false },
                { icon: '🏫', label: 'Institución', value: estudiante?.instituciones?.nombre, full: true },
                { icon: '📍', label: 'Municipio', value: estudiante?.municipios?.nombre || '—', full: false },
                { icon: '🌾', label: 'Proyecto', value: estudiante?.tipo_proyecto === 'cafe' ? '☕ Escuela y Café' : '🌽 Seg. Alimentaria', full: false },
                { icon: '📚', label: 'Grado', value: `${estudiante?.grado}°`, full: false },
              ].map(({ icon, label, value, full }) => (
                <div key={label} className={`${full ? 'sm:col-span-2' : ''} bg-[#faf7f3] rounded-xl p-3 border border-[#e8dcca]`}>
                  <p className="text-[10px] font-bold text-[#a68a64] uppercase tracking-widest mb-0.5">{icon} {label}</p>
                  <p className="text-sm font-medium text-[#4a3222] break-words">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL AVATAR ── */}
      {seleccionandoAvatar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-[#4a3222]">Elige tu avatar</h3>
                <p className="text-xs text-[#a68a64]">{avataresDesbloqueados.length} de {avatares.length} desbloqueados</p>
              </div>
              <button onClick={() => setSeleccionandoAvatar(false)} className="w-8 h-8 rounded-full bg-[#f5efe6] text-[#6b4c3a] hover:bg-[#e8dcca] transition flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            {avataresBloqueados > 0 && (
              <div className="mb-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-800">🔓 Completa niveles para desbloquear {avataresBloqueados} avatar{avataresBloqueados > 1 ? 'es' : ''} más</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {avatares.map(avatar => {
                const desbloqueado = avataresDesbloqueados.some(a => a.id === avatar.id)
                const isSelected = avatarSeleccionado?.id === avatar.id
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleCambiarAvatar(avatar.id)}
                    disabled={!desbloqueado}
                    className={`relative p-2 rounded-xl transition-all text-center ${
                      isSelected ? 'ring-2 ring-[#6b4c3a] bg-[#f5efe6]'
                      : desbloqueado ? 'hover:bg-[#faf7f3] hover:ring-1 hover:ring-[#e8dcca]'
                      : 'opacity-40 cursor-not-allowed'
                    }`}
                    title={desbloqueado ? avatar.nombre : '🔒 Bloqueado'}
                  >
                    <div className={`w-12 h-12 mx-auto flex items-center justify-center relative ${!desbloqueado ? 'grayscale' : ''}`}>
                      <Avatar avatar={avatar} size="lg" />
                      {!desbloqueado && (
                        <div className="absolute inset-0 flex items-end justify-end">
                          <span className="text-sm bg-white rounded-full leading-none p-0.5">🔒</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#4a3222] mt-1 font-medium truncate">{avatar.nombre}</p>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#6b4c3a] rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </div>
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
