import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import { userNeedsPasswordSetup } from '@/lib/auth-callback'
import type { AccessibleWorkspace } from '@/lib/workspace-types'
import {
  activatePendingInvites,
  canAccessLegacyWorkspace,
  fetchAccessibleWorkspaces,
  fetchUserProfile,
} from '@/lib/workspace-service'

type AuthContextValue = {
  isSupabaseEnabled: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profileEmail: string | null
  isOrgAdmin: boolean
  accessibleWorkspaces: AccessibleWorkspace[]
  needsPasswordSetup: boolean
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  setPassword: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  setNeedsPasswordSetupFlag: (value: boolean) => void
  signOut: () => Promise<void>
  refreshAccess: () => Promise<void>
  canAccessWorkspace: (kind: 'incident' | 'exercise', legacyId: number) => boolean
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [isOrgAdmin, setIsOrgAdmin] = useState(!isSupabaseConfigured)
  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<AccessibleWorkspace[]>([])
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false)

  const refreshAccess = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsOrgAdmin(true)
      setAccessibleWorkspaces([])
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) return

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (!currentSession?.user) {
      setIsOrgAdmin(false)
      setAccessibleWorkspaces([])
      setNeedsPasswordSetup(false)
      return
    }

    await activatePendingInvites()

    const profile = await fetchUserProfile(currentSession.user.id)
    const orgAdmin = profile?.isOrgAdmin ?? false
    setIsOrgAdmin(orgAdmin)

    const workspaces = await fetchAccessibleWorkspaces(currentSession.user.id, orgAdmin)
    setAccessibleWorkspaces(workspaces)

    setNeedsPasswordSetup((current) => current || userNeedsPasswordSetup(currentSession.user))
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        setNeedsPasswordSetup(userNeedsPasswordSetup(data.session.user))
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        setNeedsPasswordSetup((current) => current || userNeedsPasswordSetup(nextSession.user))
      } else {
        setNeedsPasswordSetup(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (loading) return
    void refreshAccess()
  }, [loading, session?.user?.id, refreshAccess])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { ok: false as const, message: 'Supabase is not configured.' }
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false as const, message: 'Enter a valid email address.' }
    }

    if (password.length === 0) {
      return { ok: false as const, message: 'Enter your password.' }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    })

    if (error) {
      const normalized = error.message.toLowerCase()
      if (normalized.includes('invalid login credentials')) {
        return {
          ok: false as const,
          message:
            'Invalid email or password. If this is your first sign-in, use the link in your invitation email to create a password.',
        }
      }
      return { ok: false as const, message: error.message }
    }

    setNeedsPasswordSetup(false)
    await refreshAccess()
    return { ok: true as const }
  }, [refreshAccess])

  const setPassword = useCallback(async (password: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { ok: false as const, message: 'Supabase is not configured.' }
    }

    if (password.length < 8) {
      return { ok: false as const, message: 'Password must be at least 8 characters.' }
    }

    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    })

    if (error) {
      return { ok: false as const, message: error.message }
    }

    setNeedsPasswordSetup(false)
    await refreshAccess()
    return { ok: true as const }
  }, [refreshAccess])

  const setNeedsPasswordSetupFlag = useCallback((value: boolean) => {
    setNeedsPasswordSetup(value)
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setAccessibleWorkspaces([])
    setIsOrgAdmin(false)
    setNeedsPasswordSetup(false)
  }, [])

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    return currentSession?.access_token ?? null
  }, [])

  const canAccessWorkspace = useCallback(
    (kind: 'incident' | 'exercise', legacyId: number) =>
      canAccessLegacyWorkspace(accessibleWorkspaces, isOrgAdmin, kind, legacyId),
    [accessibleWorkspaces, isOrgAdmin]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isSupabaseEnabled: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profileEmail: session?.user?.email?.toLowerCase() ?? null,
      isOrgAdmin,
      accessibleWorkspaces,
      needsPasswordSetup,
      signInWithPassword,
      setPassword,
      setNeedsPasswordSetupFlag,
      signOut,
      refreshAccess,
      canAccessWorkspace,
      getAccessToken,
    }),
    [
      loading,
      session,
      isOrgAdmin,
      accessibleWorkspaces,
      needsPasswordSetup,
      signInWithPassword,
      setPassword,
      setNeedsPasswordSetupFlag,
      signOut,
      refreshAccess,
      canAccessWorkspace,
      getAccessToken,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
