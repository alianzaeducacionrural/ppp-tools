import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Login } from './components/comunes/Login'
import { Registro } from './components/estudiante/Registro'
import DashboardEstudianteGamificado from './components/estudiante/DashboardEstudianteGamificado'
import DashboardPadrino from './components/padrino/DashboardPadrino'
import DashboardAdmin from './components/admin/DashboardAdmin'

// Componente de carga
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f5efe6] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-spin mb-4">☕</div>
        <div className="text-[#6b4c3a]">Cargando...</div>
      </div>
    </div>
  )
}

// Wrapper para rutas de estudiante
function EstudianteRoute({ children }) {
  const { user, rol, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (rol !== 'estudiante') {
    return <Navigate to={rol === 'padrino' ? '/padrino' : '/admin'} replace />
  }
  
  return children
}

function AppRoutes() {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/" replace />} />
      
      {/* Rutas del estudiante */}
      <Route path="/" element={
        <EstudianteRoute>
          <DashboardEstudianteGamificado />
        </EstudianteRoute>
      } />
      <Route path="/perfil" element={
        <EstudianteRoute>
          <DashboardEstudianteGamificado />
        </EstudianteRoute>
      } />
      <Route path="/ranking" element={
        <EstudianteRoute>
          <DashboardEstudianteGamificado />
        </EstudianteRoute>
      } />
      <Route path="/insignias" element={
        <EstudianteRoute>
          <DashboardEstudianteGamificado />
        </EstudianteRoute>
      } />
      <Route path="/ayuda" element={
        <EstudianteRoute>
          <DashboardEstudianteGamificado />
        </EstudianteRoute>
      } />
      
      {/* Rutas de padrino y admin */}
      <Route path="/padrino/*" element={
        user && rol === 'padrino' ? 
        <DashboardPadrino /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={
        user && rol === 'admin' ? (
          <DashboardAdmin />
        ) : (
          <Navigate to={user ? '/' : '/login'} replace />
        )
      } />
      
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