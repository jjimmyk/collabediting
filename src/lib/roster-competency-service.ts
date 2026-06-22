import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export type RosterCompetencyTarget =
  | {
      kind: 'member_position'
      memberId: string
      positionName: string
    }
  | {
      kind: 'single_resource_member'
      memberId: string
    }
  | {
      kind: 'pending_single_resource'
      memberId: string
    }
  | {
      kind: 'scheduled_member'
      memberId: string
      positionName: string
      scheduleAction: 'assign_on_op_advance' | 'unassign_on_op_advance'
    }
  | {
      kind: 'position_asset'
      positionName: string
      assetKey: string
    }
  | {
      kind: 'scheduled_position_asset'
      positionName: string
      assetKey: string
      scheduleAction: 'assign_on_op_advance' | 'unassign_on_op_advance'
    }
  | {
      kind: 'org_chart_asset'
      assetKey: string
    }
  | {
      kind: 'pending_org_chart_asset'
      assetKey: string
    }

const LOCAL_CATALOG_PREFIX = 'pratus-roster-competency-catalog:'

export function readLocalCompetencyCatalog(organizationId: string | null): string[] {
  if (!organizationId || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`${LOCAL_CATALOG_PREFIX}${organizationId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
  } catch {
    return []
  }
}

export function writeLocalCompetencyCatalog(organizationId: string | null, labels: string[]): void {
  if (!organizationId || typeof window === 'undefined') return
  const unique = [...new Set(labels.map((label) => label.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
  window.localStorage.setItem(`${LOCAL_CATALOG_PREFIX}${organizationId}`, JSON.stringify(unique))
}

export async function fetchOrganizationCompetencyFunctions(params: {
  accessToken: string
  workspaceId?: string
  organizationId?: string | null
}): Promise<{ ok: true; labels: string[] } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: true,
      labels: readLocalCompetencyCatalog(params.organizationId ?? null),
    }
  }

  const query = new URLSearchParams()
  if (params.workspaceId) query.set('workspaceId', params.workspaceId)
  if (params.organizationId) query.set('organizationId', params.organizationId)

  const response = await fetch(`/api/list-organization-competency-functions?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    labels?: string[]
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not load competency options.' }
  }

  return {
    ok: true,
    labels: Array.isArray(payload.labels) ? payload.labels : [],
  }
}

export async function updateRosterCompetencyFunction(params: {
  accessToken: string
  workspaceId: string
  competencyFunction: string | null
  target: RosterCompetencyTarget
  organizationId?: string | null
}): Promise<
  { ok: true; competencyFunction: string | null; labels?: string[] } | { ok: false; message: string }
> {
  const normalized =
    typeof params.competencyFunction === 'string' && params.competencyFunction.trim().length > 0
      ? params.competencyFunction.trim()
      : null

  if (!isSupabaseConfigured) {
    if (params.organizationId && normalized) {
      const current = readLocalCompetencyCatalog(params.organizationId)
      writeLocalCompetencyCatalog(params.organizationId, [...current, normalized])
    }
    return { ok: true, competencyFunction: normalized }
  }

  const response = await fetch('/api/update-roster-competency-function', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      competencyFunction: normalized,
      target: params.target,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    competencyFunction?: string | null
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update competency/function.' }
  }

  return {
    ok: true,
    competencyFunction:
      typeof payload.competencyFunction === 'string' || payload.competencyFunction === null
        ? payload.competencyFunction
        : normalized,
  }
}

export function memberPositionCompetencyKey(memberId: string, positionName: string): string {
  return `${memberId}::${positionName}`
}

export function scheduledMemberCompetencyKey(
  memberId: string,
  positionName: string,
  scheduleAction: 'assign_on_op_advance' | 'unassign_on_op_advance'
): string {
  return `${memberId}::${positionName}::${scheduleAction}`
}

export function scheduledAssetCompetencyKey(
  assetKey: string,
  positionName: string,
  scheduleAction: 'assign_on_op_advance' | 'unassign_on_op_advance'
): string {
  return `${assetKey}::${positionName}::${scheduleAction}`
}
