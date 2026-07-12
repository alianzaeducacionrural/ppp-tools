import { useState } from 'react'

export function AyudaDocente() {
  const [seccionActiva, setSeccionActiva] = useState('inicio')

  const secciones = {
    inicio: {
      titulo: 'Guía para Docentes',
      icono: '📘',
      contenido: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#4a3222] mb-2">🎯 ¿Qué es Maestro PPP?</h3>
            <p className="text-[#6b4c3a] text-sm">
              Como docente, puedes inscribir tu Proyecto Dirigido de institución (Escuela y Café o Escuela y Seguridad Alimentaria)
              para que sea reconocido como buena práctica pedagógica. También puedes hacer seguimiento a los estudiantes de tu institución.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">🌱</div>
              <h3 className="font-semibold text-[#4a3222]">Mis Proyectos</h3>
              <p className="text-sm text-[#a68a64] mt-1">Inscribe y da seguimiento a tus Proyectos Dirigidos.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">👨‍🎓</div>
              <h3 className="font-semibold text-[#4a3222]">Estudiantes</h3>
              <p className="text-sm text-[#a68a64] mt-1">Consulta el avance de los estudiantes de tu institución.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-semibold text-[#4a3222]">Ranking y Podio</h3>
              <p className="text-sm text-[#a68a64] mt-1">Revisa la clasificación de estudiantes y del Podio de Docentes.</p>
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
    proyecto: {
      titulo: 'Sobre el Proyecto Dirigido',
      icono: '📋',
      contenido: (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] mb-2">📝 Información requerida</h3>
            <p className="text-sm text-[#6b4c3a]">
              Título, tipo de proyecto (agrícola/pecuario), objetivos, justificación, registro de costos y gastos,
              y registro de utilidades económicas y formativas.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] mb-2">🎥 Video de clase</h3>
            <p className="text-sm text-[#6b4c3a]">
              Sube un video de máximo 6 minutos donde te presentes, expliques tu motivación y trayectoria,
              y muestres la implementación del modelo pedagógico Escuela Nueva.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e8dcca]">
            <h3 className="font-semibold text-[#4a3222] mb-2">📸 Evidencias fotográficas</h3>
            <p className="text-sm text-[#6b4c3a]">Sube fotos que muestren el desarrollo del proyecto.</p>
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
            <summary className="cursor-pointer font-medium text-sm text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Cuántos proyectos dirigidos puedo inscribir?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition-transform text-lg">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Puedes inscribir varios proyectos, por ejemplo uno de café y otro de seguridad alimentaria.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-sm text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Puedo editar mi proyecto después de enviarlo?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition-transform text-lg">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Sí, mientras esté pendiente de revisión o si fue rechazado, puedes editarlo y volver a enviarlo.
            </p>
          </details>
          <details className="bg-white rounded-xl p-4 border border-[#e8dcca] group">
            <summary className="cursor-pointer font-medium text-sm text-[#6b4c3a] hover:text-[#4a3222] transition flex items-center justify-between">
              <span>¿Quién revisa y califica mi proyecto?</span>
              <span className="text-[#a68a64] group-open:rotate-180 transition-transform text-lg">▼</span>
            </summary>
            <p className="mt-3 text-sm text-[#a68a64] pl-4 border-l-2 border-[#e8dcca]">
              Los padrinos del programa revisan cada proyecto dirigido y asignan un puntaje.
            </p>
          </details>
        </div>
      )
    }
  }

  const seccionesLista = [
    { id: 'inicio', label: 'Inicio', icono: '🏠' },
    { id: 'proyecto', label: 'Proyecto Dirigido', icono: '📋' },
    { id: 'faq', label: 'FAQ', icono: '❓' }
  ]

  const seccionActual = secciones[seccionActiva] || secciones.inicio

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4a3222] flex items-center gap-2">
          ❓ Centro de Ayuda
        </h1>
        <p className="text-[#a68a64] mt-1">Guía rápida para docentes</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#e8dcca]">
        <div className="flex overflow-x-auto border-b border-[#e8dcca]">
          {seccionesLista.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSeccionActiva(sec.id)}
              className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap transition-all text-sm font-medium ${
                seccionActiva === sec.id
                  ? 'bg-[#6b4c3a] text-white shadow-inner'
                  : 'text-[#6b4c3a] hover:bg-[#f5efe6]'
              }`}
            >
              <span className="text-base">{sec.icono}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e8dcca]">
            <span className="text-2xl">{seccionActual.icono}</span>
            <h2 className="text-xl font-semibold text-[#4a3222]">{seccionActual.titulo}</h2>
          </div>
          {seccionActual.contenido}
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] rounded-xl shadow-md p-4 text-white text-center">
        <p className="text-sm opacity-90">
          ¿Necesitas ayuda adicional? Contacta al administrador del programa.
        </p>
      </div>
    </div>
  )
}
