import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const MENU_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icono: '📊', path: '/padrino',              descripcion: 'Evidencias pendientes' },
  { id: 'estadisticas', label: 'Estadísticas', icono: '📈', path: '/padrino/estadisticas', descripcion: 'Gráficos y reportes' },
  { id: 'ranking',      label: 'Ranking',      icono: '🏆', path: '/padrino/ranking',      descripcion: 'Clasificación de participantes' },
  { id: 'estudiantes',  label: 'Estudiantes',  icono: '👨‍🎓', path: '/padrino/estudiantes',  descripcion: 'Ver todos los estudiantes' },
  { id: 'perfil',       label: 'Mi Perfil',    icono: '👤', path: '/padrino/perfil',        descripcion: 'Gestiona tu cuenta' },
  { id: 'ayuda',        label: 'Ayuda',        icono: '❓', path: '/padrino/ayuda',         descripcion: 'Guía y soporte' },
]

export function SidebarPadrino({ isOpen, onToggle, onLogout, user }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const [nombrePadrino, setNombrePadrino] = useState('')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (user?.id) cargarNombrePadrino()
  }, [user?.id])

  async function cargarNombrePadrino() {
    const { data } = await supabase
      .from('padrinos')
      .select('nombre')
      .eq('user_id', user.id)
      .single()
    setNombrePadrino(data?.nombre || user.email?.split('@')[0] || 'Padrino')
  }

  // ── MÓVIL: barra de navegación inferior ────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#5a3e2e] to-[#3d2a1e] text-[#f5efe6] z-20 shadow-xl border-t border-[#8b6b54]">
          <div className="flex justify-around items-center py-1 px-1">
            {MENU_ITEMS.map(item => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#d4c4a8] text-[#4a3222] shadow-md scale-110'
                      : 'text-[#f5efe6]/70 hover:text-[#d4c4a8] hover:bg-[#8b6b54]/30'
                  }`}
                >
                  <span className="text-xl">{item.icono}</span>
                </button>
              )
            })}
            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-all text-[#f5efe6]/70 hover:text-red-400 hover:bg-[#8b6b54]/30"
            >
              <span className="text-xl">🚪</span>
            </button>
          </div>
        </div>
        {/* Espaciador para que el contenido no quede tapado por la barra */}
        <div className="h-14" />
      </>
    )
  }

  // ── DESKTOP: sidebar lateral ────────────────────────────────────────────────
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div className={`
        fixed top-0 left-0 z-20 h-screen
        bg-gradient-to-b from-[#5a3e2e] to-[#3d2a1e]
        text-[#f5efe6] transition-all duration-300 flex-col shadow-xl
        hidden md:flex
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

        {/* Perfil */}
        {isOpen ? (
          <div className="p-4 border-b border-[#8b6b54] bg-[#4a3222]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center text-2xl flex-shrink-0">
                👨‍🏫
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nombrePadrino}</p>
                <p className="text-xs text-[#d4c4a8] truncate">Padrino</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-b border-[#8b6b54] flex justify-center">
            <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center text-xl">
              👨‍🏫
            </div>
          </div>
        )}

        {/* Menú de navegación */}
        <div className="flex-1 py-4 overflow-y-auto">
          {MENU_ITEMS.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  w-full p-3 flex items-center gap-3 transition-all duration-200
                  hover:bg-[#8b6b54] group relative
                  ${isActive ? 'bg-[#d4c4a8] text-[#4a3222]' : ''}
                `}
                title={!isOpen ? item.label : ''}
              >
                <span className="text-xl flex-shrink-0">{item.icono}</span>
                {isOpen && (
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isActive ? 'text-[#4a3222]' : 'text-[#f5efe6]'}`}>
                      {item.label}
                    </p>
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
            className="w-full p-4 flex items-center gap-3 hover:bg-[#8b6b54] transition-colors group relative"
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
