import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Refs para evitar re-ejecuciones y duplicados
  const userIdRef = useRef(null)
  const rolRef = useRef(null)
  const subscriptionRef = useRef(null)
  const isInitializedRef = useRef(false)

  const determinarRol = async (userData) => {
    // Evitar llamadas duplicadas si el usuario no cambió
    if (userIdRef.current === userData.id && rolRef.current) {
      console.log('⏭️ Rol ya determinado para este usuario, saltando')
      setLoading(false)
      return
    }
    
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
        rolRef.current = 'admin'
        userIdRef.current = userData.id
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
        rolRef.current = 'padrino'
        userIdRef.current = userData.id
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
        rolRef.current = 'estudiante'
        userIdRef.current = userData.id
        setLoading(false)
        return
      }

      console.log('⚠️ Rol: SIN ROL')
      setRol(null)
      rolRef.current = null
      setLoading(false)
      
    } catch (error) {
      console.error('Error determinando rol:', error)
      setRol(null)
      rolRef.current = null
      setLoading(false)
    }
  }

  // Función centralizada para actualizar el estado de usuario
  const handleUserUpdate = async (session) => {
    const newUser = session?.user ?? null
    const newUserId = newUser?.id
    
    // Ignorar si es el mismo usuario y ya está inicializado
    if (isInitializedRef.current && userIdRef.current === newUserId) {
      console.log('🔄 Mismo usuario, ignorando actualización redundante')
      if (loading) setLoading(false)
      return
    }
    
    console.log('🔐 Actualizando usuario:', newUserId)
    setUser(newUser)
    
    if (newUser) {
      await determinarRol(newUser)
    } else {
      setRol(null)
      rolRef.current = null
      userIdRef.current = null
      setLoading(false)
    }
    
    isInitializedRef.current = true
  }

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (subscriptionRef.current) {
      console.log('⚠️ Suscripción ya existe, saltando inicialización')
      return
    }
    
    console.log('🚀 Inicializando AuthProvider')
    
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserUpdate(session)
    })

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event, session?.user?.id)
      
      // Filtrar eventos que no requieren acción
      const eventsToIgnore = [
        'TOKEN_REFRESHED',
        'USER_UPDATED',
        'MFA_CHALLENGE_VERIFIED'
      ]
      
      // Si es un evento a ignorar Y el usuario no cambió, saltar
      if (eventsToIgnore.includes(event) && userIdRef.current === session?.user?.id) {
        console.log(`⏭️ Evento ${event} ignorado - mismo usuario`)
        return
      }
      
      // Para SIGNED_IN: solo procesar si es la primera vez o el usuario cambió
      if (event === 'SIGNED_IN') {
        if (isInitializedRef.current && userIdRef.current === session?.user?.id) {
          console.log('⏭️ SIGNED_IN ignorado - sesión ya activa para este usuario')
          return
        }
      }
      
      // Para SIGNED_OUT: siempre procesar
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario cerrado sesión')
        setUser(null)
        setRol(null)
        rolRef.current = null
        userIdRef.current = null
        isInitializedRef.current = false
        setLoading(false)
        return
      }
      
      // Procesar actualización para otros eventos válidos
      handleUserUpdate(session)
    })
    
    subscriptionRef.current = subscription

    // Cleanup al desmontar
    return () => {
      console.log('🧹 Limpiando suscripción de AuthContext')
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, []) // Dependencia vacía: solo se ejecuta una vez

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