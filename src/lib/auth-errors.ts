const SIGN_IN_SENT_STORAGE_KEY = 'pratus-signin-link-sent-at'
const SIGN_IN_COOLDOWN_MS = 2 * 60 * 1000
const SIGN_IN_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000
const SIGN_IN_RATE_LIMIT_STORAGE_KEY = 'pratus-signin-rate-limited-at'

export function formatSignInError(message: string): string {
  const normalized = message.toLowerCase()

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('429')
  ) {
    return (
      'Email sending is temporarily rate-limited by Supabase (about 3 emails per hour on the built-in mail service). ' +
      'Open a recent sign-in email from your inbox if you have one — links stay valid for about an hour. ' +
      'Otherwise wait 15–60 minutes before trying again, or ask an admin to enable custom SMTP in Supabase.'
    )
  }

  return message
}

export function markSignInLinkSent(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SIGN_IN_SENT_STORAGE_KEY, String(Date.now()))
  sessionStorage.removeItem(SIGN_IN_RATE_LIMIT_STORAGE_KEY)
}

export function markSignInRateLimited(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SIGN_IN_RATE_LIMIT_STORAGE_KEY, String(Date.now()))
}

export function getSignInCooldownRemainingMs(): number {
  if (typeof window === 'undefined') return 0

  const rateLimitedAt = sessionStorage.getItem(SIGN_IN_RATE_LIMIT_STORAGE_KEY)
  if (rateLimitedAt) {
    const elapsed = Date.now() - Number(rateLimitedAt)
    const remaining = SIGN_IN_RATE_LIMIT_COOLDOWN_MS - elapsed
    if (remaining > 0) return remaining
    sessionStorage.removeItem(SIGN_IN_RATE_LIMIT_STORAGE_KEY)
  }

  const sentAt = sessionStorage.getItem(SIGN_IN_SENT_STORAGE_KEY)
  if (!sentAt) return 0

  const elapsed = Date.now() - Number(sentAt)
  const remaining = SIGN_IN_COOLDOWN_MS - elapsed
  return remaining > 0 ? remaining : 0
}

export function hasRecentSignInLinkSent(): boolean {
  if (typeof window === 'undefined') return false
  const sentAt = sessionStorage.getItem(SIGN_IN_SENT_STORAGE_KEY)
  if (!sentAt) return false
  return Date.now() - Number(sentAt) < 60 * 60 * 1000
}

export function formatCooldownDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}
