import type { WorkspaceCustomPosition } from '@/features/roster/workspace-positions'
import {
  normalizePositionName,
  validateCustomPositionName,
  validateReportsToPosition,
  buildWorkspacePositionCatalog,
  wouldCreatePositionCycle,
} from '@/features/roster/workspace-positions'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_CUSTOM_POSITIONS_STORAGE_KEY = 'pratus-workspace-custom-positions-v1'

type DbWorkspaceCustomPositionRow = {
  id: string
  workspace_id: string
  name: string
  reports_to: string
  sort_order: number
  lifecycle_status?: string
  archived_at?: string | null
  activated_at?: string | null
}

function mapRow(row: DbWorkspaceCustomPositionRow): WorkspaceCustomPosition {
  return {
    id: row.id,
    name: row.name,
    reportsTo: row.reports_to,
    sortOrder: row.sort_order,
    lifecycleStatus:
      (row.lifecycle_status as WorkspaceCustomPosition['lifecycleStatus']) ?? 'active',
    archivedAt: row.archived_at ?? null,
    activatedAt: row.activated_at ?? null,
  }
}

function readLocalCustomPositions(): Record<string, WorkspaceCustomPosition[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LOCAL_CUSTOM_POSITIONS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, WorkspaceCustomPosition[]>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalCustomPositions(rows: Record<string, WorkspaceCustomPosition[]>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_CUSTOM_POSITIONS_STORAGE_KEY, JSON.stringify(rows))
}

export async function fetchWorkspaceCustomPositions(
  workspaceId: string
): Promise<WorkspaceCustomPosition[]> {
  if (!isSupabaseConfigured) {
    return readLocalCustomPositions()[workspaceId] ?? []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return readLocalCustomPositions()[workspaceId] ?? []
  }

  const { data, error } = await supabase
    .from('workspace_custom_positions')
    .select('id, workspace_id, name, reports_to, sort_order, lifecycle_status, archived_at, activated_at')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapRow(row as DbWorkspaceCustomPositionRow))
}

export async function createWorkspaceCustomPosition(params: {
  workspaceId: string
  name: string
  reportsTo: string
  createdByUserId: string | null
  existingCustomPositions?: WorkspaceCustomPosition[]
  lifecycleStatus?: WorkspaceCustomPosition['lifecycleStatus']
}): Promise<WorkspaceCustomPosition> {
  const existing = params.existingCustomPositions ?? (await fetchWorkspaceCustomPositions(params.workspaceId))
  const catalog = buildWorkspacePositionCatalog(existing)
  const normalizedName = normalizePositionName(params.name)
  const normalizedReportsTo = normalizePositionName(params.reportsTo)
  const lifecycleStatus = params.lifecycleStatus ?? 'active'

  const nameError = validateCustomPositionName(normalizedName, catalog)
  if (nameError) {
    throw new Error(nameError)
  }
  const reportsToError = validateReportsToPosition(normalizedReportsTo, catalog, normalizedName)
  if (reportsToError) {
    throw new Error(reportsToError)
  }

  if (!isSupabaseConfigured) {
    const next: WorkspaceCustomPosition = {
      id: `local-custom-${Date.now()}`,
      name: normalizedName,
      reportsTo: normalizedReportsTo,
      sortOrder: existing.length,
      lifecycleStatus,
    }
    const all = readLocalCustomPositions()
    all[params.workspaceId] = [...existing, next]
    writeLocalCustomPositions(all)
    return next
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('workspace_custom_positions')
    .insert({
      workspace_id: params.workspaceId,
      name: normalizedName,
      reports_to: normalizedReportsTo,
      sort_order: existing.length,
      lifecycle_status: lifecycleStatus,
      created_by: params.createdByUserId,
      updated_at: new Date().toISOString(),
    })
    .select('id, workspace_id, name, reports_to, sort_order, lifecycle_status, archived_at, activated_at')
    .single()

  if (error || !data) {
    throw error ?? new Error('Could not create custom position.')
  }

  return mapRow(data as DbWorkspaceCustomPositionRow)
}

function applyLocalCustomPositionRename(
  workspaceId: string,
  existing: WorkspaceCustomPosition[],
  oldName: string,
  newName: string
): WorkspaceCustomPosition[] {
  return existing.map((row) => {
    if (row.name === oldName) {
      return { ...row, name: newName }
    }
    if (row.reportsTo === oldName) {
      return { ...row, reportsTo: newName }
    }
    return row
  })
}

export async function updateWorkspaceCustomPosition(params: {
  workspaceId: string
  positionId: string
  name?: string
  reportsTo?: string
  accessToken?: string | null
  existingCustomPositions?: WorkspaceCustomPosition[]
}): Promise<{ position: WorkspaceCustomPosition; renamedFrom: string | null }> {
  const existing = params.existingCustomPositions ?? (await fetchWorkspaceCustomPositions(params.workspaceId))
  const target = existing.find((row) => row.id === params.positionId)
  if (!target) {
    throw new Error('Custom position not found.')
  }

  const catalog = buildWorkspacePositionCatalog(existing)
  const nextName =
    params.name !== undefined ? normalizePositionName(params.name) : target.name
  const nextReportsTo =
    params.reportsTo !== undefined ? normalizePositionName(params.reportsTo) : target.reportsTo

  if (nextName === target.name && nextReportsTo === target.reportsTo) {
    return { position: target, renamedFrom: null }
  }

  if (params.name !== undefined && nextName !== target.name) {
    const nameError = validateCustomPositionName(nextName, catalog, params.positionId)
    if (nameError) {
      throw new Error(nameError)
    }
  }

  const reportsToError = validateReportsToPosition(nextReportsTo, catalog, nextName)
  if (reportsToError) {
    throw new Error(reportsToError)
  }

  const draftPositions = existing.map((row) =>
    row.id === params.positionId ? { ...row, name: nextName, reportsTo: nextReportsTo } : row
  )
  if (wouldCreatePositionCycle(draftPositions, nextName, nextReportsTo)) {
    throw new Error('That reports-to choice would create a circular hierarchy.')
  }

  if (!isSupabaseConfigured) {
    let nextRows = existing.map((row) =>
      row.id === params.positionId ? { ...row, name: nextName, reportsTo: nextReportsTo } : row
    )
    if (nextName !== target.name) {
      nextRows = applyLocalCustomPositionRename(params.workspaceId, nextRows, target.name, nextName)
    }
    const all = readLocalCustomPositions()
    all[params.workspaceId] = nextRows
    writeLocalCustomPositions(all)
    const updated = nextRows.find((row) => row.id === params.positionId)
    if (!updated) {
      throw new Error('Could not update custom position.')
    }
    return { position: updated, renamedFrom: nextName !== target.name ? target.name : null }
  }

  if (!params.accessToken) {
    throw new Error('Sign in again to update positions.')
  }

  const response = await fetch('/api/update-custom-position', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      positionId: params.positionId,
      ...(params.name !== undefined ? { name: nextName } : {}),
      ...(params.reportsTo !== undefined ? { reportsTo: nextReportsTo } : {}),
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    position?: WorkspaceCustomPosition & { reportsTo?: string }
    renamedFrom?: string | null
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not update custom position.')
  }

  const row = payload.position
  if (!row) {
    throw new Error('Could not update custom position.')
  }

  return {
    position: {
      id: row.id,
      name: row.name,
      reportsTo: row.reportsTo ?? nextReportsTo,
      sortOrder: row.sortOrder,
      lifecycleStatus: row.lifecycleStatus,
      archivedAt: row.archivedAt,
      activatedAt: row.activatedAt,
    },
    renamedFrom: payload.renamedFrom ?? (nextName !== target.name ? target.name : null),
  }
}

export async function deleteWorkspaceCustomPosition(params: {
  workspaceId: string
  positionId: string
  existingCustomPositions?: WorkspaceCustomPosition[]
  assignedMemberCount?: number
  reportingAssetCount?: number
}): Promise<void> {
  const existing = params.existingCustomPositions ?? (await fetchWorkspaceCustomPositions(params.workspaceId))
  const target = existing.find((row) => row.id === params.positionId)
  if (!target) {
    throw new Error('Custom position not found.')
  }

  const hasChildren = existing.some((row) => row.reportsTo === target.name)
  if (hasChildren) {
    throw new Error('Remove or re-parent child positions before deleting this position.')
  }

  if ((params.assignedMemberCount ?? 0) > 0) {
    throw new Error('Unassign all members from this position before deleting it.')
  }

  if ((params.reportingAssetCount ?? 0) > 0) {
    throw new Error('Remove assets from the org chart that report to this position before deleting it.')
  }

  if (!isSupabaseConfigured) {
    const all = readLocalCustomPositions()
    all[params.workspaceId] = existing.filter((row) => row.id !== params.positionId)
    writeLocalCustomPositions(all)
    return
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase
    .from('workspace_custom_positions')
    .delete()
    .eq('id', params.positionId)
    .eq('workspace_id', params.workspaceId)

  if (error) {
    throw error
  }
}

export async function updateWorkspaceCustomPositionLifecycleStatus(params: {
  workspaceId: string
  positionId: string
  lifecycleStatus: WorkspaceCustomPosition['lifecycleStatus']
}): Promise<WorkspaceCustomPosition> {
  if (params.lifecycleStatus === 'archived') {
    throw new Error('Use operational period advance to archive positions.')
  }

  if (!isSupabaseConfigured) {
    throw new Error('Position lifecycle requires Supabase persistence.')
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('workspace_custom_positions')
    .update({
      lifecycle_status: params.lifecycleStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.positionId)
    .eq('workspace_id', params.workspaceId)
    .select('id, workspace_id, name, reports_to, sort_order, lifecycle_status, archived_at, activated_at')
    .single()

  if (error || !data) {
    throw error ?? new Error('Could not update custom position lifecycle.')
  }

  return mapRow(data as DbWorkspaceCustomPositionRow)
}
