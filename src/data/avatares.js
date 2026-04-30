// src/data/avatares.js - Solo avatares, sin temas

export const AVATAR_TIPOS = {
  EMOJI: 'emoji',
  IMAGEN: 'imagen'
}

export const AVATAR_DESBLOQUEO = {
  INICIAL: 'inicial',
  NIVEL_1: 'nivel_1',
  NIVEL_2: 'nivel_2', 
  NIVEL_3: 'nivel_3',
  NIVEL_4: 'nivel_4',
  COMPLETADO: 'completado'
}

export const avatares = [
  // AVATARES INICIALES (desbloqueados desde el principio)
  { 
    id: 1, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '👨‍🌾', 
    nombre: 'Cafetero',
    descripcion: 'Un caficultor tradicional',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  { 
    id: 2, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '👩‍🌾', 
    nombre: 'Chapolera',
    descripcion: 'Mujer caficultora',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  { 
    id: 3, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '🧑‍🎓', 
    nombre: 'Estudiante',
    descripcion: 'Aprendiz cafetero',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  
  // AVATARES DESBLOQUEABLES POR NIVEL
  { 
    id: 4, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '🌱', 
    nombre: 'Germinador',
    descripcion: 'Has completado el Nivel 1',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_1,
    requisitoNivel: 1
  },
  { 
    id: 5, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '🌿', 
    nombre: 'Aventurero',
    descripcion: 'Has completado el Nivel 2',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_2,
    requisitoNivel: 2
  },
  { 
    id: 6, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '☕', 
    nombre: 'Maestro Cafetero',
    descripcion: 'Has completado el Nivel 3',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_3,
    requisitoNivel: 3
  },
  { 
    id: 7, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '🏆', 
    nombre: 'Leyenda',
    descripcion: 'Has completado el Nivel 4',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_4,
    requisitoNivel: 4
  },
  { 
    id: 8, 
    tipo: AVATAR_TIPOS.EMOJI, 
    valor: '👑', 
    nombre: 'Campeón',
    descripcion: 'Has completado todos los niveles',
    desbloqueo: AVATAR_DESBLOQUEO.COMPLETADO
  },
]

// Función para obtener avatares desbloqueados según niveles completados
export const getAvataresDesbloqueados = (nivelesCompletadosIds) => {
  const nivelesSet = new Set(nivelesCompletadosIds)
  const nivelMaximo = Math.max(...nivelesCompletadosIds, 0)
  
  return avatares.filter(avatar => {
    if (avatar.desbloqueo === AVATAR_DESBLOQUEO.INICIAL) return true
    if (avatar.desbloqueo === AVATAR_DESBLOQUEO.COMPLETADO) {
      return nivelMaximo === 4
    }
    if (avatar.requisitoNivel) {
      return nivelesSet.has(avatar.requisitoNivel)
    }
    return false
  })
}

export const getAvatarById = (id) => {
  return avatares.find(avatar => avatar.id === id) || avatares[0]
}