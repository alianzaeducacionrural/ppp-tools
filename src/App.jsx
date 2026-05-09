import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Login } from './components/comunes/Login'
import { Registro } from './components/estudiante/Registro'
import DashboardEstudianteGamificado from './components/estudiante/DashboardEstudianteGamificado'
import DashboardPadrino from './components/padrino/DashboardPadrino'
import DashboardAdmin from './components/admin/DashboardAdmin'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#4a3222] to-[#7a5c48] flex items-center justify-center text-3xl mb-4 shadow-lg">
          ☕
        </div>
        <div className="w-6 h-6 border-2 border-[#d4c4a8] border-t-[#6b4c3a] rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}

function EstudianteRoute({ children }) {
  const { user, rol, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user || !rol) return <Navigate to="/login" replace />
  if (rol !== 'estudiante') return <Navigate to={rol === 'padrino' ? '/padrino' : '/admin'} replace />
  return children
}

function PadrinoRoute({ children }) {
  const { user, rol, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user || !rol) return <Navigate to="/login" replace />
  if (rol !== 'padrino') return <Navigate to={rol === 'admin' ? '/admin' : '/'} replace />
  return children
}

function AdminRoute({ children }) {
  const { user, rol, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user || !rol) return <Navigate to="/login" replace />
  if (rol !== 'admin') return <Navigate to={rol === 'padrino' ? '/padrino' : '/'} replace />
  return children
}

function SinRolScreen() {
  const { logout, user } = useAuth()
  async function handleLogout() {
    await logout()
  }
  return (
    <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-sm text-center">
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center text-3xl border border-white/20">
            ⚠️
          </div>
        </div>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#4a3222]">Sin rol asignado</h2>
          <p className="text-sm text-[#a68a64]">
            La cuenta <span className="font-semibold text-[#6b4c3a]">{user?.email}</span> no tiene un rol configurado en la plataforma.
          </p>
          <p className="text-xs text-[#c4a882]">Contacta al administrador para que configure tu acceso.</p>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  // Si hay usuario autenticado pero sin rol → pantalla de error (previene redirect loop)
  if (user && !rol) {
    return <SinRolScreen />
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/" replace />} />

      {/* Rutas del estudiante */}
      <Route path="/" element={<EstudianteRoute><DashboardEstudianteGamificado /></EstudianteRoute>} />
      <Route path="/perfil" element={<EstudianteRoute><DashboardEstudianteGamificado /></EstudianteRoute>} />
      <Route path="/ranking" element={<EstudianteRoute><DashboardEstudianteGamificado /></EstudianteRoute>} />
      <Route path="/insignias" element={<EstudianteRoute><DashboardEstudianteGamificado /></EstudianteRoute>} />
      <Route path="/ayuda" element={<EstudianteRoute><DashboardEstudianteGamificado /></EstudianteRoute>} />

      {/* Rutas de padrino y admin */}
      <Route path="/padrino/*" element={<PadrinoRoute><DashboardPadrino /></PadrinoRoute>} />
      <Route path="/admin" element={<AdminRoute><DashboardAdmin /></AdminRoute>} />

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App