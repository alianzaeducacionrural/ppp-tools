import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        determinarRol(session.user)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        determinarRol(session.user)
      } else {
        setRol(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const determinarRol = async (userData) => {
    console.log('🔍 Determinando rol para:', userData.email)
    
    try {
      // Verificar si es administrador
      const { data: adminData } = await supabase
        .from('padrinos')
        .select('nombre')
        .eq('user_id', userData.id)
        .eq('nombre', 'Administrador')
        .maybeSingle()

      if (adminData) {
        console.log('✅ Rol: ADMIN')
        setRol('admin')
        setLoading(false)
        return
      }

      // Verificar si es padrino
      const { data: padrinoData } = await supabase
        .from('padrinos')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle()

      if (padrinoData) {
        console.log('✅ Rol: PADRINO')
        setRol('padrino')
        setLoading(false)
        return
      }

      // Verificar si es estudiante
      const { data: estudianteData } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle()

      if (estudianteData) {
        console.log('✅ Rol: ESTUDIANTE')
        setRol('estudiante')
        setLoading(false)
        return
      }

      console.log('⚠️ Rol: SIN ROL')
      setRol(null)
      setLoading(false)
      
    } catch (error) {
      console.error('Error determinando rol:', error)
      setRol(null)
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}