import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { Login } from './components/comunes/Login'
import { Registro } from './components/estudiante/Registro'
import DashboardEstudianteGamificado from './components/estudiante/DashboardEstudianteGamificado'
import DashboardPadrino from './components/padrino/DashboardPadrino'
import DashboardAdmin from './components/admin/DashboardAdmin'

// 🔥 FIX: Wrapper para evitar remount del dashboard al cambiar de ruta interna
function EstudianteLayout({ children }) {
  const { user, rol } = useAuth()
  
  // Redirigir si no es estudiante autenticado
  if (!user || rol !== 'estudiante') {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { user, rol, loading } = useAuth()

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
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/" replace />} />
      
      {/* 🔥 FIX: Usar EstudianteLayout para mantener el componente montado */}
      <Route path="/" element={<EstudianteLayout><DashboardEstudianteGamificado /></EstudianteLayout>} />
      <Route path="/perfil" element={<EstudianteLayout><DashboardEstudianteGamificado /></EstudianteLayout>} />
      <Route path="/ranking" element={<EstudianteLayout><DashboardEstudianteGamificado /></EstudianteLayout>} />
      <Route path="/insignias" element={<EstudianteLayout><DashboardEstudianteGamificado /></EstudianteLayout>} />
      <Route path="/ayuda" element={<EstudianteLayout><DashboardEstudianteGamificado /></EstudianteLayout>} />
      
      <Route path="/padrino" element={user && rol === 'padrino' ? <DashboardPadrino /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={user && rol === 'admin' ? <DashboardAdmin /> : <Navigate to="/login" replace />} />
      
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