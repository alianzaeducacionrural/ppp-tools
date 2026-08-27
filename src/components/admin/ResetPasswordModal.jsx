import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { resetearPassword, PASSWORD_POR_DEFECTO } from '../../lib/resetearPassword'

// Modal de confirmación para restablecer la contraseña de un usuario a la de
// por defecto. Hace el reset por dentro; el manager solo lo abre/cierra.
export function ResetPasswordModal({ usuario, onClose }) {
  const [loading, setLoading] = useState(false)
  const nombre = usuario?.nombre_completo || usuario?.nombre || 'este usuario'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  async function handleConfirm() {
    if (!usuario?.user_id) {
      toast.error('Este usuario no tiene una cuenta de acceso.')
      return
    }
    setLoading(true)
    const { ok, error } = await resetearPassword(usuario.user_id)
    if (ok) {
      toast.success(`Contraseña de ${nombre} restablecida a "${PASSWORD_POR_DEFECTO}"`)
      onClose()
    } else {
      toast.error(error || 'No se pudo restablecer la contraseña')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e8dcca]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-2xl border border-white/20 flex-shrink-0">
              🔑
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Restablecer contraseña</h3>
              <p className="text-xs text-[#d4c4a8] mt-0.5">{nombre}</p>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#4a3222] leading-relaxed">
            La contraseña se cambiará por la temporal{' '}
            <span className="font-mono font-bold bg-[#f5efe6] border border-[#e8dcca] rounded px-1.5 py-0.5 text-[#6b4c3a]">
              {PASSWORD_POR_DEFECTO}
            </span>.
          </p>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <span className="text-base flex-shrink-0">🔐</span>
            <p className="text-xs text-[#6b4c3a] leading-relaxed">
              La próxima vez que <strong>{nombre}</strong> inicie sesión, deberá crear una contraseña nueva antes de poder continuar.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="animate-spin">⏳</span> Restableciendo...</>
                : <>🔑 Restablecer contraseña</>}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#e8dcca] text-[#6b4c3a] hover:bg-[#faf7f3] transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
