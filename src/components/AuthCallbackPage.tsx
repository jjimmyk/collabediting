import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import App from '@/App'
import { LoginPage } from '@/components/LoginPage'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'

type Status = 'processing' | 'ready' | 'failed'

export function AuthCallbackPage() {
  const { refreshAccess, session } = useAuth()
  const [status, setStatus] = useState<Status>('processing')
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

      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      const hashParams = new URLSearchParams(hash)
      const searchParams = new URLSearchParams(window.location.search)

      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const code = searchParams.get('code')

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) {
            throw error
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            throw error
          }
        } else {
          const { error } = await supabase.auth.getSession()
          if (error) {
            throw error
          }
        }

        await refreshAccess()

        if (!mounted) return

        window.history.replaceState({}, '', '/')
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
  }, [refreshAccess])

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

  if (session) {
    return <App />
  }

  return <LoginPage />
}
