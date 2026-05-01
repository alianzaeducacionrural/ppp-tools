import { useState } from 'react'
import { getRangosByTipo } from '../../data/rangos'

export function AyudaEstudiante({ tipoProyecto = 'cafe' }) {
  const [seccionActiva, setSeccionActiva] = useState('inicio')
  
  // Obtener rangos según el tipo de proyecto del estudiante
  const rangosProyecto = getRangosByTipo(tipoProyecto)

  const secciones = {
    inicio: {
      titulo: 'Guía rápida',
      icono: '📘',
      contenido: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] mb-2">¿Qué es PPP Tools?</h3>
            <p className="text-[#6b4c3a] text-sm">
              Es tu plataforma de aprendizaje gamificado donde completarás misiones (niveles) y retos para 
              aprender sobre proyectos pedagógicos productivos en Escuela y Café o Seguridad Alimentaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">🗺️</div>
              <h3 className="font-semibold text-[#4a3222]">Mapa de Misiones</h3>
              <p className="text-sm text-[#a68a64] mt-1">
                Cada nivel es una misión. Completa todos los retos para desbloquear el siguiente nivel.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">📤</div>
              <h3 className="font-semibold text-[#4a3222]">Subir Evidencias</h3>
              <p className="text-sm text-[#a68a64] mt-1">
                Sube fotos, videos o escribe tu respuesta. Un padrino revisará y calificará tu trabajo.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-semibold text-[#4a3222]">Insignias</h3>
              <p className="text-sm text-[#a68a64] mt-1">
                Al completar un nivel, obtienes una insignia. ¡Colecciona todas!
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-semibold text-[#4a3222]">Puntuación</h3>
              <p className="text-sm text-[#a68a64] mt-1">
                Los padrinos califican tus evidencias de 0 a 100. Acumula puntos para subir de rango.
              </p>
            </div>
          </div>
        </div>
      )
    },
    retos: {
      titulo: 'Tipos de Retos',
      icono: '🎯',
      contenido: (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>📝</span> Retos de texto
            </h3>
            <p className="text-sm text-[#6b4c3a]">Debes escribir una respuesta en el campo de texto.</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>🖼️</span> Retos de imagen
            </h3>
            <p className="text-sm text-[#6b4c3a]">Debes subir una o varias fotos como evidencia.</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>🎥</span> Retos de video
            </h3>
            <p className="text-sm text-[#6b4c3a]">Debes grabar y subir un video.</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>❓</span> Retos de preguntas
            </h3>
            <p className="text-sm text-[#6b4c3a]">Debes responder varias preguntas, cada una con su espacio.</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>🎬</span> Retos multimedia
            </h3>
            <p className="text-sm text-[#6b4c3a]">Puedes combinar texto, imágenes y videos.</p>
          </div>
        </div>
      )
    },
    rangos: {
      titulo: 'Rangos y Puntuación',
      icono: '🏅',
      contenido: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] mb-3">Escala de puntuación</h3>
            <p className="text-sm text-[#6b4c3a]">Los padrinos califican tus evidencias de <strong>0 a 100</strong> puntos.</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              {tipoProyecto === 'cafe' ? <span>☕</span> : <span>🌽</span>}
              Rangos - {tipoProyecto === 'cafe' ? 'Escuela y Café' : 'Seguridad Alimentaria'}
            </h3>
            <div className="space-y-2">
              {rangosProyecto.map((rango, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-[#f5efe6] rounded-lg">
                  <span className="text-2xl w-12 text-center">{rango.emoji}</span>
                  <span className="flex-1 font-medium">{rango.nombre}</span>
                  <span className="text-sm text-[#a68a64]">
                    {index === 0 ? '0 - 199 pts' : 
                     index === 1 ? '200 - 499 pts' :
                     index === 2 ? '500 - 999 pts' :
                     index === 3 ? '1000 - 1999 pts' : '2000+ pts'}
                  </span>
                  <span className="text-xs text-[#a68a64]">{rango.descripcion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    faq: {
      titulo: 'Preguntas Frecuentes',
      icono: '❓',
      contenido: (
        <div className="space-y-3">
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Cómo sé si mi evidencia fue aprobada?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Recibirás una notificación en la esquina superior derecha y el estado del reto cambiará a 
              "Aprobado" o "Rechazado" con el comentario del padrino.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Puedo editar una evidencia después de enviarla?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Sí, si tu evidencia fue rechazada, puedes editarla y volver a enviarla. Si está pendiente o aprobada, no se puede editar.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Cómo obtengo insignias?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Al completar TODOS los retos de un nivel, la insignia se otorga automáticamente. ¡Mira en la sección "Mis Insignias"!
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Puedo cambiar mi avatar?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Sí, ve a "Mi Perfil" y haz clic en el lápiz sobre tu avatar. Puedes elegir entre varios avatares.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Los avatares se desbloquean?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              ¡Sí! A medida que completas niveles, se desbloquean nuevos avatares. Al completar los 4 niveles obtienes avatares especiales.
            </p>
          </details>
        </div>
      )
    },
    consejos: {
      titulo: 'Consejos para mejorar',
      icono: '💡',
      contenido: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>🎯</span> Para obtener mejores puntuaciones
            </h3>
            <ul className="list-disc pl-5 text-sm text-[#6b4c3a] space-y-2">
              <li>Sé detallado en tus respuestas escritas</li>
              <li>Sube imágenes o videos de buena calidad</li>
              <li>Sigue todas las instrucciones del reto</li>
              <li>Revisa ortografía y redacción</li>
              <li>Si te rechazan, lee el comentario del padrino y mejora</li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>⏰</span> Para mantener tu racha
            </h3>
            <ul className="list-disc pl-5 text-sm text-[#6b4c3a] space-y-2">
              <li>Envía al menos una evidencia cada día</li>
              <li>La racha se calcula con días consecutivos de envío</li>
              <li>Enviar varias evidencias el mismo día cuenta como 1 día</li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] flex items-center gap-2 mb-3">
              <span>🐞</span> ¿Problemas técnicos?
            </h3>
            <ul className="list-disc pl-5 text-sm text-[#6b4c3a] space-y-2">
              <li>Intenta recargar la página con el botón 🔄</li>
              <li>Si no cargan los retos, cierra y abre de nuevo la página</li>
              <li>Contacta a tu padrino o docente si el problema persiste</li>
            </ul>
          </div>
        </div>
      )
    }
  }

  const seccionesLista = [
    { id: 'inicio', label: 'Inicio', icono: '🏠' },
    { id: 'retos', label: 'Tipos de Retos', icono: '🎯' },
    { id: 'rangos', label: 'Rangos', icono: '🏅' },
    { id: 'faq', label: 'Preguntas Frecuentes', icono: '❓' },
    { id: 'consejos', label: 'Consejos', icono: '💡' }
  ]

  const seccionActual = secciones[seccionActiva] || secciones.inicio

  return (
    <div className="space-y-6">
      {/* Tabs de navegación */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
        <div className="flex overflow-x-auto">
          {seccionesLista.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSeccionActiva(sec.id)}
              className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap transition-all ${
                seccionActiva === sec.id
                  ? 'bg-[#6b4c3a] text-white border-b-2 border-[#d4c4a8]'
                  : 'text-[#6b4c3a] hover:bg-[#f5efe6]'
              }`}
            >
              <span>{sec.icono}</span>
              <span className="text-sm font-medium">{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la sección activa */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#e8dcca]">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#e8dcca]">
          <span className="text-2xl">{seccionActual.icono}</span>
          <h2 className="text-xl font-semibold text-[#4a3222]">{seccionActual.titulo}</h2>
        </div>
        {seccionActual.contenido}
      </div>

      {/* Pie de página */}
      <div className="bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-xl shadow-md p-5 text-white text-center">
        <p className="text-sm opacity-90">
          ¿Necesitas ayuda adicional? Contacta a tu padrino o docente.
        </p>
      </div>
    </div>
  )
}