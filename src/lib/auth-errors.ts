const SIGN_IN_SENT_STORAGE_KEY = 'pratus-signin-link-sent-at'
const SIGN_IN_RETRY_AFTER_STORAGE_KEY = 'pratus-signin-retry-after-until'
const SIGN_IN_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000
const SIGN_IN_RATE_LIMIT_STORAGE_KEY = 'pratus-signin-rate-limited-at'
const DEFAULT_SIGN_IN_COOLDOWN_MS = 65 * 1000

export function parseSignInRetryAfterSeconds(message: string): number | null {
  const match = message.match(/after\s+(\d+)\s+seconds?/i)
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

export function formatSignInError(message: string): string {
  const normalized = message.toLowerCase()
  const retryAfterSeconds = parseSignInRetryAfterSeconds(message)

  if (retryAfterSeconds !== null) {
    return `Please wait ${retryAfterSeconds} seconds before requesting another sign-in link.`
  }

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

export function markSignInLinkSent(cooldownMs: number = DEFAULT_SIGN_IN_COOLDOWN_MS): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SIGN_IN_SENT_STORAGE_KEY, String(Date.now()))
  sessionStorage.setItem(SIGN_IN_RETRY_AFTER_STORAGE_KEY, String(Date.now() + cooldownMs))
  sessionStorage.removeItem(SIGN_IN_RATE_LIMIT_STORAGE_KEY)
}

export function markSignInRetryAfter(seconds: number): void {
  if (typeof window === 'undefined') return
  const cooldownMs = Math.max(seconds, 1) * 1000
  sessionStorage.setItem(SIGN_IN_RETRY_AFTER_STORAGE_KEY, String(Date.now() + cooldownMs))
}

export function markSignInRateLimited(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SIGN_IN_RATE_LIMIT_STORAGE_KEY, String(Date.now()))
}

export function getSignInCooldownRemainingMs(): number {
  if (typeof window === 'undefined') return 0

  const retryUntil = sessionStorage.getItem(SIGN_IN_RETRY_AFTER_STORAGE_KEY)
  if (retryUntil) {
    const remaining = Number(retryUntil) - Date.now()
    if (remaining > 0) return remaining
    sessionStorage.removeItem(SIGN_IN_RETRY_AFTER_STORAGE_KEY)
  }

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
  const remaining = DEFAULT_SIGN_IN_COOLDOWN_MS - elapsed
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
