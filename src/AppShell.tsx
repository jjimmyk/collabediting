import { Loader2 } from 'lucide-react'
import App from '@/App'
import { AuthCallbackPage } from '@/components/AuthCallbackPage'
import { LoginPage } from '@/components/LoginPage'
import { SetPasswordPage } from '@/components/SetPasswordPage'
import { useAuth } from '@/contexts/AuthContext'
import { hasAuthCallbackParams } from '@/lib/auth-callback'

export function AppShell() {
  const { isSupabaseEnabled, loading, session, needsPasswordSetup } = useAuth()

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const isAuthCallbackRoute = pathname.startsWith('/auth/callback')
  const shouldHandleAuthCallback =
    isAuthCallbackRoute ||
    (typeof window !== 'undefined' && hasAuthCallbackParams())

  if (!isSupabaseEnabled) {
    return <App />
  }

  if (shouldHandleAuthCallback) {
    return <AuthCallbackPage />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (session && needsPasswordSetup) {
    return <SetPasswordPage />
  }

  if (!session) {
    return <LoginPage />
  }

  return <App />
}
