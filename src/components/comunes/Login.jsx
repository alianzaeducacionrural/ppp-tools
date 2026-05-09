import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await login(email, password)
    if (error) {
      toast.error('Correo o contraseña incorrectos')
    } else {
      toast.success('¡Bienvenido!')
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decoración sutil de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#e8dcca] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#d4c4a8] rounded-full translate-x-1/3 translate-y-1/3 opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 text-[120px] opacity-[0.04] select-none pointer-events-none leading-none">☕</div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-4 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-6 text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 text-[80px] opacity-[0.05] leading-none select-none">☕</div>
          <div className="relative">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center text-3xl mb-3 border border-white/20">
              ☕
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">PPP Tools</h1>
            <p className="text-[#d4c4a8] text-xs mt-1">Proyectos Pedagógicos Productivos</p>
            <p className="text-white/40 text-[10px] mt-1 uppercase tracking-widest">Comité de Cafeteros de Caldas</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-[#4a3222]">Bienvenido de nuevo</h2>
            <p className="text-[#a68a64] text-xs mt-1">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a68a64] text-sm">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] placeholder:text-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] focus:border-transparent transition"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a68a64] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a68a64] text-sm">🔒</span>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-[#e8dcca] rounded-xl bg-[#faf7f3] text-[#4a3222] placeholder:text-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a68a64] hover:text-[#6b4c3a] transition text-sm"
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[#a68a64] text-xs">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="text-[#6b4c3a] hover:text-[#4a3222] font-semibold hover:underline transition"
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-[#f5efe6] text-center">
            <p className="text-[10px] text-[#c4a882] uppercase tracking-widest">
              Escuela y Café · Seguridad Alimentaria
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
