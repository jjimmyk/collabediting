import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import {
  formatCooldownDuration,
  getSignInCooldownRemainingMs,
  hasRecentSignInLinkSent,
  markSignInLinkSent,
} from '@/lib/auth-errors'
import pratusLogo from '@/assets/pratus-logo.png'

const SUCCESS_MESSAGE =
  'Check your email for a sign-in link. Invited roster members are activated automatically after login.'

export function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldownMs, setCooldownMs] = useState(0)

  useEffect(() => {
    const updateCooldown = () => {
      setCooldownMs(getSignInCooldownRemainingMs())
    }

    updateCooldown()
    const timer = window.setInterval(updateCooldown, 1000)
    return () => window.clearInterval(timer)
  }, [isSubmitting, error, message])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const remaining = getSignInCooldownRemainingMs()
    if (remaining > 0) {
      if (hasRecentSignInLinkSent()) {
        setMessage(
          `${SUCCESS_MESSAGE} You can request another link in ${formatCooldownDuration(remaining)}.`
        )
      } else {
        setError(`Please wait ${formatCooldownDuration(remaining)} before requesting another sign-in link.`)
      }
      return
    }

    if (hasRecentSignInLinkSent()) {
      markSignInLinkSent()
      setMessage(`${SUCCESS_MESSAGE} You can request another link in about 2 minutes if needed.`)
      return
    }

    setIsSubmitting(true)

    const result = await signInWithEmail(email)
    setIsSubmitting(false)
    setCooldownMs(getSignInCooldownRemainingMs())

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(SUCCESS_MESSAGE)
  }

  const isDisabled = isSubmitting || cooldownMs > 0

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <img src={pratusLogo} alt="Pratus" className="h-8 w-auto object-contain" />
          </div>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Sign in to Pratus</CardTitle>
          <CardDescription>
            Use the email address you were invited with. You can only open incident and exercise
            workspaces where you appear on the roster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Work email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@agency.gov"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isSubmitting
                ? 'Sending link…'
                : cooldownMs > 0
                  ? `Wait ${formatCooldownDuration(cooldownMs)}`
                  : 'Email me a sign-in link'}
            </Button>
            {hasRecentSignInLinkSent() && !error && (
              <p className="text-xs text-muted-foreground">
                Already requested a link? Check your inbox and spam folder. Links expire after about
                one hour.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
