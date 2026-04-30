// src/components/comunes/Avatar.jsx
import { AVATAR_TIPOS } from '../../data/avatares'

export function Avatar({ avatar, className = "w-full h-full object-cover", size = "md" }) {
  if (!avatar) return null
  
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl"
  }
  
  if (avatar.tipo === AVATAR_TIPOS.IMAGEN) {
    return <img src={avatar.valor} alt={avatar.nombre} className={className} />
  }
  
  return (
    <span className={`flex items-center justify-center ${sizeClasses[size]}`}>
      {avatar.valor}
    </span>
  )
}