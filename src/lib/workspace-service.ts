import { getAcceptInviteUrl } from '@/lib/app-url'
import {
  hasDefaultFullWorkspaceAccess,
  isDefaultLegacyWorkspace,
} from '@/lib/default-roster'
import { getSeededWorkspaceId } from '@/lib/workspace-ids'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  AccessibleWorkspace,
  DbWorkspaceMember,
  UserProfile,
  WorkspaceKind,
  WorkspaceRosterMember,
} from '@/lib/workspace-types'

function formatMemberDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapDbMember(row: DbWorkspaceMember): WorkspaceRosterMember {
  return {
    id: row.id,
    email: row.email,
    icsPosition: row.ics_position,
    status: row.status,
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

export async function fetchAccessibleWorkspaces(
  userId: string,
  isOrgAdmin: boolean
): Promise<AccessibleWorkspace[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  if (isOrgAdmin) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, kind, legacy_id, name, region, summary')
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
      region: row.region ?? null,
      summary: row.summary ?? null,
    }))
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      ics_position,
      workspace:workspaces (
        id,
        kind,
        legacy_id,
        name,
        region,
        summary
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
          }
        | {
            id: string
            kind: WorkspaceKind
            legacy_id: number
            name: string
            region: string | null
            summary: string | null
          }[]
        | null
      const workspace = Array.isArray(workspaceRaw) ? workspaceRaw[0] : workspaceRaw
      if (!workspace) return null
      return {
        workspaceId: workspace.id,
        kind: workspace.kind,
        legacyId: workspace.legacy_id,
        name: workspace.name,
        icsPosition: row.ics_position as string,
        region: workspace.region ?? null,
        summary: workspace.summary ?? null,
      }
    })
    .filter((entry): entry is AccessibleWorkspace => entry !== null)
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
    .select('id, workspace_id, user_id, email, ics_position, status, invited_at, joined_at')
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
  icsPosition: string
}): Promise<
  { ok: true; warning?: string } | { ok: false; message: string }
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
      icsPosition: params.icsPosition,
      redirectTo: getAcceptInviteUrl(params.workspaceId),
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    message?: string
    emailWarning?: string
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? payload.message ?? 'Invite failed.' }
  }

  if (payload.emailWarning) {
    return { ok: true, warning: payload.emailWarning }
  }

  return { ok: true }
}

export type CreatedWorkspace = {
  workspaceId: string
  kind: WorkspaceKind
  legacyId: number
  name: string
  region: string | null
  summary: string | null
}

export async function createWorkspace(params: {
  accessToken: string
  kind: WorkspaceKind
  name: string
  region?: string
  summary?: string
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
