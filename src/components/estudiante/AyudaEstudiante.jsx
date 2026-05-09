import { useState } from 'react'
import { getRangosByTipo } from '../../data/rangos'

export function AyudaEstudiante({ tipoProyecto = 'cafe' }) {
  const [seccionActiva, setSeccionActiva] = useState('inicio')
  const rangosProyecto = getRangosByTipo(tipoProyecto)

  const secciones = {
    inicio: {
      titulo: 'Guía rápida',
      icono: '📘',
      contenido: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-[#4a3222] mb-1.5 text-sm flex items-center gap-2">
              <span>🎯</span> ¿Qué es PPP Tools?
            </h3>
            <p className="text-xs text-[#6b4c3a] leading-relaxed">
              Tu plataforma de aprendizaje gamificado donde completarás misiones y retos para aprender sobre
              {tipoProyecto === 'cafe' ? ' Escuela y Café' : ' Seguridad Alimentaria'}. Sube evidencias y recibe calificaciones de tu padrino.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🗺️', title: 'Mapa de Misiones', desc: 'Cada nivel es una misión. Completa todos los retos para desbloquear el siguiente.' },
              { icon: '📤', title: 'Subir Evidencias',  desc: 'Fotos, videos o texto. Un padrino revisará y calificará tu trabajo.' },
              { icon: '🏆', title: 'Insignias',         desc: 'Al completar un nivel ganas una insignia. ¡Colecciónalas todas!' },
              { icon: '⭐', title: 'Puntuación',        desc: 'Los padrinos califican de 0 a 100. Acumula puntos para subir de rango.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-3 border border-[#e8dcca] hover:border-[#d4c4a8] transition-colors">
                <div className="text-2xl mb-1.5">{icon}</div>
                <h3 className="font-semibold text-[#4a3222] text-xs mb-1">{title}</h3>
                <p className="text-[10px] text-[#a68a64] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    retos: {
      titulo: 'Tipos de Retos',
      icono: '🎯',
      contenido: (
        <div className="space-y-2.5">
          {[
            { icon: '📝', title: 'Retos de texto',       desc: 'Escribe tu respuesta en el campo de texto.' },
            { icon: '🖼️', title: 'Retos de imagen',      desc: 'Sube una o varias fotos como evidencia.' },
            { icon: '🎥', title: 'Retos de video',       desc: 'Graba y sube un video.' },
            { icon: '❓', title: 'Retos de preguntas',   desc: 'Responde varias preguntas, cada una con su espacio.' },
            { icon: '🎬', title: 'Retos multimedia',     desc: 'Combina texto, imágenes y videos.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-3.5 border border-[#e8dcca] flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f5efe6] flex items-center justify-center flex-shrink-0 text-base">{icon}</div>
              <div>
                <h3 className="font-semibold text-[#4a3222] text-sm">{title}</h3>
                <p className="text-xs text-[#a68a64] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    rangos: {
      titulo: 'Rangos y Puntuación',
      icono: '🏅',
      contenido: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <p className="text-sm font-semibold text-[#4a3222] mb-1">Escala de puntuación</p>
            <p className="text-xs text-[#6b4c3a]">Los padrinos califican tus evidencias de <strong>0 a 100</strong> puntos cada una.</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e8dcca] overflow-hidden">
            <div className="bg-[#f5efe6] px-4 py-2.5 border-b border-[#e8dcca]">
              <h3 className="font-bold text-xs text-[#4a3222] uppercase tracking-wide flex items-center gap-2">
                {tipoProyecto === 'cafe' ? '☕' : '🌽'} Rangos · {tipoProyecto === 'cafe' ? 'Escuela y Café' : 'Seg. Alimentaria'}
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {rangosProyecto.map((rango, index) => {
                const rangos = ['0–199 pts', '200–499 pts', '500–999 pts', '1000–1999 pts', '2000+ pts']
                return (
                  <div key={index} className="flex items-center gap-3 p-2 bg-[#faf7f3] rounded-lg">
                    <span className="text-xl">{rango.emoji}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#4a3222]">{rango.nombre}</p>
                      <div className="w-full bg-[#e8dcca] rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#8b6b54] to-[#6b4c3a] h-full rounded-full" style={{ width: `${(index + 1) * 20}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-[#a68a64] whitespace-nowrap">{rangos[index]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    },
    faq: {
      titulo: 'Preguntas Frecuentes',
      icono: '❓',
      contenido: (
        <div className="space-y-2">
          {[
            {
              q: '¿Cómo sé si mi evidencia fue aprobada?',
              a: 'Recibirás una notificación y el estado del reto cambiará a "Aprobado" o "Rechazado" con el comentario de tu padrino.'
            },
            {
              q: '¿Puedo editar una evidencia después de enviarla?',
              a: 'Sí, si fue rechazada puedes editarla y volver a enviarla. Si está pendiente o aprobada, no se puede editar.'
            },
            {
              q: '¿Cómo obtengo insignias?',
              a: 'Al completar TODOS los retos de un nivel, la insignia se otorga automáticamente. ¡Revisa la sección "Mis Insignias"!'
            },
            {
              q: '¿Puedo cambiar mi avatar?',
              a: 'Sí, ve a "Mi Perfil" y haz clic en el lápiz sobre tu avatar. Desbloqueas más avatares completando niveles.'
            },
            {
              q: '¿Cómo subo fotos desde el celular?',
              a: 'En el formulario de evidencia, toca el área de archivos y selecciona "Cámara" o "Galería" desde tu celular.'
            },
          ].map(({ q, a }) => (
            <details key={q} className="bg-white rounded-xl border border-[#e8dcca] group overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 font-medium text-xs text-[#6b4c3a] hover:text-[#4a3222] hover:bg-[#faf7f3] transition flex items-center justify-between select-none">
                <span>{q}</span>
                <span className="text-[#a68a64] group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-2">▼</span>
              </summary>
              <div className="px-4 pb-3 text-xs text-[#a68a64] leading-relaxed border-t border-[#f5efe6] pt-2.5">
                {a}
              </div>
            </details>
          ))}
        </div>
      )
    },
    consejos: {
      titulo: 'Consejos para mejorar',
      icono: '💡',
      contenido: (
        <div className="space-y-3">
          {[
            {
              icon: '🎯', title: 'Para mejores calificaciones', bg: 'from-blue-50 to-sky-50', border: 'border-blue-100',
              tips: ['Sé detallado en tus respuestas escritas', 'Sube imágenes o videos de buena calidad', 'Sigue todas las instrucciones del reto', 'Revisa ortografía y redacción antes de enviar', 'Si te rechazan, lee el comentario del padrino y mejora']
            },
            {
              icon: '🌱', title: 'Para avanzar más rápido', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100',
              tips: ['Completa los retos en orden dentro de cada nivel', 'Lee bien las instrucciones antes de enviar', 'Vuelve a intentarlo si te rechazan — puedes mejorar', 'Usa el botón 🔄 si los datos no cargan correctamente']
            },
            {
              icon: '🐞', title: 'Problemas técnicos', bg: 'from-rose-50 to-red-50', border: 'border-red-100',
              tips: ['Intenta recargar la página con el botón 🔄', 'Si no cargan los retos, cierra y vuelve a abrir', 'Verifica tu conexión a internet', 'Contacta a tu padrino o docente si persiste el problema']
            },
          ].map(({ icon, title, bg, border, tips }) => (
            <div key={title} className={`bg-gradient-to-r ${bg} rounded-xl p-4 border ${border}`}>
              <h3 className="font-bold text-[#4a3222] text-sm mb-2 flex items-center gap-2">
                <span>{icon}</span> {title}
              </h3>
              <ul className="space-y-1">
                {tips.map(tip => (
                  <li key={tip} className="text-xs text-[#6b4c3a] flex items-start gap-2">
                    <span className="text-[#a68a64] mt-0.5 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }
  }

  const seccionesLista = [
    { id: 'inicio',    label: 'Inicio',    icono: '🏠' },
    { id: 'retos',     label: 'Retos',     icono: '🎯' },
    { id: 'rangos',    label: 'Rangos',    icono: '🏅' },
    { id: 'faq',       label: 'Preguntas', icono: '❓' },
    { id: 'consejos',  label: 'Consejos',  icono: '💡' },
  ]

  const seccionActual = secciones[seccionActiva] || secciones.inicio

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Tabs en pill style, scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {seccionesLista.map(sec => (
          <button
            key={sec.id}
            onClick={() => setSeccionActiva(sec.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              seccionActiva === sec.id
                ? 'bg-[#6b4c3a] text-white shadow-md'
                : 'bg-white text-[#6b4c3a] border border-[#e8dcca] hover:border-[#d4c4a8] hover:bg-[#faf7f3]'
            }`}
          >
            <span>{sec.icono}</span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl shadow-md border border-[#e8dcca] overflow-hidden">
        <div className="bg-gradient-to-r from-[#f5efe6] to-white px-5 py-3.5 border-b border-[#e8dcca] flex items-center gap-2.5">
          <span className="text-xl">{seccionActual.icono}</span>
          <h2 className="text-sm font-bold text-[#4a3222]">{seccionActual.titulo}</h2>
        </div>
        <div className="p-5">
          {seccionActual.contenido}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#4a3222] to-[#6b4c3a] rounded-xl p-4 text-white text-center">
        <p className="text-xs opacity-90">¿Necesitas ayuda adicional? Contacta a tu padrino o docente.</p>
      </div>
    </div>
  )
}
