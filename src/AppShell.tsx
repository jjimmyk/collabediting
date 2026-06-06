import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import App from '@/App'
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

export function AppShell() {
  const { isSupabaseEnabled, loading, session } = useAuth()
  const isAcceptInviteRoute =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/accept-invite')

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

  if (isAcceptInviteRoute) {
    return <AcceptInvitePage />
  }

  if (!session) {
    return <LoginPage />
  }

  if (session && !isAcceptInviteRoute) {
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
