import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import App from '@/App'
import { AuthCallbackPage } from '@/components/AuthCallbackPage'
import { LoginPage } from '@/components/LoginPage'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AcceptInvitePage() {
  const { refreshAccess, session } = useAuth()
  const [status, setStatus] = useState<'working' | 'ready' | 'needs-login'>('working')

  useEffect(() => {
    let mounted = true

    async function run() {
      await refreshAccess()
      if (!mounted) return

      if (session) {
        setStatus('ready')
        window.history.replaceState({}, '', '/')
        return
      }

      setStatus('needs-login')
    }

    void run()

    return () => {
      mounted = false
    }
  }, [refreshAccess, session])

  if (status === 'working') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === 'needs-login') {
    return <LoginPage />
  }

  return <App />
}

function hasAuthTokensInUrl(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (window.location.hash.includes('access_token=')) {
    return true
  }
  const params = new URLSearchParams(window.location.search)
  return params.has('code')
}

export function AppShell() {
  const { isSupabaseEnabled, loading, session } = useAuth()

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const isAuthCallbackRoute = pathname.startsWith('/auth/callback')
  const isAcceptInviteRoute = pathname.startsWith('/accept-invite')
  const shouldHandleAuthCallback = isAuthCallbackRoute || hasAuthTokensInUrl()

  if (!isSupabaseEnabled) {
    return <App />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (shouldHandleAuthCallback) {
    return <AuthCallbackPage />
  }

  if (isAcceptInviteRoute) {
    return <AcceptInvitePage />
  }

  if (!session) {
    return <LoginPage />
  }

  if (session) {
    return <App />
  }

  return (
    <Card className="mx-auto mt-24 max-w-md">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Loading your workspace access…</CardDescription>
      </CardHeader>
      <CardContent>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  )
}
