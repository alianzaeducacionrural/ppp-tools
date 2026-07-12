// src/data/avatares.js - Avatares con imágenes (temática cafetera y fauna de Caldas)

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

const img = (n) => `/img/avatares/${n}.png`

export const avatares = [
  // ── DISPONIBLES DESDE EL PRINCIPIO ──
  {
    id: 1,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(1),
    nombre: 'La Recolectora de Oro Rojo',
    descripcion: 'Recolectora de café, el oro rojo de Caldas',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  {
    id: 3,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(3),
    nombre: 'El Sembrador del Futuro',
    descripcion: 'Joven que siembra el futuro del campo',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  {
    id: 7,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(7),
    nombre: 'Aprendiz Sembrador',
    descripcion: 'Aprendiz del campo y sus tradiciones',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  {
    id: 9,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(9),
    nombre: 'La Guardiana de la Seguridad Alimentaria',
    descripcion: 'Protectora de la huerta y la buena alimentación',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  {
    id: 17,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(17),
    nombre: 'El Chapolero',
    descripcion: 'Recolector de cosecha en tiempo de chapola',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },
  {
    id: 18,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(18),
    nombre: 'La Sembradora del Bosque de Niebla',
    descripcion: 'Cultiva entre el bosque de niebla andino',
    desbloqueo: AVATAR_DESBLOQUEO.INICIAL
  },

  // ── DESBLOQUEABLES AL COMPLETAR EL NIVEL 1 ──
  {
    id: 2,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(2),
    nombre: 'Cacique Candela',
    descripcion: 'Guacamaya de plumaje encendido',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_1,
    requisitoNivel: 1
  },
  {
    id: 11,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(11),
    nombre: 'El Barranquero de Corona Azul',
    descripcion: 'Ave emblemática de los cafetales',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_1,
    requisitoNivel: 1
  },
  {
    id: 13,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(13),
    nombre: 'El Gallito de Roca Andino',
    descripcion: 'Ave insignia de la cordillera',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_1,
    requisitoNivel: 1
  },
  {
    id: 15,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(15),
    nombre: 'El Perico de Cresta Dorada',
    descripcion: 'Perico de los bosques cafeteros',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_1,
    requisitoNivel: 1
  },

  // ── DESBLOQUEABLES AL COMPLETAR EL NIVEL 2 ──
  {
    id: 4,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(4),
    nombre: 'El Jefe de la Montaña',
    descripcion: 'Guacamaya que reina en las alturas',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_2,
    requisitoNivel: 2
  },
  {
    id: 10,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(10),
    nombre: 'El Colibrí del Nevado',
    descripcion: 'Colibrí de los páramos del Nevado',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_2,
    requisitoNivel: 2
  },
  {
    id: 20,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(20),
    nombre: 'El Alquimista del Café',
    descripcion: 'Maestro de la fermentación del grano',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_2,
    requisitoNivel: 2
  },
  {
    id: 21,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(21),
    nombre: 'El Trovador Caldense',
    descripcion: 'Cantor de las tradiciones de Caldas',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_2,
    requisitoNivel: 2
  },

  // ── DESBLOQUEABLES AL COMPLETAR EL NIVEL 3 ──
  {
    id: 12,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(12),
    nombre: 'La Tejedora',
    descripcion: 'Guardiana de la artesanía tradicional',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_3,
    requisitoNivel: 3
  },
  {
    id: 16,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(16),
    nombre: 'El Arriero Tradicional',
    descripcion: 'Arriero de la colonización antioqueña',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_3,
    requisitoNivel: 3
  },
  {
    id: 19,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(19),
    nombre: 'El Extensionista Rural',
    descripcion: 'Guía que lleva el saber al campo',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_3,
    requisitoNivel: 3
  },
  {
    id: 22,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(22),
    nombre: 'El Fabricante de Guarniles',
    descripcion: 'Artesano del cuero y la tradición',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_3,
    requisitoNivel: 3
  },

  // ── DESBLOQUEABLES AL COMPLETAR EL NIVEL 4 ──
  {
    id: 5,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(5),
    nombre: 'El Oso Sembrador',
    descripcion: 'Oso de anteojos, guardián del bosque',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_4,
    requisitoNivel: 4
  },
  {
    id: 6,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(6),
    nombre: 'El Guardián de la Niebla',
    descripcion: 'Felino que protege la selva andina',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_4,
    requisitoNivel: 4
  },
  {
    id: 8,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(8),
    nombre: 'La Maestra Catadora',
    descripcion: 'Experta en la cata del mejor café',
    desbloqueo: AVATAR_DESBLOQUEO.NIVEL_4,
    requisitoNivel: 4
  },

  // ── DESBLOQUEABLE AL COMPLETAR TODOS LOS NIVELES ──
  {
    id: 14,
    tipo: AVATAR_TIPOS.IMAGEN,
    valor: img(14),
    nombre: 'El Puma de Caldas',
    descripcion: 'Máximo guardián de la naturaleza caldense',
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
