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
import { isDefaultRosterEmail } from '@/lib/default-roster'
import {
  fetchUserOrganizations,
  readStoredActiveOrganizationId,
  resolveActiveOrganizationId,
  writeStoredActiveOrganizationId,
} from '@/lib/organization-service'
import type { UserOrganization } from '@/lib/organization-types'
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
  isPlatformOrgAdmin: boolean
  isActiveOrgAdmin: boolean
  organizations: UserOrganization[]
  activeOrganization: UserOrganization | null
  activeOrganizationId: string | null
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
  setActiveOrganizationId: (organizationId: string) => void
  canAccessWorkspace: (kind: 'incident' | 'exercise', legacyId: number) => boolean
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [isPlatformOrgAdmin, setIsPlatformOrgAdmin] = useState(!isSupabaseConfigured)
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null)
  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<AccessibleWorkspace[]>([])
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false)

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.organizationId === activeOrganizationId) ?? null,
    [activeOrganizationId, organizations]
  )

  const isActiveOrgAdmin = activeOrganization?.role === 'admin'
  const isOrgAdmin = isPlatformOrgAdmin || isActiveOrgAdmin

  const setActiveOrganizationId = useCallback((organizationId: string) => {
    setActiveOrganizationIdState(organizationId)
    writeStoredActiveOrganizationId(organizationId)
  }, [])

  const refreshAccess = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsPlatformOrgAdmin(true)
      setOrganizations([])
      setActiveOrganizationIdState(null)
      setAccessibleWorkspaces([])
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) return

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (!currentSession?.user) {
      setIsPlatformOrgAdmin(false)
      setOrganizations([])
      setActiveOrganizationIdState(null)
      setAccessibleWorkspaces([])
      setNeedsPasswordSetup(false)
      return
    }

    await activatePendingInvites()

    const profile = await fetchUserProfile(currentSession.user.id)
    const sessionEmail = currentSession.user.email?.toLowerCase() ?? ''
    const profileEmail = profile?.email?.toLowerCase() ?? sessionEmail
    const platformOrgAdmin = (profile?.isOrgAdmin ?? false) || isDefaultRosterEmail(profileEmail)
    setIsPlatformOrgAdmin(platformOrgAdmin)

    const nextOrganizations = await fetchUserOrganizations(currentSession.user.id)
    setOrganizations(nextOrganizations)

    const storedOrganizationId = readStoredActiveOrganizationId()
    const resolvedOrganizationId = resolveActiveOrganizationId(
      nextOrganizations,
      storedOrganizationId
    )
    setActiveOrganizationIdState(resolvedOrganizationId)
    if (resolvedOrganizationId) {
      writeStoredActiveOrganizationId(resolvedOrganizationId)
    }

    const workspaces = await fetchAccessibleWorkspaces(currentSession.user.id, {
      activeOrganizationId: resolvedOrganizationId,
      isPlatformOrgAdmin: platformOrgAdmin,
    })
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

  useEffect(() => {
    if (!isSupabaseConfigured || loading || !session?.user?.id || !activeOrganizationId) {
      return
    }

    let cancelled = false

    void fetchAccessibleWorkspaces(session.user.id, {
      activeOrganizationId,
      isPlatformOrgAdmin,
    }).then((workspaces) => {
      if (!cancelled) {
        setAccessibleWorkspaces(workspaces)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeOrganizationId, isPlatformOrgAdmin, loading, session?.user?.id])

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
    setOrganizations([])
    setActiveOrganizationIdState(null)
    setIsPlatformOrgAdmin(false)
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
      canAccessLegacyWorkspace(
        accessibleWorkspaces,
        isOrgAdmin,
        kind,
        legacyId,
        session?.user?.email ?? null
      ),
    [accessibleWorkspaces, isOrgAdmin, session?.user?.email]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isSupabaseEnabled: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profileEmail: session?.user?.email?.toLowerCase() ?? null,
      isOrgAdmin,
      isPlatformOrgAdmin,
      isActiveOrgAdmin,
      organizations,
      activeOrganization,
      activeOrganizationId,
      accessibleWorkspaces,
      needsPasswordSetup,
      signInWithPassword,
      setPassword,
      setNeedsPasswordSetupFlag,
      signOut,
      refreshAccess,
      setActiveOrganizationId,
      canAccessWorkspace,
      getAccessToken,
    }),
    [
      loading,
      session,
      isOrgAdmin,
      isPlatformOrgAdmin,
      isActiveOrgAdmin,
      organizations,
      activeOrganization,
      activeOrganizationId,
      accessibleWorkspaces,
      needsPasswordSetup,
      signInWithPassword,
      setPassword,
      setNeedsPasswordSetupFlag,
      signOut,
      refreshAccess,
      setActiveOrganizationId,
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
