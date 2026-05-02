import { useState } from 'react'

export function AyudaPadrino() {
  const [seccionActiva, setSeccionActiva] = useState('inicio')

  const secciones = {
    inicio: {
      titulo: 'Guía para Padrinos',
      icono: '📘',
      contenido: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] mb-2">🎯 ¿Qué es PPP Tools?</h3>
            <p className="text-[#6b4c3a] text-sm">
              PPP Tools es la plataforma de gestión de proyectos pedagógicos productivos. 
              Como padrino, tu labor es revisar, calificar y comentar las evidencias de los estudiantes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-[#4a3222]">Dashboard</h3>
              <p className="text-sm text-[#a68a64] mt-1">Revisa las evidencias pendientes y califícalas.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold text-[#4a3222]">Estadísticas</h3>
              <p className="text-sm text-[#a68a64] mt-1">Visualiza el progreso general de los estudiantes.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">👨‍🎓</div>
              <h3 className="font-semibold text-[#4a3222]">Estudiantes</h3>
              <p className="text-sm text-[#a68a64] mt-1">Consulta el listado completo de estudiantes.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">👤</div>
              <h3 className="font-semibold text-[#4a3222]">Mi Perfil</h3>
              <p className="text-sm text-[#a68a64] mt-1">Actualiza tu información y contraseña.</p>
            </div>
          </div>
        </div>
      )
    },
    calificacion: {
      titulo: 'Cómo Calificar',
      icono: '⭐',
      contenido: (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] mb-2">📝 Escala de Puntuación</h3>
            <p className="text-sm text-[#6b4c3a]">Califica las evidencias de <strong>0 a 100</strong> puntos.</p>
            <ul className="list-disc pl-5 mt-2 text-sm text-[#6b4c3a] space-y-1">
              <li><strong>90-100:</strong> Excelente, trabajo sobresaliente</li>
              <li><strong>70-89:</strong> Bueno, cumple con los requisitos</li>
              <li><strong>50-69:</strong> Aceptable, pero puede mejorar</li>
              <li><strong>0-49:</strong> Insuficiente, necesita revisión</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] mb-2">💬 Comentarios</h3>
            <p className="text-sm text-[#6b4c3a]">
              Al rechazar una evidencia, el comentario es obligatorio para que el estudiante sepa qué mejorar.
            </p>
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
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition">
              ¿Cómo reviso una evidencia?
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Ve al Dashboard, selecciona la evidencia pendiente, revisa el contenido y asigna puntuación y comentario.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition">
              ¿Puedo editar una calificación?
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              No, una vez aprobada o rechazada, la evidencia no se puede modificar. Si hay error, contacta al administrador.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-[#6b4c3a] hover:text-[#4a3222] transition">
              ¿Cómo cambio mi contraseña?
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Ve a "Mi Perfil" y haz clic en "Cambiar contraseña".
            </p>
          </details>
        </div>
      )
    }
  }

  const seccionesLista = [
    { id: 'inicio', label: 'Inicio', icono: '🏠' },
    { id: 'calificacion', label: 'Calificación', icono: '⭐' },
    { id: 'faq', label: 'FAQ', icono: '❓' }
  ]

  const seccionActual = secciones[seccionActiva] || secciones.inicio

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
            ❓ Centro de Ayuda
          </h1>
          <p className="text-[#a68a64] mt-1">Guía rápida para padrinos</p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
          <div className="flex overflow-x-auto border-b">
            {seccionesLista.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSeccionActiva(sec.id)}
                className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap transition ${
                  seccionActiva === sec.id ? 'bg-[#6b4c3a] text-white' : 'text-[#6b4c3a] hover:bg-[#f5efe6]'
                }`}
              >
                <span>{sec.icono}</span>
                <span>{sec.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#e8dcca]">
              <span className="text-2xl">{seccionActual.icono}</span>
              <h2 className="text-xl font-semibold text-[#4a3222]">{seccionActual.titulo}</h2>
            </div>
            {seccionActual.contenido}
          </div>
        </div>
      </div>
    </div>
  )
}