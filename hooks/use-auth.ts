import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: string
  full_name: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  })
  
  const router = useRouter()
  const supabase = createClientComponentClient()
  const isCheckingRef = useRef(false)
  const initialCheckDone = useRef(false)
  
  // Check authentication status with caching
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) {
      console.log('🔍 useAuth: Check already in progress, skipping')
      return
    }
    
    isCheckingRef.current = true
    
    try {
      console.log('🔍 useAuth: Checking authentication status')
      
      // Check if we have cached user data first
      const cachedUser = localStorage.getItem('auth-user')
      const cachedTimestamp = localStorage.getItem('auth-timestamp')
      
      if (cachedUser && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp)
        // Use cache for 5 minutes
        if (age < 5 * 60 * 1000) {
          const user = JSON.parse(cachedUser)
          console.log('✅ useAuth: Using cached user data:', user.email)
          setAuthState({
            user,
            loading: false,
            error: null,
            isAuthenticated: true
          })
          return
        }
      }
      
      // Quick check with Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.log('❌ useAuth: No valid session found')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('auth-timestamp')
        setAuthState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false
        })
        return
      }

      // Quick validation with cookies - avoid API call if possible
      const userRole = document.cookie
        .split('; ')
        .find(row => row.startsWith('user-role='))
        ?.split('=')[1]

      if (userRole && session.user) {
        // Create user object from session + cookie
        const user = {
          id: session.user.id,
          email: session.user.email || '',
          role: userRole,
          full_name: session.user.user_metadata?.full_name || ''
        }

        // Cache the user data
        localStorage.setItem('auth-user', JSON.stringify(user))
        localStorage.setItem('auth-timestamp', Date.now().toString())

        console.log('✅ useAuth: Quick authentication successful:', user.email)
        setAuthState({
          user,
          loading: false,
          error: null,
          isAuthenticated: true
        })
        return
      }

      // Fallback to API validation only if needed
      const response = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        console.log('❌ useAuth: Session validation failed')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('auth-timestamp')
        setAuthState({
          user: null,
          loading: false,
          error: 'Session validation failed',
          isAuthenticated: false
        })
        return
      }

      const data = await response.json()
      
      if (data.authenticated && data.user) {
        // Cache the validated user data
        localStorage.setItem('auth-user', JSON.stringify(data.user))
        localStorage.setItem('auth-timestamp', Date.now().toString())

        console.log('✅ useAuth: User authenticated via API:', data.user.email)
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true
        })
      } else {
        console.log('❌ useAuth: User not authenticated')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('auth-timestamp')
        setAuthState({
          user: null,
          loading: false,
          error: data.error || 'Authentication failed',
          isAuthenticated: false
        })
      }
    } catch (error) {
      console.error('💥 useAuth: Error checking authentication:', error)
      setAuthState({
        user: null,
        loading: false,
        error: 'Failed to check authentication',
        isAuthenticated: false
      })
    } finally {
      isCheckingRef.current = false
      initialCheckDone.current = true
    }
  }, []) // Empty dependency array to prevent infinite loops

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔑 useAuth: Attempting login for:', email)
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      console.log('✅ useAuth: Login successful')
      
      // Cache the user data immediately
      localStorage.setItem('auth-user', JSON.stringify(data.user))
      localStorage.setItem('auth-timestamp', Date.now().toString())
      
      // Update auth state
      setAuthState({
        user: data.user,
        loading: false,
        error: null,
        isAuthenticated: true
      })

      // Redirect to admin or specified location
      router.push(data.redirectTo || '/admin')
      
      return { success: true, data }
    } catch (error: any) {
      console.error('💥 useAuth: Login error:', error)
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed'
      }))
      return { success: false, error: error.message }
    }
  }, [router])

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 useAuth: Attempting logout')
      setAuthState(prev => ({ ...prev, loading: true }))

      // Clear cache immediately
      localStorage.removeItem('auth-user')
      localStorage.removeItem('auth-timestamp')

      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        console.log('✅ useAuth: Logout successful')
      }

      // Clear state regardless of API response
      setAuthState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false
      })

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('💥 useAuth: Logout error:', error)
      // Still clear state on error
      setAuthState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false
      })
      router.push('/login')
    }
  }, [router])

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 useAuth: Refreshing session')
      
      const response = await fetch('/api/session', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        console.log('✅ useAuth: Session refreshed successfully')
        await checkAuth() // Re-check auth after refresh
        return true
      } else {
        console.log('❌ useAuth: Session refresh failed')
        return false
      }
    } catch (error) {
      console.error('💥 useAuth: Session refresh error:', error)
      return false
    }
  }, [checkAuth])

  // Initialize auth check - only run once on mount
  useEffect(() => {
    if (!initialCheckDone.current) {
      checkAuth()
    }
  }, []) // No dependencies to prevent loops

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 useAuth: Auth state changed:', event)
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('auth-user')
          localStorage.removeItem('auth-timestamp')
          setAuthState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false
          })
        } else if (event === 'SIGNED_IN' && session && initialCheckDone.current) {
          await checkAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // No dependencies to prevent loops

  return {
    ...authState,
    login,
    logout,
    refreshSession,
    checkAuth
  }
}
