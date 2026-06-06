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
import { getAuthCallbackUrl } from '@/lib/app-url'
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
  signInWithEmail: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>
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
      return
    }

    await activatePendingInvites()

    const profile = await fetchUserProfile(currentSession.user.id)
    const orgAdmin = profile?.isOrgAdmin ?? false
    setIsOrgAdmin(orgAdmin)

    const workspaces = await fetchAccessibleWorkspaces(currentSession.user.id, orgAdmin)
    setAccessibleWorkspaces(workspaces)
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
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
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

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { ok: false as const, message: 'Supabase is not configured.' }
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false as const, message: 'Enter a valid email address.' }
    }

    const redirectTo = getAuthCallbackUrl()
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      return { ok: false as const, message: error.message }
    }

    return { ok: true as const }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setAccessibleWorkspaces([])
    setIsOrgAdmin(false)
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
      signInWithEmail,
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
      signInWithEmail,
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
