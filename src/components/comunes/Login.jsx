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
    <div className="min-h-screen bg-gradient-to-br from-[#f5efe6] via-[#e8dcca] to-[#d4c4a8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos flotantes - responsive: se ocultan en móvil muy pequeño */}
      <div className="absolute top-20 left-10 text-8xl opacity-5 animate-bounce pointer-events-none hidden sm:block">🌱</div>
      <div className="absolute bottom-20 right-10 text-8xl opacity-5 animate-pulse pointer-events-none hidden md:block">☕</div>
      <div className="absolute top-1/2 left-1/4 text-6xl opacity-5 animate-spin-slow pointer-events-none hidden lg:block">🌿</div>
      <div className="absolute bottom-1/3 right-1/3 text-7xl opacity-5 animate-float pointer-events-none hidden xl:block">🍃</div>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full transform transition-all duration-500 hover:scale-105 mx-4">
        {/* Header - responsive padding */}
        <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] p-4 sm:p-6 text-center">
          <div className="text-4xl sm:text-5xl mb-2 animate-bounce">☕</div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">PPP Tools</h1>
          <p className="text-[#d4c4a8] text-xs sm:text-sm mt-1">Proyectos Pedagógicos Productivos</p>
          <p className="text-[#d4c4a8] text-xs mt-2 hidden sm:block">Comité de Cafeteros de Caldas</p>
        </div>
        
        <div className="p-4 sm:p-6 md:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#4a3222]">Bienvenido</h2>
            <p className="text-[#a68a64] text-xs sm:text-sm mt-1">Inicia sesión para continuar tu aventura</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a68a64] group-focus-within:text-[#6b4c3a] transition-colors">
                📧
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] focus:border-transparent transition-all duration-200 bg-[#faf8f5]"
                placeholder="Correo electrónico"
                required
              />
            </div>
            
            <div className="relative group">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a68a64] group-focus-within:text-[#6b4c3a] transition-colors">
                🔒
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 sm:py-3 text-sm sm:text-base border border-[#e8dcca] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4c3a] focus:border-transparent transition-all duration-200 bg-[#faf8f5]"
                placeholder="Contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a68a64] hover:text-[#6b4c3a] transition-colors"
              >
                {mostrarPassword ? (
                  <span className="text-lg sm:text-xl">🙈</span>
                ) : (
                  <span className="text-lg sm:text-xl">👁️</span>
                )}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Ingresando...
                </span>
              ) : (
                '🚀 Iniciar sesión'
              )}
            </button>
          </form>
          
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-[#a68a64] text-xs sm:text-sm">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="text-[#6b4c3a] hover:text-[#4a3222] font-semibold hover:underline transition"
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#e8dcca] text-center">
            <p className="text-xs text-[#a68a64]">
              🌱 Aprende sobre café y seguridad alimentaria 🌽
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}