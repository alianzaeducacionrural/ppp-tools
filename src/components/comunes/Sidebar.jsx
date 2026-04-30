import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar } from './Avatar'
import { getAvatarById } from '../../data/avatares'

export function Sidebar({ isOpen, onToggle, onLogout, user, estudiante }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Obtener el avatar del estudiante
  const avatarActual = estudiante ? getAvatarById(estudiante.avatar_id || 1) : null

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icono: '🏠', path: '/', descripcion: 'Ver tus misiones' },
    { id: 'perfil', label: 'Mi Perfil', icono: '👤', path: '/perfil', descripcion: 'Gestiona tu cuenta' },
    { id: 'ranking', label: 'Ranking', icono: '🏆', path: '/ranking', descripcion: 'Compara tu progreso' },
    { id: 'insignias', label: 'Mis Insignias', icono: '📦', path: '/insignias', descripcion: 'Tus logros' },
    { id: 'ayuda', label: 'Ayuda', icono: '❓', path: '/ayuda', descripcion: 'Guía y soporte' }
  ]

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar fijo */}
      <div className={`
        fixed top-0 left-0 z-20 h-screen
        bg-gradient-to-b from-[#5a3e2e] to-[#3d2a1e]
        text-[#f5efe6] transition-all duration-300 flex flex-col shadow-xl
        ${isOpen ? 'w-72' : 'w-20'}
      `}>
        {/* Cabecera con logo */}
        <div className="p-4 border-b border-[#8b6b54] flex items-center justify-between">
          <button
            onClick={onToggle}
            className="hover:bg-[#8b6b54] p-2 rounded-lg transition-colors"
            title={isOpen ? 'Contraer menú' : 'Expandir menú'}
          >
            <span className="text-2xl">☕</span>
          </button>
          {isOpen && (
            <div className="text-right">
              <span className="font-bold text-lg tracking-widest block">PPP Tools</span>
              <span className="text-xs text-[#d4c4a8]">Comité de Cafeteros</span>
            </div>
          )}
        </div>
        
        {/* Perfil del usuario con avatar */}
        {isOpen && estudiante && (
          <div className="p-4 border-b border-[#8b6b54] bg-[#4a3222]/50">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[#d4c4a8] flex items-center justify-center overflow-hidden shadow-md">
                {avatarActual ? (
                  <Avatar avatar={avatarActual} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-[#4a3222]">
                    {estudiante.nombre_completo?.charAt(0) || '👤'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{estudiante.nombre_completo?.split(' ')[0]}</p>
                <p className="text-xs text-[#d4c4a8] truncate">{estudiante.grado}° · {estudiante.tipo_proyecto === 'cafe' ? 'Café' : 'Alimentación'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold">{estudiante.puntuacion_total || 0}</p>
                <p className="text-xs text-[#d4c4a8]">puntos</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Versión colapsada del perfil (solo avatar) */}
        {!isOpen && estudiante && (
          <div className="p-3 border-b border-[#8b6b54] flex justify-center">
            <div className="w-10 h-10 rounded-full bg-[#d4c4a8] flex items-center justify-center overflow-hidden shadow-md">
              {avatarActual ? (
                <Avatar avatar={avatarActual} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-[#4a3222]">
                  {estudiante.nombre_completo?.charAt(0) || '👤'}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Menú de navegación */}
        <div className="flex-1 py-4 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full p-3 flex items-center gap-3 transition-all duration-200
                hover:bg-[#8b6b54] group
                ${location.pathname === item.path ? 'bg-[#8b6b54] border-l-4 border-[#d4c4a8]' : ''}
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
          ))}
        </div>
        
        {/* Botón cerrar sesión */}
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