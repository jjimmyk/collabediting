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

export function shouldPromptForPasswordSetup(
  type: AuthCallbackType | null,
  user?: { user_metadata?: Record<string, unknown> } | null
): boolean {
  if (type === 'invite') {
    return true
  }
  if (type === 'signup' || type === 'recovery') {
    return userNeedsPasswordSetup(user)
  }
  if (type === 'magiclink') {
    return userNeedsPasswordSetup(user)
  }
  return userNeedsPasswordSetup(user)
}

export const POST_AUTH_WORKSPACE_STORAGE_KEY = 'pratus-post-auth-workspace-id'

export function stashInvitedWorkspaceId(workspaceId: string | null): void {
  if (typeof window === 'undefined' || !workspaceId) return
  sessionStorage.setItem(POST_AUTH_WORKSPACE_STORAGE_KEY, workspaceId)
}

export function consumeInvitedWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  const workspaceId = sessionStorage.getItem(POST_AUTH_WORKSPACE_STORAGE_KEY)
  if (workspaceId) {
    sessionStorage.removeItem(POST_AUTH_WORKSPACE_STORAGE_KEY)
  }
  return workspaceId
}

export function userNeedsPasswordSetup(
  user: { user_metadata?: Record<string, unknown> } | null | undefined
): boolean {
  return user?.user_metadata?.password_set !== true
}
