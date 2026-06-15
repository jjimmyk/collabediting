import type { WorkspaceCustomPosition } from '@/features/roster/workspace-positions'
import {
  normalizePositionName,
  validateCustomPositionName,
  validateReportsToPosition,
  buildWorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_CUSTOM_POSITIONS_STORAGE_KEY = 'pratus-workspace-custom-positions-v1'

type DbWorkspaceCustomPositionRow = {
  id: string
  workspace_id: string
  name: string
  reports_to: string
  sort_order: number
}

function mapRow(row: DbWorkspaceCustomPositionRow): WorkspaceCustomPosition {
  return {
    id: row.id,
    name: row.name,
    reportsTo: row.reports_to,
    sortOrder: row.sort_order,
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
    .select('id, workspace_id, name, reports_to, sort_order')
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
}): Promise<WorkspaceCustomPosition> {
  const existing = params.existingCustomPositions ?? (await fetchWorkspaceCustomPositions(params.workspaceId))
  const catalog = buildWorkspacePositionCatalog(existing)
  const normalizedName = normalizePositionName(params.name)
  const normalizedReportsTo = normalizePositionName(params.reportsTo)

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
      created_by: params.createdByUserId,
      updated_at: new Date().toISOString(),
    })
    .select('id, workspace_id, name, reports_to, sort_order')
    .single()

  if (error || !data) {
    throw error ?? new Error('Could not create custom position.')
  }

  return mapRow(data as DbWorkspaceCustomPositionRow)
}

export async function deleteWorkspaceCustomPosition(params: {
  workspaceId: string
  positionId: string
  existingCustomPositions?: WorkspaceCustomPosition[]
  assignedMemberCount?: number
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
