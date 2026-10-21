import { useState } from 'react'

// Poner en false para volver a habilitar el envío de evidencias.
export const PLAZO_EVIDENCIAS_CERRADO = true

export const MENSAJE_PLAZO_CERRADO = 'El plazo para subir evidencias ya finalizó.'

export function PlazoCerradoModal() {
  const [abierto, setAbierto] = useState(true)
  if (!abierto) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full mx-4 shadow-xl text-center">
        <div className="bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48] p-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center text-3xl border border-white/20">
            ⏰
          </div>
        </div>
        <div className="p-6 space-y-3">
          <h3 className="text-lg font-bold text-[#4a3222]">Plazo de evidencias finalizado</h3>
          <p className="text-sm text-[#6b4c3a]">
            El tiempo hábil para subir evidencias a la plataforma ya finalizó, por lo que el envío está deshabilitado.
          </p>
          <p className="text-xs text-[#a68a64]">
            Puedes seguir ingresando para consultar tu perfil, el ranking y tus resultados. ¡Gracias por tu participación!
          </p>
          <button
            onClick={() => setAbierto(false)}
            className="w-full bg-gradient-to-r from-[#6b4c3a] to-[#4a3222] text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
