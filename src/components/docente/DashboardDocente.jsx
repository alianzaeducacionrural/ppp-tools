import { useState, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { SidebarDocente } from './SidebarDocente'
import { MisProyectosDocente } from './MisProyectosDocente'
import { EstudiantesDocente } from './EstudiantesDocente'
import { RankingDocente } from './RankingDocente'
import { PodioDocentes } from './PodioDocentes'
import { PerfilDocente } from './PerfilDocente'
import { AyudaDocente } from './AyudaDocente'

export default function DashboardDocente() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }, [logout, navigate])

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <SidebarDocente
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        user={user}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} pb-16 md:pb-0`}>
        <Routes>
          <Route path="/" element={<MisProyectosDocente />} />
          <Route path="/estudiantes" element={<EstudiantesDocente />} />
          <Route path="/ranking" element={<RankingDocente />} />
          <Route path="/podio" element={<PodioDocentes />} />
          <Route path="/perfil" element={<PerfilDocente />} />
          <Route path="/ayuda" element={<AyudaDocente />} />
          <Route path="*" element={<Navigate to="/docente" replace />} />
        </Routes>
      </div>
    </div>
  )
}
