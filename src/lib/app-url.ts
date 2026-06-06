const PRODUCTION_APP_URL = 'https://thehub-6426.vercel.app'

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

/** Canonical app origin for auth redirects (avoids Supabase defaulting to localhost:3000). */
export function getAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL as string | undefined
  if (configured && configured.trim().length > 0) {
    const normalized = normalizeOrigin(configured.trim())
    if (!normalized.includes('localhost')) {
      return normalized
    }
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin
    if (!origin.includes('localhost')) {
      return origin
    }
  }

  if (configured && configured.trim().length > 0) {
    return normalizeOrigin(configured.trim())
  }

  return PRODUCTION_APP_URL
}

export function getAuthCallbackUrl(): string {
  return `${getAppOrigin()}/auth/callback`
}

export function getAcceptInviteUrl(workspaceId?: string): string {
  const base = `${getAppOrigin()}/auth/callback`
  if (!workspaceId) {
    return base
  }
  return `${base}?workspace=${encodeURIComponent(workspaceId)}`
}

