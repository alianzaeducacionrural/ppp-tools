// src/components/comunes/NotificationToast.jsx
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function useEvidenciaNotification(supabase, estudianteId, onActualizar) {
  useEffect(() => {
    if (!estudianteId) return

    // Suscribirse a cambios en evidencias del estudiante
    const subscription = supabase
      .channel('evidencias-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evidencias',
          filter: `estudiante_id=eq.${estudianteId}`
        },
        (payload) => {
          const { estado, comentario_padrino, puntuacion } = payload.new
          
          if (estado === 'aprobado') {
            toast.success(
              <div>
                <strong>✅ ¡Evidencia aprobada!</strong>
                <p className="text-sm">Puntuación: {puntuacion}/100</p>
                {comentario_padrino && <p className="text-sm">💬 {comentario_padrino}</p>}
              </div>,
              { duration: 5000 }
            )
            onActualizar()
          } else if (estado === 'rechazado') {
            toast.error(
              <div>
                <strong>❌ Evidencia rechazada</strong>
                {comentario_padrino && <p className="text-sm">💬 {comentario_padrino}</p>}
              </div>,
              { duration: 5000 }
            )
            onActualizar()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [estudianteId, supabase, onActualizar])
}