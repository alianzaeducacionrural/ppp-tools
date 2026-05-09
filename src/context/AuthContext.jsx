import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
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
    if (userIdRef.current === userData.id && rolRef.current) {
      setLoading(false)
      return
    }

    try {
      // Detectar admin por email (sin necesitar registro en BD)
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)

      console.log('[Auth] adminEmails:', adminEmails, '| email usuario:', userData.email?.toLowerCase())

      if (adminEmails.includes(userData.email?.toLowerCase())) {
        setRol('admin')
        rolRef.current = 'admin'
        userIdRef.current = userData.id
        setLoading(false)
        return
      }

      const { data: padrinoData } = await supabase
        .from('padrinos')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle()

      if (padrinoData) {
        setRol('padrino')
        rolRef.current = 'padrino'
        userIdRef.current = userData.id
        setLoading(false)
        return
      }

      const { data: estudianteData } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle()

      if (estudianteData) {
        setRol('estudiante')
        rolRef.current = 'estudiante'
        userIdRef.current = userData.id
        setLoading(false)
        return
      }

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

  const handleUserUpdate = async (session) => {
    const newUser = session?.user ?? null
    const newUserId = newUser?.id

    if (isInitializedRef.current && userIdRef.current === newUserId) {
      if (loading) setLoading(false)
      return
    }

    if (newUser) {
      // Set loading=true BEFORE setting user to avoid a window where
      // user is set but rol is null with loading=false (causes infinite redirect loop)
      setLoading(true)
      setUser(newUser)
      await determinarRol(newUser)
    } else {
      setUser(null)
      setRol(null)
      rolRef.current = null
      userIdRef.current = null
      setLoading(false)
    }

    isInitializedRef.current = true
  }

  useEffect(() => {
    if (subscriptionRef.current) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserUpdate(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const eventsToIgnore = ['TOKEN_REFRESHED', 'USER_UPDATED', 'MFA_CHALLENGE_VERIFIED']

      if (eventsToIgnore.includes(event) && userIdRef.current === session?.user?.id) {
        return
      }

      if (event === 'SIGNED_IN') {
        if (isInitializedRef.current && userIdRef.current === session?.user?.id) {
          return
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setRol(null)
        rolRef.current = null
        userIdRef.current = null
        isInitializedRef.current = false
        setLoading(false)
        return
      }

      handleUserUpdate(session)
    })

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [])

  return (
    <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}