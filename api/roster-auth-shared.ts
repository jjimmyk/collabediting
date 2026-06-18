import type { SupabaseClient } from '@supabase/supabase-js'

const ROSTER_MANAGER_POSITIONS = new Set([
  'Incident Commander',
  'Planning Section Chief',
  'Operations Section Chief',
])

export async function userCanManageWorkspaceRoster(
  admin: SupabaseClient,
  userId: string,
  workspaceId: string,
  isOrgAdmin: boolean
): Promise<boolean> {
  if (isOrgAdmin) {
    return true
  }

  const { data: membership, error: membershipError } = await admin
    .from('workspace_members')
    .select('id, workspace_member_positions (ics_position)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    return false
  }

  const positions = (membership.workspace_member_positions ?? [])
    .map((row) => row.ics_position)
    .filter((position): position is string => typeof position === 'string')

  return positions.some((position) => ROSTER_MANAGER_POSITIONS.has(position))
}

export async function assertIncidentOrExerciseWorkspace(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const { data, error } = await admin
    .from('workspaces')
    .select('kind')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || (data.kind !== 'incident' && data.kind !== 'exercise')) {
    throw new Error('Position asset assignments are only available in incident and exercise workspaces.')
  }
}

export async function authenticateRosterManager(
  admin: SupabaseClient,
  accessToken: string,
  workspaceId: string
): Promise<{ userId: string }> {
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(accessToken)

  if (userError || !user) {
    throw new Error('Invalid or expired session.')
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('is_org_admin')
    .eq('id', user.id)
    .maybeSingle()

  const canManage = await userCanManageWorkspaceRoster(
    admin,
    user.id,
    workspaceId,
    profile?.is_org_admin === true
  )

  if (!canManage) {
    throw new Error('You do not have permission to manage roster assignments.')
  }

  return { userId: user.id }
}
