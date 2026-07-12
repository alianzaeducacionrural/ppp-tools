import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Registro } from '../estudiante/Registro'
import { RegistroDocente } from '../docente/RegistroDocente'

export function SeleccionRegistro() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState(null) // null | 'estudiante' | 'docente'

  if (tipo) {
    return (
      <div className="relative">
        <button
          onClick={() => setTipo(null)}
          className="fixed top-4 left-4 z-20 bg-white/90 backdrop-blur text-[#6b4c3a] hover:text-[#4a3222] text-sm font-semibold px-3 py-2 rounded-xl shadow-md border border-[#e8dcca] hover:bg-white transition flex items-center gap-1.5"
        >
          ← Cambiar tipo de cuenta
        </button>
        {tipo === 'estudiante' ? <Registro /> : <RegistroDocente />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decoración sutil de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#e8dcca] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#d4c4a8] rounded-full translate-x-1/3 translate-y-1/3 opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 text-[120px] opacity-[0.04] select-none pointer-events-none leading-none">☕</div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-6 text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 text-[80px] opacity-[0.05] leading-none select-none">📝</div>
          <div className="relative">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center text-3xl mb-3 border border-white/20">📝</div>
            <h1 className="text-xl font-bold text-white">Crear cuenta</h1>
            <p className="text-[#d4c4a8] text-xs mt-1">Selecciona el tipo de cuenta que quieres crear</p>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={() => setTipo('estudiante')}
            className="w-full text-left p-4 rounded-2xl border-2 border-[#e8dcca] hover:border-[#6b4c3a] hover:bg-[#faf7f3] transition group flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#f5efe6] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
              👨‍🎓
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#4a3222]">Soy estudiante</h3>
              <p className="text-xs text-[#a68a64] mt-0.5">Participa en los retos de Escuela y Café o Seguridad Alimentaria</p>
            </div>
            <span className="text-[#a68a64] group-hover:text-[#6b4c3a] text-lg flex-shrink-0">→</span>
          </button>

          <button
            onClick={() => setTipo('docente')}
            className="w-full text-left p-4 rounded-2xl border-2 border-[#e8dcca] hover:border-[#6b4c3a] hover:bg-[#faf7f3] transition group flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#f5efe6] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
              🌱
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#4a3222]">Soy docente</h3>
              <p className="text-xs text-[#a68a64] mt-0.5">Maestro PPP · Inscribe tu Proyecto Dirigido de institución</p>
            </div>
            <span className="text-[#a68a64] group-hover:text-[#6b4c3a] text-lg flex-shrink-0">→</span>
          </button>

          <div className="text-center pt-2">
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
  )
}
