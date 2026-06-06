export type AuthCallbackType =
  | 'signup'
  | 'invite'
  | 'recovery'
  | 'magiclink'
  | 'email'
  | 'email_change'
  | 'reauthentication'

export type ParsedAuthCallback = {
  accessToken: string | null
  refreshToken: string | null
  code: string | null
  tokenHash: string | null
  type: AuthCallbackType | null
}

export function parseAuthCallbackUrl(url: string = window.location.href): ParsedAuthCallback {
  const parsed = new URL(url)
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash
  const hashParams = new URLSearchParams(hash)
  const searchParams = parsed.searchParams

  const rawType = searchParams.get('type') ?? hashParams.get('type')
  const type =
    rawType === 'signup' ||
    rawType === 'invite' ||
    rawType === 'recovery' ||
    rawType === 'magiclink' ||
    rawType === 'email' ||
    rawType === 'email_change' ||
    rawType === 'reauthentication'
      ? rawType
      : null

  return {
    accessToken: hashParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token'),
    code: searchParams.get('code'),
    tokenHash: searchParams.get('token_hash'),
    type,
  }
}

export function hasAuthCallbackParams(url: string = window.location.href): boolean {
  const parsed = parseAuthCallbackUrl(url)
  return Boolean(
    (parsed.accessToken && parsed.refreshToken) ||
      parsed.code ||
      (parsed.tokenHash && parsed.type)
  )
}

export function shouldPromptForPasswordSetup(type: AuthCallbackType | null): boolean {
  return type === 'signup' || type === 'invite' || type === 'recovery' || type === 'magiclink'
}

export function userNeedsPasswordSetup(
  user: { user_metadata?: Record<string, unknown> } | null | undefined
): boolean {
  return user?.user_metadata?.password_set !== true
}
