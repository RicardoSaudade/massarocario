/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { LoginValues, RegisterValues, ResetPasswordValues } from '../../pages/auth/authSchemas'
import { getAuthMode, getCurrentUser, requestPasswordReset, signInWithPassword, signOutUser, signUpWithPassword, subscribeToAuthChanges, updatePassword } from './authService'
import type { AuthUser } from './authTypes'

type AuthContextValue = {
  isLoading: boolean
  mode: 'local' | 'supabase'
  user: AuthUser | null
  signIn: (values: LoginValues) => Promise<void>
  signUp: (values: RegisterValues) => Promise<{ requiresEmailConfirmation: boolean }>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (values: ResetPasswordValues) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (!isMounted) return
        setUser(currentUser)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      if (!isMounted) return
      setUser(nextUser)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const signIn = async (values: LoginValues) => {
    const nextUser = await signInWithPassword(values)
    setUser(nextUser)
  }

  const signUp = async (values: RegisterValues) => {
    const result = await signUpWithPassword(values)
    if (result.user) setUser(result.user)
    return { requiresEmailConfirmation: result.requiresEmailConfirmation }
  }

  const requestReset = async (email: string) => {
    await requestPasswordReset(email)
  }

  const updateUserPassword = async (values: ResetPasswordValues) => {
    await updatePassword(values)
  }

  const signOut = async () => {
    await signOutUser()
    setUser(null)
  }

  return <AuthContext.Provider value={{ isLoading, mode: getAuthMode(), user, signIn, signUp, requestPasswordReset: requestReset, updatePassword: updateUserPassword, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
