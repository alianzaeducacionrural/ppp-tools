// Modal de ayuda para subir videos por enlace.
// Lo usan el docente (proyecto dirigido) y el estudiante (evidencias de video).

const PLATAFORMAS = [
  {
    icono: '▶️',
    nombre: 'YouTube',
    gratis: 'Gratis · sin límite de tamaño',
    pasos: 'Sube el video y en "Visibilidad" elige **No listado**: solo quien tenga el enlace podrá verlo.',
    url: 'https://youtube.com'
  },
  {
    icono: '📁',
    nombre: 'Google Drive',
    gratis: 'Gratis · 15 GB con tu cuenta de Gmail',
    pasos: 'Sube el video, clic derecho › Compartir › "Cualquier persona con el enlace" como **Lector**, y copia el enlace.',
    url: 'https://drive.google.com'
  },
  {
    icono: '☁️',
    nombre: 'OneDrive',
    gratis: 'Gratis · 5 GB con tu correo institucional',
    pasos: 'Sube el video, botón Compartir › copia el enlace y verifica que permita ver a cualquiera con el vínculo.',
    url: 'https://onedrive.live.com'
  }
]

function Vinieta({ children, color = 'text-[#a68a64]', simbolo = '•' }) {
  return (
    <li className="flex items-start gap-2 text-[#6b4c3a]">
      <span className={`${color} mt-0.5 flex-shrink-0`}>{simbolo}</span>
      <span>{children}</span>
    </li>
  )
}

export function RecomendacionesVideoModal({ onClose, variante = 'estudiante', instruccion }) {
  const esDocente = variante === 'docente'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-5 text-white sticky top-0 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎥</span>
              <div>
                <h3 className="font-bold text-base leading-tight">Cómo enviar tu video</h3>
                <p className="text-xs text-[#d4c4a8] mt-0.5">
                  {esDocente ? 'Maestro PPP · Ten en cuenta lo siguiente' : 'No subas el archivo: comparte el enlace'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-sm font-bold transition flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 text-sm text-[#4a3222]">
          {/* Por qué enlace */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <span className="text-lg">💡</span>
            <p className="text-[#6b4c3a]">
              Los videos pesan mucho y con internet lento la subida se cae a la mitad.
              Por eso <strong>subes el video a una plataforma y aquí solo pegas el enlace</strong>. Es más rápido y nunca se pierde.
            </p>
          </div>

          {instruccion && (
            <div className="bg-[#f5efe6] border border-[#e8dcca] rounded-xl p-3">
              <p className="font-bold text-[#4a3222] mb-1 flex items-center gap-2"><span>🎯</span> Lo que pide este reto:</p>
              <p className="text-[#6b4c3a]">{instruccion}</p>
            </div>
          )}

          {/* Dónde subirlo */}
          <div>
            <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>📤</span> ¿Dónde subo el video?</p>
            <div className="space-y-2">
              {PLATAFORMAS.map(p => (
                <div key={p.nombre} className="border border-[#e8dcca] rounded-xl p-3 bg-[#faf7f3]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#4a3222] flex items-center gap-2">
                      <span>{p.icono}</span> {p.nombre}
                    </span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-[#6b4c3a] hover:text-[#4a3222] bg-white border border-[#e8dcca] px-2 py-0.5 rounded-full transition flex-shrink-0"
                    >
                      Abrir ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mb-1">{p.gratis}</p>
                  <p className="text-xs text-[#6b4c3a] leading-relaxed">
                    {p.pasos.split('**').map((parte, i) =>
                      i % 2 === 1 ? <strong key={i}>{parte}</strong> : <span key={i}>{parte}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Antes de pegar el enlace */}
          <div>
            <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>🔗</span> Antes de pegar el enlace:</p>
            <ul className="space-y-1.5 pl-1">
              <Vinieta simbolo="✓" color="text-emerald-500">
                Verifica que <strong>no sea privado</strong>. En YouTube usa "No listado"; en Drive, "Cualquier persona con el enlace".
              </Vinieta>
              <Vinieta simbolo="✓" color="text-emerald-500">
                Ábrelo en una ventana de incógnito. Si se ve ahí, tu {esDocente ? 'padrino' : 'padrino'} también podrá verlo.
              </Vinieta>
              <Vinieta simbolo="✓" color="text-emerald-500">
                Copia el enlace completo, que empiece por <code className="bg-[#f5efe6] px-1 rounded">https://</code>
              </Vinieta>
            </ul>
          </div>

          {/* Contenido esperado (solo docente) */}
          {esDocente && (
            <>
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <span className="text-lg">⏱️</span>
                <p className="text-[#6b4c3a]">
                  <strong>Duración máxima: 6 minutos.</strong> Graba una clase tuya de Escuela y Café o Escuela y
                  Seguridad Alimentaria, según el proyecto por el que te postulaste.
                </p>
              </div>
              <div>
                <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>🗣️</span> En la parte inicial preséntate y cuéntanos:</p>
                <ul className="space-y-1.5 pl-1">
                  {[
                    'Presentación personal e institucional.',
                    'Las razones por las cuales decidiste desarrollar este proyecto dirigido con tus estudiantes.',
                    'Brevemente tu trayectoria formativa y experiencia profesional.',
                    'Qué has aprendido con el desarrollo de este proyecto dirigido.',
                  ].map((txt) => <Vinieta key={txt}>{txt}</Vinieta>)}
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#4a3222] mb-2 flex items-center gap-2"><span>📚</span> Durante la clase se debe evidenciar:</p>
                <ul className="space-y-1.5 pl-1">
                  {[
                    'El desarrollo de los módulos.',
                    'El uso del libro de registros.',
                    'La implementación del modelo pedagógico Escuela Nueva.',
                  ].map((txt) => <Vinieta key={txt}>{txt}</Vinieta>)}
                </ul>
              </div>
            </>
          )}

          {/* Consejos de grabación */}
          <div className="bg-[#f5efe6] border border-[#e8dcca] rounded-xl p-3">
            <p className="font-bold text-[#4a3222] mb-1.5 flex items-center gap-2"><span>🎬</span> Para que se vea y se escuche bien:</p>
            <ul className="space-y-1 text-xs text-[#6b4c3a]">
              <li>• Graba con el celular <strong>acostado (horizontal)</strong>, no de pie.</li>
              <li>• Busca buena luz: que la luz te dé de frente, no por detrás.</li>
              <li>• Elige un lugar con poco ruido y habla claro y pausado.</li>
              <li>• Acércate a lo que quieres mostrar en vez de usar el zoom.</li>
              <li>• Apoya el celular en algo firme para que la imagen no tiemble.</li>
              {!esDocente && <li>• Revisa el video antes de subirlo: que se vea completo y se escuche.</li>}
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-[#f0e8dc] sticky bottom-0 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
