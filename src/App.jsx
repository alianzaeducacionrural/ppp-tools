import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './components/comunes/Login'
import { Registro } from './components/estudiante/Registro'
import { DashboardEstudiante } from './components/estudiante/DashboardEstudiante'
import { DashboardPadrino } from './components/padrino/DashboardPadrino'
import { DashboardAdmin } from './components/admin/DashboardAdmin'

function AppRoutes() {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/" />} />
      <Route 
        path="/" 
        element={
          user ? (
            rol === 'estudiante' ? (
              <DashboardEstudiante />
            ) : rol === 'padrino' ? (
              <DashboardPadrino />
            ) : (
              <DashboardAdmin />
            )
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App