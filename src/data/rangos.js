// src/data/rangos.js

// Rangos para Escuela y Café
export const rangosCafe = [
  { puntos: 0, nombre: 'Semilla', emoji: '🌱', color: 'bg-green-100 text-green-800', border: 'border-green-200', descripcion: 'El primer paso' },
  { puntos: 200, nombre: 'Brotes', emoji: '🌿', color: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200', descripcion: 'Estás creciendo' },
  { puntos: 500, nombre: 'Cafetero Aprendiz', emoji: '☕', color: 'bg-amber-100 text-amber-800', border: 'border-amber-200', descripcion: 'Conociendo el café' },
  { puntos: 1000, nombre: 'Maestro Cafetero', emoji: '🏆', color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200', descripcion: 'Experto en café' },
  { puntos: 2000, nombre: 'Leyenda del Café', emoji: '👑', color: 'bg-amber-200 text-amber-900', border: 'border-amber-300', descripcion: '¡Eres una leyenda!' }
]

// Rangos para Seguridad Alimentaria
export const rangosAlimentacion = [
  { puntos: 0, nombre: 'Semilla', emoji: '🌱', color: 'bg-green-100 text-green-800', border: 'border-green-200', descripcion: 'El primer paso' },
  { puntos: 200, nombre: 'Brote', emoji: '🌿', color: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200', descripcion: 'Creciendo en la huerta' },
  { puntos: 500, nombre: 'Huerto Productivo', emoji: '🥬', color: 'bg-lime-100 text-lime-800', border: 'border-lime-200', descripcion: 'Cultivando alimentos' },
  { puntos: 1000, nombre: 'Maestro Alimentador', emoji: '🍅', color: 'bg-orange-100 text-orange-800', border: 'border-orange-200', descripcion: 'Experto en nutrición' },
  { puntos: 2000, nombre: 'Guardián de la Tierra', emoji: '🌎', color: 'bg-teal-100 text-teal-800', border: 'border-teal-200', descripcion: '¡Defensor de la seguridad alimentaria!' }
]

// Función para obtener rango según puntos y tipo de proyecto
export const obtenerRango = (puntos, tipoProyecto) => {
  const rangos = tipoProyecto === 'cafe' ? rangosCafe : rangosAlimentacion
  // Ordenar de mayor a menor puntos y encontrar el primero que sea <= a los puntos del usuario
  const rangoEncontrado = [...rangos].reverse().find(rango => puntos >= rango.puntos)
  return rangoEncontrado || rangos[0]
}

// Función para obtener rangos según tipo de proyecto (para mostrar en ayuda)
export const getRangosByTipo = (tipoProyecto) => {
  return tipoProyecto === 'cafe' ? rangosCafe : rangosAlimentacion
}