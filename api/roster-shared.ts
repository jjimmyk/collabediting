import type { SupabaseClient } from '@supabase/supabase-js'
import {
  assertPositionsAllowActiveAssignment,
  getPositionMemberSchedulePolicy,
  loadWorkspacePositionLifecycleContext,
} from './roster-member-schedule-policy.js'

export const ICS_POSITIONS = [
  'Incident Commander',
  'Public Information Officer',
  'Safety Officer',
  'Liaison Officer',
  'Legal Officer',
  'Operations Section Chief',
  'Staging Area Manager',
  'Planning Section Chief',
  'Resources Unit Leader',
  'Situation Unit Leader',
  'Documentation Unit Leader',
  'Demobilization Unit Leader',
  'Technical Specialist',
  'Logistics Section Chief',
  'Service Branch Director',
  'Support Branch Director',
  'Communications Unit Leader',
  'Food Unit Leader',
  'Medical Unit Leader',
  'Facilities Unit Leader',
  'Ground Support Unit Leader',
  'Supply Unit Leader',
  'Vessel Support Unit Leader',
  'Finance Section Chief',
  'Compensation Unit Leader',
  'Cost Unit Leader',
  'Procurement Unit Leader',
  'Time Unit Leader',
  'Intel/Investigations Section Chief',
  'Intelligence Group Supervisor',
  'Investigative Operations Group Supervisor',
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

  await assertPositionsAllowActiveAssignment(admin, params.workspaceId, normalized)

  const primary = primaryIcsPosition(normalized)

  const { data: memberRow, error: memberError } = await admin
    .from('workspace_members')
    .upsert(
      {
        workspace_id: params.workspaceId,
        email: params.email,
        ics_position: primary,
        assignment_kind: 'ics_position',
        org_chart_reports_to: null,
        org_chart_sort_order: 0,
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

export const SINGLE_RESOURCE_POSITION_LABEL = 'Single Resource' as const

export type MemberAssignmentKind = 'ics_position' | 'single_resource'

export async function validateOrgChartReportsToPosition(
  admin: SupabaseClient,
  workspaceId: string,
  reportsTo: string
): Promise<string | null> {
  const allowed = await fetchWorkspacePositionAllowlist(admin, workspaceId)
  const normalized = reportsTo.trim()
  if (!normalized) {
    return 'Select a position to report to.'
  }
  if (!allowed.has(normalized)) {
    return 'Reports-to position must be an existing position in this workspace.'
  }
  return null
}

export async function upsertWorkspaceMemberAsSingleResource(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    orgChartReportsTo: string
    status: 'invited' | 'active'
    userId?: string | null
    invitedBy: string
    joinedAt?: string | null
  }
): Promise<{ memberId: string }> {
  const reportsToError = await validateOrgChartReportsToPosition(
    admin,
    params.workspaceId,
    params.orgChartReportsTo
  )
  if (reportsToError) {
    throw new Error(reportsToError)
  }

  const { data: memberRow, error: memberError } = await admin
    .from('workspace_members')
    .upsert(
      {
        workspace_id: params.workspaceId,
        email: params.email,
        ics_position: SINGLE_RESOURCE_POSITION_LABEL,
        assignment_kind: 'single_resource',
        org_chart_reports_to: params.orgChartReportsTo.trim(),
        org_chart_sort_order: 0,
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

  const { error: deleteError } = await admin
    .from('workspace_member_positions')
    .delete()
    .eq('member_id', memberRow.id)

  if (deleteError) {
    throw deleteError
  }

  return { memberId: memberRow.id }
}

export async function upsertWorkspaceMemberAsDeferredSingleResource(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    status: 'invited' | 'active'
    userId?: string | null
    invitedBy: string
    joinedAt?: string | null
  }
): Promise<{ memberId: string }> {
  const { data: memberRow, error: memberError } = await admin
    .from('workspace_members')
    .upsert(
      {
        workspace_id: params.workspaceId,
        email: params.email,
        ics_position: SINGLE_RESOURCE_POSITION_LABEL,
        assignment_kind: 'single_resource',
        org_chart_reports_to: null,
        org_chart_sort_order: 0,
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

  const { error: deleteError } = await admin
    .from('workspace_member_positions')
    .delete()
    .eq('member_id', memberRow.id)

  if (deleteError) {
    throw deleteError
  }

  return { memberId: memberRow.id }
}

export async function resolveInviteActivePositions(
  admin: SupabaseClient,
  workspaceId: string,
  icsPositions: string[],
  scheduleOnOpAdvance: boolean
): Promise<{ activePositions: string[]; scheduleTargetPosition: string | null }> {
  if (!scheduleOnOpAdvance) {
    return { activePositions: icsPositions, scheduleTargetPosition: null }
  }

  if (icsPositions.length !== 1) {
    throw new Error('Schedule-on-op-advance requires exactly one ICS position.')
  }

  const targetPosition = icsPositions[0]
  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, workspaceId)
  const policy = getPositionMemberSchedulePolicy(targetPosition, lifecycle)
  if (!policy.allowScheduleAssign) {
    throw new Error('Member assign schedules are not allowed for this position.')
  }

  const placeholder = await resolveInvitePlaceholderPosition(admin, workspaceId, targetPosition)
  return { activePositions: [placeholder], scheduleTargetPosition: targetPosition }
}

export async function provisionWorkspaceSingleResourceMember(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    orgChartReportsTo: string
    password: string
    invitedBy: string
    confirmPasswordOverwrite: boolean
  }
): Promise<
  | { ok: true; action: 'created' | 'updated'; memberId: string }
  | { ok: false; code: 'password_too_short' | 'user_exists' }
> {
  if (params.password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return { ok: false, code: 'password_too_short' }
  }

  const authResult = await ensureAuthUser(admin, params.email, params.password, {
    allowPasswordOverwrite: params.confirmPasswordOverwrite,
  })

  if (authResult.ok === false) {
    return { ok: false, code: authResult.code }
  }

  await upsertMemberProfile(admin, authResult.userId, params.email)

  const member = await upsertWorkspaceMemberAsSingleResource(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    orgChartReportsTo: params.orgChartReportsTo,
    status: 'active',
    userId: authResult.userId,
    invitedBy: params.invitedBy,
    joinedAt: new Date().toISOString(),
  })

  return { ok: true, action: authResult.action, memberId: member.memberId }
}

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

    const match = data.users.find(
      (user: { id: string; email?: string | null }) => user.email?.toLowerCase() === email
    )
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
  | { ok: true; action: 'created' | 'updated'; memberId: string }
  | { ok: false; code: 'password_too_short' | 'user_exists' }
> {
  if (params.password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return { ok: false, code: 'password_too_short' }
  }

  const authResult = await ensureAuthUser(admin, params.email, params.password, {
    allowPasswordOverwrite: params.confirmPasswordOverwrite,
  })

  if (authResult.ok === false) {
    return { ok: false, code: authResult.code }
  }

  await upsertMemberProfile(admin, authResult.userId, params.email)

  const member = await upsertWorkspaceMemberWithPositions(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    icsPositions: params.icsPositions,
    status: 'active',
    userId: authResult.userId,
    invitedBy: params.invitedBy,
    joinedAt: new Date().toISOString(),
  })

  return { ok: true, action: authResult.action, memberId: member.memberId }
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

export async function resolveInvitePlaceholderPosition(
  admin: SupabaseClient,
  workspaceId: string,
  targetPosition: string
): Promise<string> {
  const allowed = await fetchWorkspacePositionAllowlist(admin, workspaceId)
  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, workspaceId)

  const candidates = [...ICS_POSITIONS, ...[...allowed].filter((name) => !ICS_POSITIONS.includes(name as (typeof ICS_POSITIONS)[number]))]

  for (const position of candidates) {
    if (position === targetPosition || !allowed.has(position)) continue
    const policy = getPositionMemberSchedulePolicy(position, lifecycle)
    if (policy.allowActiveAssignment) {
      return position
    }
  }

  throw new Error('No placeholder position is available for a scheduled invite.')
}
