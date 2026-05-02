import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function SidebarPadrino({ isOpen, onToggle, onLogout, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [nombrePadrino, setNombrePadrino] = useState('')

  useEffect(() => {
    if (user?.id) {
      cargarNombrePadrino()
    }
  }, [user])

  async function cargarNombrePadrino() {
    const { data } = await supabase
      .from('padrinos')
      .select('nombre')
      .eq('user_id', user.id)
      .single()
    
    if (data?.nombre) {
      setNombrePadrino(data.nombre)
    } else {
      // Fallback: usar parte del email
      setNombrePadrino(user.email?.split('@')[0] || 'Padrino')
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icono: '📊', path: '/padrino', descripcion: 'Evidencias pendientes' },
    { id: 'estadisticas', label: 'Estadísticas', icono: '📈', path: '/padrino/estadisticas', descripcion: 'Gráficos y reportes' },
    { id: 'estudiantes', label: 'Estudiantes', icono: '👨‍🎓', path: '/padrino/estudiantes', descripcion: 'Ver todos los estudiantes' },
    { id: 'perfil', label: 'Mi Perfil', icono: '👤', path: '/padrino/perfil', descripcion: 'Gestiona tu cuenta' },
    { id: 'ayuda', label: 'Ayuda', icono: '❓', path: '/padrino/ayuda', descripcion: 'Guía y soporte' }
  ]

  return (
    <>
      {isOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={onToggle} />
      )}
      
      <div className={`
        fixed top-0 left-0 z-20 h-screen
        bg-gradient-to-b from-[#5a3e2e] to-[#3d2a1e]
        text-[#f5efe6] transition-all duration-300 flex flex-col shadow-xl
        ${isOpen ? 'w-72' : 'w-20'}
      `}>
        {/* Cabecera */}
        <div className="p-4 border-b border-[#8b6b54] flex items-center justify-between">
          <button
            onClick={onToggle}
            className="hover:bg-[#8b6b54] p-2 rounded-lg transition-colors"
            title={isOpen ? 'Contraer menú' : 'Expandir menú'}
          >
            <span className="text-2xl">👨‍🏫</span>
          </button>
          {isOpen && (
            <div className="text-right">
              <span className="font-bold text-lg tracking-widest block">Padrino</span>
              <span className="text-xs text-[#d4c4a8]">Comité de Cafeteros</span>
            </div>
          )}
        </div>
        
        {/* Perfil del usuario - con nombre */}
        {isOpen && (
          <div className="p-4 border-b border-[#8b6b54] bg-[#4a3222]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center text-2xl">
                👨‍🏫
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nombrePadrino}</p>
                <p className="text-xs text-[#d4c4a8] truncate">Padrino</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Versión colapsada (solo icono) */}
        {!isOpen && (
          <div className="p-3 border-b border-[#8b6b54] flex justify-center">
            <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center text-xl">
              👨‍🏫
            </div>
          </div>
        )}
        
        {/* Menú */}
        <div className="flex-1 py-4 overflow-y-auto">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  w-full p-3 flex items-center gap-3 transition-all duration-200
                  hover:bg-[#8b6b54] group
                  ${isActive ? 'bg-[#8b6b54] border-l-4 border-[#d4c4a8]' : ''}
                `}
                title={!isOpen ? item.label : ''}
              >
                <span className="text-xl flex-shrink-0">{item.icono}</span>
                {isOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-[#d4c4a8] opacity-75">{item.descripcion}</p>
                  </div>
                )}
                {!isOpen && (
                  <div className="absolute left-16 bg-[#3d2a1e] text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Cerrar sesión */}
        <div className="border-t border-[#8b6b54]">
          <button
            onClick={onLogout}
            className="w-full p-4 flex items-center gap-3 hover:bg-[#8b6b54] transition-colors group"
            title={!isOpen ? 'Cerrar sesión' : ''}
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {isOpen && <span>Cerrar sesión</span>}
            {!isOpen && (
              <div className="absolute left-16 bg-[#3d2a1e] text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                Cerrar sesión
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}