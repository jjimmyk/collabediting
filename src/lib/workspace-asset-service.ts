import {
  DEFAULT_ASSET_ASSIGNMENT_WORKSPACE_NAME,
  DEFAULT_ASSIGNED_ATLANTIC_ASSET_KEYS,
} from '@/data/hub-asset-catalog'
import type { WorkspaceAssetAssignment } from '@/features/resources/types'
import { normalizePositionName } from '@/features/roster/workspace-positions'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_ASSIGNMENTS_STORAGE_KEY = 'pratus-workspace-asset-assignments-v1'

type DbWorkspaceAssetAssignmentRow = {
  asset_key: string
  workspace_id: string
  org_chart_reports_to: string | null
  org_chart_sort_order: number | null
  ics204_document_id: string | null
  point_of_contact_member_id: string | null
}

function mapAssignmentRow(row: DbWorkspaceAssetAssignmentRow): WorkspaceAssetAssignment {
  return {
    assetKey: row.asset_key,
    workspaceId: row.workspace_id,
    orgChartReportsTo: row.org_chart_reports_to,
    orgChartSortOrder: row.org_chart_sort_order ?? 0,
    ics204DocumentId: row.ics204_document_id,
    pointOfContactMemberId: row.point_of_contact_member_id,
  }
}

function readLocalAssignments(): WorkspaceAssetAssignment[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_ASSIGNMENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WorkspaceAssetAssignment[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalAssignments(rows: WorkspaceAssetAssignment[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(rows))
}

function upsertLocalAssignment(row: WorkspaceAssetAssignment): void {
  const current = readLocalAssignments().filter((entry) => entry.assetKey !== row.assetKey)
  writeLocalAssignments([...current, row])
}

export function buildDefaultAssetAssignments(
  workspaceIdByName: Record<string, string>
): WorkspaceAssetAssignment[] {
  const candidateNames = [
    DEFAULT_ASSET_ASSIGNMENT_WORKSPACE_NAME,
    'Hurricane Edgar — Gulf Coast Asset Protection & Shutdown',
  ]

  let defaultWorkspaceId: string | undefined
  for (const name of candidateNames) {
    if (workspaceIdByName[name]) {
      defaultWorkspaceId = workspaceIdByName[name]
      break
    }
  }

  if (!defaultWorkspaceId) {
    const fuzzyMatch = Object.entries(workspaceIdByName).find(([name]) =>
      name.toLowerCase().includes('hurricane edgar') && name.toLowerCase().includes('gulf coast')
    )
    defaultWorkspaceId = fuzzyMatch?.[1]
  }

  if (!defaultWorkspaceId) {
    return []
  }

  return DEFAULT_ASSIGNED_ATLANTIC_ASSET_KEYS.map((assetKey) => ({
    assetKey,
    workspaceId: defaultWorkspaceId!,
    orgChartReportsTo: null,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
  }))
}

export async function fetchAllAssetAssignments(): Promise<WorkspaceAssetAssignment[]> {
  if (!isSupabaseConfigured) {
    return readLocalAssignments()
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return readLocalAssignments()
  }

  const { data, error } = await supabase
    .from('workspace_asset_assignments')
    .select('asset_key, workspace_id, org_chart_reports_to, org_chart_sort_order, ics204_document_id, point_of_contact_member_id')

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapAssignmentRow(row as DbWorkspaceAssetAssignmentRow))
}

export async function assignAssetToWorkspace(
  assetKey: string,
  workspaceId: string,
  assignedByUserId: string | null
): Promise<void> {
  const existing = (await fetchAllAssetAssignments()).find((row) => row.assetKey === assetKey)
  const preserveOrgChart =
    existing?.workspaceId === workspaceId
      ? {
          orgChartReportsTo: existing.orgChartReportsTo ?? null,
          orgChartSortOrder: existing.orgChartSortOrder ?? 0,
        }
      : {
          orgChartReportsTo: null,
          orgChartSortOrder: 0,
        }
  const preserveIcs204 =
    existing?.workspaceId === workspaceId ? (existing.ics204DocumentId ?? null) : null

  if (!isSupabaseConfigured) {
    upsertLocalAssignment({
      assetKey,
      workspaceId,
      ...preserveOrgChart,
      ics204DocumentId: preserveIcs204,
    })
    return
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    upsertLocalAssignment({
      assetKey,
      workspaceId,
      ...preserveOrgChart,
      ics204DocumentId: preserveIcs204,
    })
    return
  }

  const { error } = await supabase.from('workspace_asset_assignments').upsert(
    {
      asset_key: assetKey,
      workspace_id: workspaceId,
      assigned_by: assignedByUserId,
      org_chart_reports_to: preserveOrgChart.orgChartReportsTo,
      org_chart_sort_order: preserveOrgChart.orgChartSortOrder,
      ics204_document_id: preserveIcs204,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'asset_key' }
  )

  if (error) {
    throw error
  }
}

export async function setAssetOrgChartPlacement(
  assetKey: string,
  reportsTo: string | null,
  sortOrder = 0
): Promise<void> {
  const normalizedReportsTo = reportsTo ? normalizePositionName(reportsTo) : null
  const assignments = await fetchAllAssetAssignments()
  const existing = assignments.find((row) => row.assetKey === assetKey)
  if (!existing) {
    throw new Error('Assign the asset to a workspace before placing it on the org chart.')
  }

  const nextRow: WorkspaceAssetAssignment = {
    ...existing,
    orgChartReportsTo: normalizedReportsTo,
    orgChartSortOrder: sortOrder,
  }

  if (!isSupabaseConfigured) {
    upsertLocalAssignment(nextRow)
    return
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    upsertLocalAssignment(nextRow)
    return
  }

  const { error } = await supabase
    .from('workspace_asset_assignments')
    .update({
      org_chart_reports_to: normalizedReportsTo,
      org_chart_sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('asset_key', assetKey)

  if (error) {
    throw error
  }
}

export async function setAssetIcs204Attachment(
  assetKey: string,
  documentId: string | null
): Promise<void> {
  const assignments = await fetchAllAssetAssignments()
  const existing = assignments.find((row) => row.assetKey === assetKey)
  if (!existing) {
    if (documentId === null) {
      return
    }
    throw new Error('Assign the asset to a workspace before attaching it to an ICS-204.')
  }

  const nextRow: WorkspaceAssetAssignment = {
    ...existing,
    ics204DocumentId: documentId,
  }

  if (!isSupabaseConfigured) {
    upsertLocalAssignment(nextRow)
    return
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    upsertLocalAssignment(nextRow)
    return
  }

  const { error } = await supabase
    .from('workspace_asset_assignments')
    .update({
      ics204_document_id: documentId,
      updated_at: new Date().toISOString(),
    })
    .eq('asset_key', assetKey)

  if (error) {
    throw error
  }
}

export async function syncIcs204ResourceAttachmentsForDocument(
  workspaceId: string,
  documentId: string,
  assetKeys: string[]
): Promise<void> {
  const assignments = await fetchAllAssetAssignments()
  const workspaceAssignments = assignments.filter((row) => row.workspaceId === workspaceId)
  const assetKeySet = new Set(assetKeys)

  for (const row of workspaceAssignments) {
    if (row.ics204DocumentId === documentId && !assetKeySet.has(row.assetKey)) {
      await setAssetIcs204Attachment(row.assetKey, null)
    }
  }

  for (const assetKey of assetKeys) {
    const assignment = workspaceAssignments.find((row) => row.assetKey === assetKey)
    if (assignment && assignment.ics204DocumentId !== documentId) {
      await setAssetIcs204Attachment(assetKey, documentId)
    }
  }
}

export async function unassignAsset(assetKey: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeLocalAssignments(readLocalAssignments().filter((row) => row.assetKey !== assetKey))
    return
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    writeLocalAssignments(readLocalAssignments().filter((row) => row.assetKey !== assetKey))
    return
  }

  const { error } = await supabase
    .from('workspace_asset_assignments')
    .delete()
    .eq('asset_key', assetKey)

  if (error) {
    throw error
  }
}

export async function seedDefaultAssetAssignmentsIfEmpty(
  workspaceIdByName: Record<string, string>
): Promise<WorkspaceAssetAssignment[]> {
  const existing = await fetchAllAssetAssignments()
  if (existing.length > 0) {
    return existing
  }

  const defaults = buildDefaultAssetAssignments(workspaceIdByName)
  for (const row of defaults) {
    await assignAssetToWorkspace(row.assetKey, row.workspaceId, null)
  }

  return defaults.length > 0 ? defaults : existing
}

export async function replaceAllLocalAssetAssignments(
  rows: WorkspaceAssetAssignment[]
): Promise<void> {
  writeLocalAssignments(rows)
}

export async function countAssetsReportingToPositionName(
  workspaceId: string,
  positionName: string
): Promise<number> {
  const normalized = normalizePositionName(positionName).toLowerCase()
  const assignments = await fetchAllAssetAssignments()
  return assignments.filter(
    (row) =>
      row.workspaceId === workspaceId &&
      (row.orgChartReportsTo ?? '').toLowerCase() === normalized
  ).length
}
