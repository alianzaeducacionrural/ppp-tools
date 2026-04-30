import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Login } from './components/comunes/Login'
import { Registro } from './components/estudiante/Registro'
// IMPORTANTE: Importación por defecto (sin llaves)
import DashboardEstudianteGamificado from './components/estudiante/DashboardEstudianteGamificado'
import DashboardPadrino from './components/padrino/DashboardPadrino'
import DashboardAdmin from './components/admin/DashboardAdmin'

function AppRoutes() {
  const { user, rol, loading } = useAuth()

  console.log('📱 [AppRoutes] loading:', loading, 'user:', user?.email, 'rol:', rol)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">☕</div>
          <div className="text-xl text-[#6b4c3a]">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/" />} />
      
      {/* Rutas del estudiante */}
      <Route path="/" element={user && rol === 'estudiante' ? <DashboardEstudianteGamificado /> : <Navigate to="/login" />} />
      <Route path="/perfil" element={user && rol === 'estudiante' ? <DashboardEstudianteGamificado /> : <Navigate to="/login" />} />
      <Route path="/ranking" element={user && rol === 'estudiante' ? <DashboardEstudianteGamificado /> : <Navigate to="/login" />} />
      <Route path="/insignias" element={user && rol === 'estudiante' ? <DashboardEstudianteGamificado /> : <Navigate to="/login" />} />
      <Route path="/ayuda" element={user && rol === 'estudiante' ? <DashboardEstudianteGamificado /> : <Navigate to="/login" />} />
      
      {/* Rutas de padrino y admin */}
      <Route path="/padrino" element={user && rol === 'padrino' ? <DashboardPadrino /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user && rol === 'admin' ? <DashboardAdmin /> : <Navigate to="/login" />} />
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