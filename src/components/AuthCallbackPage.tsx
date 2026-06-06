import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import App from '@/App'
import { LoginPage } from '@/components/LoginPage'
import { SetPasswordPage } from '@/components/SetPasswordPage'
import { useAuth } from '@/contexts/AuthContext'
import {
  parseAuthCallbackUrl,
  shouldPromptForPasswordSetup,
  userNeedsPasswordSetup,
} from '@/lib/auth-callback'
import { getSupabaseClient } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

type Status = 'processing' | 'ready' | 'needs-password' | 'failed'

export function AuthCallbackPage() {
  const { refreshAccess, session, setNeedsPasswordSetupFlag } = useAuth()
  const [status, setStatus] = useState<Status>('processing')
  const [resolvedSession, setResolvedSession] = useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function completeAuthFromUrl() {
      const supabase = getSupabaseClient()
      if (!supabase) {
        if (mounted) {
          setStatus('failed')
          setErrorMessage('Supabase is not configured.')
        }
        return
      }

      const callback = parseAuthCallbackUrl()

      try {
        if (callback.tokenHash && callback.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: callback.tokenHash,
            type: callback.type,
          })
          if (error) {
            throw error
          }
        } else if (callback.accessToken && callback.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: callback.accessToken,
            refresh_token: callback.refreshToken,
          })
          if (error) {
            throw error
          }
        } else if (callback.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(callback.code)
          if (error) {
            throw error
          }
        } else {
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            throw error
          }
          if (!data.session) {
            throw new Error('No sign-in credentials were found in this link. Request a new one.')
          }
        }

        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!currentSession) {
          throw new Error('Sign-in completed but no session was created.')
        }

        if (!mounted) return

        setResolvedSession(currentSession)
        await refreshAccess()

        if (!mounted) return

        window.history.replaceState({}, '', '/')

        const needsPassword =
          shouldPromptForPasswordSetup(callback.type) ||
          userNeedsPasswordSetup(currentSession.user)

        if (needsPassword) {
          setNeedsPasswordSetupFlag(true)
          setStatus('needs-password')
          return
        }

        setNeedsPasswordSetupFlag(false)
        setStatus('ready')
      } catch (error) {
        if (!mounted) return
        setStatus('failed')
        setErrorMessage(error instanceof Error ? error.message : 'Sign-in failed.')
      }
    }

    void completeAuthFromUrl()

    return () => {
      mounted = false
    }
  }, [refreshAccess, setNeedsPasswordSetupFlag])

  if (status === 'processing') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-destructive">{errorMessage ?? 'Sign-in failed.'}</p>
        <LoginPage />
      </div>
    )
  }

  if (status === 'needs-password') {
    return <SetPasswordPage />
  }

  if (status === 'ready' && (resolvedSession || session)) {
    return <App />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading your account…</p>
    </div>
  )
}
