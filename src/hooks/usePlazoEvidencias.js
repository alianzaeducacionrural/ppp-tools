import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PLAZO_EVIDENCIAS_CERRADO } from '../components/comunes/PlazoCerradoModal'

// Estado del plazo para el estudiante actual. Con el concurso cerrado, las
// instituciones habilitadas por el admin siguen enviando "evidencias adicionales"
// (no suman puntos). `cargando` evita mostrar el bloqueo antes de saber la institución.
export function usePlazoEvidencias() {
  const { user, rol } = useAuth()
  const aplica = PLAZO_EVIDENCIAS_CERRADO && rol === 'estudiante' && !!user
  const [habilitada, setHabilitada] = useState(null) // null = aún no se sabe

  useEffect(() => {
    if (!aplica) return
    let activo = true
    ;(async () => {
      const { data: est } = await supabase.from('estudiantes').select('institucion_id').eq('user_id', user.id).maybeSingle()
      let ok = false
      if (est?.institucion_id) {
        const { count } = await supabase
          .from('habilitaciones_institucion')
          .select('id', { count: 'exact', head: true })
          .eq('institucion_id', est.institucion_id)
        ok = (count || 0) > 0
      }
      if (activo) setHabilitada(ok)
    })()
    return () => { activo = false }
  }, [aplica, user])

  return {
    cargando: aplica && habilitada === null,
    cerrado: PLAZO_EVIDENCIAS_CERRADO && !habilitada,
    adicional: PLAZO_EVIDENCIAS_CERRADO && !!habilitada
  }
}
