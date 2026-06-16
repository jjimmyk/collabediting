import type { SupabaseClient } from '@supabase/supabase-js'

export const ICS_POSITIONS = [
  'Incident Commander',
  'Public Information Officer',
  'Safety Officer',
  'Liaison Officer',
  'Operations Section Chief',
  'Planning Section Chief',
  'Logistics Section Chief',
  'Finance/Admin Section Chief',
  'Situation Unit Leader',
  'Resources Unit Leader',
  'Documentation Unit Leader',
  'Display Unit Leader',
  'Demobilization Unit Leader',
] as const

export function normalizeIcsPositions(positions: string[]): string[] {
  return normalizeIcsPositionsWithAllowlist(positions, new Set<string>(ICS_POSITIONS))
}

export function normalizeIcsPositionsWithAllowlist(
  positions: string[],
  allowed: Set<string>
): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const position of positions) {
    const trimmed = position.trim()
    if (!allowed.has(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    normalized.push(trimmed)
  }
  return normalized
}

export async function fetchWorkspacePositionAllowlist(
  admin: SupabaseClient,
  workspaceId: string
): Promise<Set<string>> {
  const allowed = new Set<string>(ICS_POSITIONS)
  const { data, error } = await admin
    .from('workspace_custom_positions')
    .select('name, lifecycle_status')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw error
  }

  for (const row of data ?? []) {
    if (typeof row.name !== 'string' || row.name.trim().length === 0) {
      continue
    }
    if (row.lifecycle_status === 'archived') {
      continue
    }
    allowed.add(row.name.trim())
  }

  const { data: standardLifecycle, error: lifecycleError } = await admin
    .from('workspace_standard_position_lifecycle')
    .select('position_name, archived_at')
    .eq('workspace_id', workspaceId)

  if (lifecycleError) {
    throw lifecycleError
  }

  for (const row of standardLifecycle ?? []) {
    if (row.archived_at && typeof row.position_name === 'string') {
      allowed.delete(row.position_name)
    }
  }

  return allowed
}

export function primaryIcsPosition(positions: string[]): string {
  return positions[0] ?? 'Incident Commander'
}

export async function replaceWorkspaceMemberPositions(
  admin: SupabaseClient,
  memberId: string,
  positions: string[],
  allowedPositions?: Set<string>
): Promise<string[]> {
  const allowed = allowedPositions ?? new Set<string>(ICS_POSITIONS)
  const normalized = normalizeIcsPositionsWithAllowlist(positions, allowed)
  if (normalized.length === 0) {
    throw new Error('At least one ICS position is required.')
  }

  const { data: existingRows, error: existingError } = await admin
    .from('workspace_member_positions')
    .select('ics_position')
    .eq('member_id', memberId)

  if (existingError) {
    throw existingError
  }

  const current = (existingRows ?? []).map((row) => row.ics_position)
  const nextSet = new Set(normalized)
  const toAdd = normalized.filter((position) => !current.includes(position))
  const toRemove = current.filter((position) => !nextSet.has(position))

  if (toAdd.length > 0) {
    const { error: insertError } = await admin.from('workspace_member_positions').insert(
      toAdd.map((icsPosition) => ({
        member_id: memberId,
        ics_position: icsPosition,
      }))
    )

    if (insertError) {
      throw insertError
    }
  }

  for (const position of toRemove) {
    const { error: deleteError } = await admin
      .from('workspace_member_positions')
      .delete()
      .eq('member_id', memberId)
      .eq('ics_position', position)

    if (deleteError) {
      throw deleteError
    }
  }

  const primary = primaryIcsPosition(normalized)
  const { error: memberError } = await admin
    .from('workspace_members')
    .update({ ics_position: primary })
    .eq('id', memberId)

  if (memberError) {
    throw memberError
  }

  return normalized
}

export async function upsertWorkspaceMemberWithPositions(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    icsPositions: string[]
    status: 'invited' | 'active'
    userId?: string | null
    invitedBy: string
    joinedAt?: string | null
  }
): Promise<{ memberId: string; icsPositions: string[] }> {
  const allowed = await fetchWorkspacePositionAllowlist(admin, params.workspaceId)
  const normalized = normalizeIcsPositionsWithAllowlist(params.icsPositions, allowed)
  if (normalized.length === 0) {
    throw new Error('At least one ICS position is required.')
  }

  const primary = primaryIcsPosition(normalized)

  const { data: memberRow, error: memberError } = await admin
    .from('workspace_members')
    .upsert(
      {
        workspace_id: params.workspaceId,
        email: params.email,
        ics_position: primary,
        status: params.status,
        user_id: params.userId ?? null,
        invited_by: params.invitedBy,
        invited_at: new Date().toISOString(),
        joined_at: params.joinedAt ?? null,
      },
      { onConflict: 'workspace_id,email' }
    )
    .select('id')
    .single()

  if (memberError || !memberRow) {
    throw memberError ?? new Error('Could not upsert workspace member.')
  }

  const assigned = await replaceWorkspaceMemberPositions(admin, memberRow.id, normalized)
  return { memberId: memberRow.id, icsPositions: assigned }
}

export function parseIcsPositionsInput(
  body: { icsPositions?: unknown; icsPosition?: unknown },
  fallback?: string,
  allowedPositions?: Set<string>
): string[] {
  const allowed = allowedPositions ?? new Set<string>(ICS_POSITIONS)
  if (Array.isArray(body.icsPositions)) {
    return normalizeIcsPositionsWithAllowlist(
      body.icsPositions.filter((entry) => typeof entry === 'string'),
      allowed
    )
  }
  if (typeof body.icsPosition === 'string' && body.icsPosition.trim().length > 0) {
    return normalizeIcsPositionsWithAllowlist([body.icsPosition], allowed)
  }
  if (fallback) {
    return normalizeIcsPositionsWithAllowlist([fallback], allowed)
  }
  return []
}

export const MIN_AUTH_PASSWORD_LENGTH = 8

export type EnsureAuthUserResult =
  | { ok: true; userId: string; action: 'created' | 'updated' }
  | { ok: false; code: 'user_exists' }

export async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<string | null> {
  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) {
      return match.id
    }

    if (data.users.length < perPage) {
      break
    }
    page += 1
  }

  return null
}

export async function ensureAuthUser(
  admin: SupabaseClient,
  email: string,
  password: string,
  options?: { allowPasswordOverwrite?: boolean }
): Promise<EnsureAuthUserResult> {
  const existingUserId = await findUserIdByEmail(admin, email)

  if (existingUserId) {
    if (!options?.allowPasswordOverwrite) {
      return { ok: false, code: 'user_exists' }
    }

    const { error } = await admin.auth.admin.updateUserById(existingUserId, {
      password,
      email_confirm: true,
      user_metadata: { password_set: true },
    })
    if (error) {
      throw error
    }
    return { ok: true, userId: existingUserId, action: 'updated' }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { password_set: true },
  })

  if (error || !data.user) {
    throw error ?? new Error(`Could not create auth user for ${email}.`)
  }

  return { ok: true, userId: data.user.id, action: 'created' }
}

export async function upsertMemberProfile(
  admin: SupabaseClient,
  userId: string,
  email: string,
  options?: { isOrgAdmin?: boolean }
): Promise<void> {
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: email.split('@')[0],
      is_org_admin: options?.isOrgAdmin ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (error) {
    throw error
  }
}

export async function provisionWorkspaceRosterMember(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    icsPositions: string[]
    password: string
    invitedBy: string
    confirmPasswordOverwrite: boolean
  }
): Promise<
  | { ok: true; action: 'created' | 'updated' }
  | { ok: false; code: 'password_too_short' | 'user_exists' }
> {
  if (params.password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return { ok: false, code: 'password_too_short' }
  }

  const authResult = await ensureAuthUser(admin, params.email, params.password, {
    allowPasswordOverwrite: params.confirmPasswordOverwrite,
  })

  if (!authResult.ok) {
    return authResult
  }

  await upsertMemberProfile(admin, authResult.userId, params.email)

  await upsertWorkspaceMemberWithPositions(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    icsPositions: params.icsPositions,
    status: 'active',
    userId: authResult.userId,
    invitedBy: params.invitedBy,
    joinedAt: new Date().toISOString(),
  })

  return { ok: true, action: authResult.action }
}

export async function syncDefaultRosterAcrossWorkspaces(
  admin: SupabaseClient,
  userId: string,
  email: string
): Promise<{ rosterRows: number }> {
  await upsertMemberProfile(admin, userId, email, { isOrgAdmin: true })

  const { data: workspaces, error: workspacesError } = await admin
    .from('workspaces')
    .select('id')

  if (workspacesError) {
    throw workspacesError
  }

  let rosterRows = 0
  for (const workspace of workspaces ?? []) {
    await upsertWorkspaceMemberWithPositions(admin, {
      workspaceId: workspace.id,
      email,
      icsPositions: ['Incident Commander'],
      status: 'active',
      userId,
      invitedBy: userId,
      joinedAt: new Date().toISOString(),
    })
    rosterRows += 1
  }

  return { rosterRows }
}
