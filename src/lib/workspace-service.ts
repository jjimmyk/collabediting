import { primaryIcsPosition, WORKSPACE_PERMISSION_EDIT_ICS201 } from '@/lib/ics-positions'
import {
  buildDefaultPositionPermissionMap,
  permissionsFromRows,
  type PositionPermissionMap,
} from '@/features/roster/workspace-position-roster'
import { buildWorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { getAcceptInviteUrl } from '@/lib/app-url'
import {
  hasDefaultFullWorkspaceAccess,
  isDefaultLegacyWorkspace,
} from '@/lib/default-roster'
import { getSeededWorkspaceId } from '@/lib/workspace-ids'
import { parseWorkspaceMemberCheckInStatus } from '@/lib/roster-check-in-status'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  AccessibleWorkspace,
  DbWorkspaceMember,
  UserProfile,
  WorkspaceKind,
  WorkspaceMemberCheckInStatus,
  WorkspaceMetadataRecord,
  WorkspacePermissions,
  WorkspaceRosterMember,
} from '@/lib/workspace-types'
import type { WorkspaceLocationMethod } from '@/features/workspace-settings/types'

export type ResolvedWorkspacePermissions = WorkspacePermissions

function formatMemberDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapMemberPositions(row: DbWorkspaceMember): string[] {
  const fromJoin = (row.workspace_member_positions ?? [])
    .map((entry) => entry.ics_position)
    .filter((entry) => entry.length > 0)
  if (fromJoin.length > 0) {
    return [...fromJoin].sort((a, b) => a.localeCompare(b))
  }
  return row.ics_position ? [row.ics_position] : []
}

function mapDbMember(row: DbWorkspaceMember): WorkspaceRosterMember {
  const icsPositions = mapMemberPositions(row)
  return {
    id: row.id,
    email: row.email,
    icsPosition: primaryIcsPosition(icsPositions),
    icsPositions,
    status: row.status,
    checkInStatus: parseWorkspaceMemberCheckInStatus(row.check_in_status),
    addedAt: formatMemberDate(row.joined_at ?? row.invited_at),
    userId: row.user_id,
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_org_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    isOrgAdmin: data.is_org_admin,
  }
}

export async function activatePendingInvites(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.rpc('activate_my_invites')
}

function isWorkspaceLocationMethod(value: string): value is WorkspaceLocationMethod {
  return (
    value === '' ||
    value === 'draw-point' ||
    value === 'draw-polygon' ||
    value === 'enter-coordinates' ||
    value === 'enter-address'
  )
}

function mapWorkspaceMetadata(value: unknown): WorkspaceMetadataRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  const record = value as Record<string, unknown>
  const locationRaw = record.location
  const location =
    Array.isArray(locationRaw) &&
    locationRaw.length === 2 &&
    typeof locationRaw[0] === 'number' &&
    typeof locationRaw[1] === 'number'
      ? ([locationRaw[0], locationRaw[1]] as [number, number])
      : undefined
  const locationMethodRaw =
    typeof record.locationMethod === 'string' ? record.locationMethod : undefined

  return {
    category: typeof record.category === 'string' ? record.category : undefined,
    templateId: typeof record.templateId === 'string' ? record.templateId : undefined,
    relatedEventIds: Array.isArray(record.relatedEventIds)
      ? record.relatedEventIds.filter((entry): entry is number => typeof entry === 'number')
      : undefined,
    locationMethod:
      locationMethodRaw && isWorkspaceLocationMethod(locationMethodRaw)
        ? locationMethodRaw
        : undefined,
    geometrySummary:
      typeof record.geometrySummary === 'string' ? record.geometrySummary : undefined,
    aors: Array.isArray(record.aors)
      ? record.aors.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    address: typeof record.address === 'string' ? record.address : undefined,
    location,
  }
}

function mapAccessibleWorkspaceFields(row: {
  workspace_format?: string | null
  incident_complexity?: string | null
  has_sequential_workflow?: boolean | null
  sequential_workflow_type?: string | null
  started_operational_period_count?: number | null
  working_operational_period_number?: number | null
  metadata?: unknown
}) {
  return {
    workspaceFormat: row.workspace_format ?? null,
    incidentComplexity: row.incident_complexity ?? null,
    hasSequentialWorkflow: row.has_sequential_workflow ?? false,
    sequentialWorkflowType: row.sequential_workflow_type ?? null,
    startedOperationalPeriodCount: row.started_operational_period_count ?? 0,
    workingOperationalPeriodNumber: row.working_operational_period_number ?? 1,
    metadata: mapWorkspaceMetadata(row.metadata),
  }
}

export async function fetchAccessibleWorkspaces(
  userId: string,
  isOrgAdmin: boolean
): Promise<AccessibleWorkspace[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  if (isOrgAdmin) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(
        'id, kind, legacy_id, name, region, summary, archived_at, workspace_format, incident_complexity, has_sequential_workflow, sequential_workflow_type, started_operational_period_count, working_operational_period_number, metadata'
      )
      .order('name')

    if (error || !data) {
      return []
    }

    return data.map((row) => ({
      workspaceId: row.id,
      kind: row.kind as WorkspaceKind,
      legacyId: row.legacy_id,
      name: row.name,
      icsPosition: 'Org Admin',
      icsPositions: ['Org Admin'],
      region: row.region ?? null,
      summary: row.summary ?? null,
      archivedAt: row.archived_at ?? null,
      ...mapAccessibleWorkspaceFields(row),
    }))
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      ics_position,
      workspace_member_positions (ics_position),
      workspace:workspaces (
        id,
        kind,
        legacy_id,
        name,
        region,
        summary,
        archived_at,
        workspace_format,
        incident_complexity,
        has_sequential_workflow,
        sequential_workflow_type,
        started_operational_period_count,
        working_operational_period_number,
        metadata
      )
    `
    )
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error || !data) {
    return []
  }

  return data
    .map((row) => {
      const workspaceRaw = row.workspace as
        | {
            id: string
            kind: WorkspaceKind
            legacy_id: number
            name: string
            region: string | null
            summary: string | null
            archived_at?: string | null
            workspace_format?: string | null
            incident_complexity?: string | null
            has_sequential_workflow?: boolean | null
            sequential_workflow_type?: string | null
            started_operational_period_count?: number | null
            working_operational_period_number?: number | null
            metadata?: unknown
          }
        | {
            id: string
            kind: WorkspaceKind
            legacy_id: number
            name: string
            region: string | null
            summary: string | null
            archived_at?: string | null
            workspace_format?: string | null
            incident_complexity?: string | null
            has_sequential_workflow?: boolean | null
            sequential_workflow_type?: string | null
            started_operational_period_count?: number | null
            working_operational_period_number?: number | null
            metadata?: unknown
          }[]
        | null
      const workspace = Array.isArray(workspaceRaw) ? workspaceRaw[0] : workspaceRaw
      if (!workspace) return null
      const memberPositions = (
        row as {
          ics_position?: string
          workspace_member_positions?: Array<{ ics_position: string }>
        }
      ).workspace_member_positions
      const icsPositions = mapMemberPositions({
        id: '',
        workspace_id: workspace.id,
        user_id: null,
        email: '',
        ics_position: (row as { ics_position?: string }).ics_position ?? '',
        status: 'active',
        invited_at: '',
        joined_at: null,
        workspace_member_positions: memberPositions,
      })
      return {
        workspaceId: workspace.id,
        kind: workspace.kind,
        legacyId: workspace.legacy_id,
        name: workspace.name,
        icsPosition: primaryIcsPosition(icsPositions),
        icsPositions,
        region: workspace.region ?? null,
        summary: workspace.summary ?? null,
        archivedAt: workspace.archived_at ?? null,
        ...mapAccessibleWorkspaceFields(workspace),
      }
    })
    .filter((entry): entry is AccessibleWorkspace => entry !== null)
}

export async function fetchWorkspacePermissions(
  workspaceId: string
): Promise<ResolvedWorkspacePermissions> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      positions: ['Incident Commander'],
      permissions: ['edit_ics201'],
      canEditIcs201Form: true,
    }
  }

  const { data, error } = await supabase.rpc('get_my_workspace_permissions', {
    p_workspace_id: workspaceId,
  })

  if (error || !data || typeof data !== 'object') {
    return {
      positions: [],
      permissions: [],
      canEditIcs201Form: false,
    }
  }

  const payload = data as {
    positions?: string[]
    permissions?: string[]
    can_edit_ics201_form?: boolean
  }

  return {
    positions: Array.isArray(payload.positions) ? payload.positions : [],
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    canEditIcs201Form: payload.can_edit_ics201_form === true,
  }
}

export async function resolveWorkspaceId(
  kind: WorkspaceKind,
  legacyId: number
): Promise<string | null> {
  const fallbackId = getSeededWorkspaceId(kind, legacyId)
  const supabase = getSupabaseClient()
  if (!supabase) return fallbackId

  const POSTGRES_INT_MAX = 2_147_483_647
  if (
    !Number.isFinite(legacyId) ||
    !Number.isInteger(legacyId) ||
    legacyId < 1 ||
    legacyId > POSTGRES_INT_MAX
  ) {
    return fallbackId
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('kind', kind)
    .eq('legacy_id', legacyId)
    .maybeSingle()

  if (error) {
    console.warn('resolveWorkspaceId failed; using seeded workspace id fallback.', error.message)
    return fallbackId
  }

  if (!data) {
    return fallbackId
  }

  return data.id
}

export function findAccessibleWorkspaceUuid(
  accessibleWorkspaces: AccessibleWorkspace[],
  kind: WorkspaceKind,
  legacyId: number
): string | null {
  return (
    accessibleWorkspaces.find(
      (workspace) => workspace.kind === kind && workspace.legacyId === legacyId
    )?.workspaceId ?? null
  )
}

export async function fetchWorkspaceRoster(workspaceId: string): Promise<WorkspaceRosterMember[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      id,
      workspace_id,
      user_id,
      email,
      ics_position,
      status,
      invited_at,
      joined_at,
      check_in_status,
      workspace_member_positions (ics_position)
    `
    )
    .eq('workspace_id', workspaceId)
    .neq('status', 'removed')
    .order('invited_at', { ascending: true })

  if (error || !data) {
    return []
  }

  return (data as DbWorkspaceMember[]).map(mapDbMember)
}

export async function removeWorkspaceRosterMember(memberId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('workspace_members')
    .update({ status: 'removed' })
    .eq('id', memberId)

  return !error
}

export async function inviteWorkspaceMember(params: {
  accessToken: string
  workspaceId: string
  email: string
  icsPositions: string[]
  password?: string
  confirmPasswordOverwrite?: boolean
  scheduleOnOpAdvance?: boolean
}): Promise<
  | { ok: true; warning?: string; method?: string; action?: 'created' | 'updated'; scheduleOnOpAdvance?: boolean }
  | { ok: false; message: string; code?: 'user_exists' | 'password_too_short' }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      email: params.email,
      icsPositions: params.icsPositions,
      redirectTo: getAcceptInviteUrl(params.workspaceId),
      ...(params.password ? { password: params.password } : {}),
      ...(params.confirmPasswordOverwrite ? { confirmPasswordOverwrite: true } : {}),
      ...(params.scheduleOnOpAdvance ? { scheduleOnOpAdvance: true } : {}),
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    message?: string
    emailWarning?: string
    code?: 'user_exists' | 'password_too_short'
    method?: string
    action?: 'created' | 'updated'
    scheduleOnOpAdvance?: boolean
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload.error ?? payload.message ?? 'Invite failed.',
      code: payload.code,
    }
  }

  if (payload.emailWarning) {
    return { ok: true, warning: payload.emailWarning, method: payload.method }
  }

  return {
    ok: true,
    method: payload.method,
    action: payload.action,
  }
}

export async function updateRosterMemberPositions(params: {
  accessToken: string
  memberId: string
  icsPositions: string[]
}): Promise<{ ok: true; icsPositions: string[] } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-roster-member-positions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      memberId: params.memberId,
      icsPositions: params.icsPositions,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    icsPositions?: string[]
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update roster positions.' }
  }

  return {
    ok: true,
    icsPositions: Array.isArray(payload.icsPositions) ? payload.icsPositions : params.icsPositions,
  }
}

export async function updateRosterMemberCheckInStatus(params: {
  accessToken: string
  workspaceId: string
  memberId: string
  checkInStatus: WorkspaceMemberCheckInStatus
}): Promise<{ ok: true; checkInStatus: WorkspaceMemberCheckInStatus } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-roster-member-check-in-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      memberId: params.memberId,
      checkInStatus: params.checkInStatus,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    checkInStatus?: WorkspaceMemberCheckInStatus
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update check-in status.' }
  }

  return {
    ok: true,
    checkInStatus: payload.checkInStatus ?? params.checkInStatus,
  }
}

export async function fetchWorkspacePositionPermissions(
  workspaceId: string
): Promise<PositionPermissionMap> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return buildDefaultPositionPermissionMap()
  }

  const [permissionsResult, customResult] = await Promise.all([
    supabase
      .from('workspace_position_permissions')
      .select('ics_position, permission')
      .eq('workspace_id', workspaceId),
    supabase.from('workspace_custom_positions').select('name').eq('workspace_id', workspaceId),
  ])

  if (permissionsResult.error || !permissionsResult.data) {
    return buildDefaultPositionPermissionMap()
  }

  const customPositions = (customResult.data ?? []).map((row: { name: string }) => ({
    id: row.name,
    name: row.name,
    reportsTo: '',
    sortOrder: 0,
    lifecycleStatus: 'active' as const,
  }))
  const catalog = buildWorkspacePositionCatalog(customPositions)

  return permissionsFromRows(
    permissionsResult.data as Array<{ ics_position: string; permission: string }>,
    catalog
  )
}

export async function setWorkspacePositionEditIcs201(
  workspaceId: string,
  icsPosition: string,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  if (enabled) {
    const { error } = await supabase.from('workspace_position_permissions').upsert(
      {
        workspace_id: workspaceId,
        ics_position: icsPosition,
        permission: WORKSPACE_PERMISSION_EDIT_ICS201,
      },
      { onConflict: 'workspace_id,ics_position,permission' }
    )
    if (error) {
      return { ok: false, message: error.message }
    }
    return { ok: true }
  }

  const { error } = await supabase
    .from('workspace_position_permissions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('ics_position', icsPosition)
    .eq('permission', WORKSPACE_PERMISSION_EDIT_ICS201)

  if (error) {
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

export async function fetchCanManageWorkspaceRoster(
  workspaceId: string,
  isOrgAdmin: boolean
): Promise<boolean> {
  if (isOrgAdmin) return true
  const supabase = getSupabaseClient()
  if (!supabase) return true

  const { data, error } = await supabase.rpc('current_user_is_roster_manager', {
    p_workspace_id: workspaceId,
  })

  if (error) {
    return false
  }

  return data === true
}

export type CreatedWorkspace = {
  workspaceId: string
  kind: WorkspaceKind
  legacyId: number
  name: string
  region: string | null
  summary: string | null
  workspaceFormat: string | null
  incidentComplexity: string | null
  hasSequentialWorkflow: boolean
  sequentialWorkflowType: string | null
}

export async function createWorkspace(params: {
  accessToken: string
  kind: WorkspaceKind
  name: string
  region?: string
  summary?: string
  workspaceFormat?: string
  incidentComplexity?: string
}): Promise<{ ok: true; workspace: CreatedWorkspace } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/create-workspace', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      kind: params.kind,
      name: params.name,
      region: params.region,
      summary: params.summary,
      workspaceFormat: params.workspaceFormat,
      incidentComplexity: params.incidentComplexity,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    workspace?: CreatedWorkspace
  }

  if (!response.ok || !payload.workspace) {
    return {
      ok: false,
      message: payload.error ?? 'Could not create workspace.',
    }
  }

  return { ok: true, workspace: payload.workspace }
}

export type UpdatedWorkspace = CreatedWorkspace & {
  metadata: WorkspaceMetadataRecord
}

export async function updateWorkspace(params: {
  accessToken: string
  workspaceId: string
  name: string
  region?: string | null
  summary?: string | null
  workspaceFormat?: string | null
  incidentComplexity?: string | null
  metadata?: WorkspaceMetadataRecord | null
}): Promise<{ ok: true; workspace: UpdatedWorkspace } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-workspace', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      name: params.name,
      region: params.region,
      summary: params.summary,
      workspaceFormat: params.workspaceFormat,
      incidentComplexity: params.incidentComplexity,
      metadata: params.metadata,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    workspace?: UpdatedWorkspace
  }

  if (!response.ok || !payload.workspace) {
    return {
      ok: false,
      message: payload.error ?? 'Could not update workspace.',
    }
  }

  return { ok: true, workspace: payload.workspace }
}

export async function setWorkspaceArchived(
  workspaceId: string,
  archived: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase.rpc('set_workspace_archived', {
    p_workspace_id: workspaceId,
    p_archived: archived,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export function canAccessLegacyWorkspace(
  accessibleWorkspaces: AccessibleWorkspace[],
  isOrgAdmin: boolean,
  kind: WorkspaceKind,
  legacyId: number,
  profileEmail?: string | null
): boolean {
  if (!isSupabaseConfigured) {
    return true
  }
  if (
    hasDefaultFullWorkspaceAccess(profileEmail) &&
    isDefaultLegacyWorkspace(kind, legacyId)
  ) {
    return true
  }
  if (isOrgAdmin) {
    return true
  }
  return accessibleWorkspaces.some(
    (workspace) => workspace.kind === kind && workspace.legacyId === legacyId
  )
}
