import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { LoginValues, RegisterValues, ResetPasswordValues } from '../../pages/auth/authSchemas'
import type { AuthUser } from './authTypes'

const storageKey = 'massarocario-demo-user'

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user?.email) return null

  return {
    id: user.id,
    name: String(user.user_metadata.name ?? user.email.split('@')[0] ?? 'Visitante'),
    email: user.email,
  }
}

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(storageKey)
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    return null
  }
}

function storeLocalUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(storageKey)
    return
  }

  localStorage.setItem(storageKey, JSON.stringify(user))
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) return getStoredUser()

  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  return mapSupabaseUser(data.user)
}

export function subscribeToAuthChanges(onUserChange: (user: AuthUser | null) => void) {
  if (!isSupabaseConfigured || !supabase) return () => undefined

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onUserChange(mapSupabaseUser(session?.user ?? null))
  })

  return () => data.subscription.unsubscribe()
}

export async function signInWithPassword(values: LoginValues) {
  if (!isSupabaseConfigured || !supabase) {
    const localUser = {
      id: values.email.toLowerCase(),
      name: values.email.split('@')[0] || 'Visitante',
      email: values.email,
    }

    storeLocalUser(localUser)
    return localUser
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  })

  if (error) throw new Error(error.message)

  const nextUser = mapSupabaseUser(data.user)
  if (!nextUser) throw new Error('Nao foi possivel carregar a conta autenticada.')
  return nextUser
}

export async function signUpWithPassword(values: RegisterValues) {
  if (!isSupabaseConfigured || !supabase) {
    const localUser = {
      id: values.email.toLowerCase(),
      name: values.name,
      email: values.email,
    }

    storeLocalUser(localUser)
    return { user: localUser, requiresEmailConfirmation: false }
  }

  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        name: values.name,
      },
    },
  })

  if (error) throw new Error(error.message)

  return {
    user: mapSupabaseUser(data.user),
    requiresEmailConfirmation: !data.session,
  }
}

export async function requestPasswordReset(email: string) {
  if (!isSupabaseConfigured || !supabase) return

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw new Error(error.message)
}

export async function updatePassword(values: ResetPasswordValues) {
  if (!isSupabaseConfigured || !supabase) return

  const { error } = await supabase.auth.updateUser({
    password: values.password,
  })

  if (error) throw new Error(error.message)
}

export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) {
    storeLocalUser(null)
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export function getAuthMode() {
  return isSupabaseConfigured ? 'supabase' : 'local'
}
