import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        determinarRol(session.user)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
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

  async function determinarRol(user) {
    console.log('Determinando rol para:', user.email)
    console.log('User ID:', user.id)
    
    try {
      // 1. Verificar si es administrador (está en tabla padrinos con nombre Administrador)
      const { data: adminData, error: adminError } = await supabase
        .from('padrinos')
        .select('nombre, email')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Admin check:', adminData)

      if (adminData && adminData.nombre === 'Administrador') {
        console.log('✅ Rol detectado: ADMIN')
        setRol('admin')
        setLoading(false)
        return
      }

      // 2. Verificar si es padrino (está en tabla padrinos)
      const { data: padrinoData, error: padrinoError } = await supabase
        .from('padrinos')
        .select('nombre, email')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Padrino check:', padrinoData)

      if (padrinoData && !padrinoError) {
        console.log('✅ Rol detectado: PADRINO -', padrinoData.nombre)
        setRol('padrino')
        setLoading(false)
        return
      }

      // 3. Verificar si es estudiante
      const { data: estudianteData, error: estudianteError } = await supabase
        .from('estudiantes')
        .select('id, nombre_completo')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Estudiante check:', estudianteData)

      if (estudianteData && !estudianteError) {
        console.log('✅ Rol detectado: ESTUDIANTE -', estudianteData.nombre_completo)
        setRol('estudiante')
        setLoading(false)
        return
      }

      // 4. Si llegamos aquí, no tiene rol asignado
      console.log('❌ Rol detectado: SIN ROL - El usuario no está registrado como estudiante ni padrino')
      setRol(null)
      setLoading(false)
      
    } catch (error) {
      console.error('Error determinando rol:', error)
      setRol(null)
      setLoading(false)
    }
  }

  async function login(email, password) {
    console.log('Intentando login con:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Error de login:', error)
    } else {
      console.log('Login exitoso:', data.user?.email)
    }
    
    return { data, error }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}