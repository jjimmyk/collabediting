import {
  DEFAULT_ASSET_ASSIGNMENT_WORKSPACE_NAME,
  DEFAULT_ASSIGNED_ATLANTIC_ASSET_KEYS,
} from '@/data/hub-asset-catalog'
import type { WorkspaceAssetAssignment } from '@/features/resources/types'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_ASSIGNMENTS_STORAGE_KEY = 'pratus-workspace-asset-assignments-v1'

type DbWorkspaceAssetAssignmentRow = {
  asset_key: string
  workspace_id: string
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
    workspaceId: defaultWorkspaceId,
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
    .select('asset_key, workspace_id')

  if (error) {
    throw error
  }

  return (data ?? []).map((row: DbWorkspaceAssetAssignmentRow) => ({
    assetKey: row.asset_key,
    workspaceId: row.workspace_id,
  }))
}

export async function assignAssetToWorkspace(
  assetKey: string,
  workspaceId: string,
  assignedByUserId: string | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = readLocalAssignments().filter((row) => row.assetKey !== assetKey)
    writeLocalAssignments([...current, { assetKey, workspaceId }])
    return
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    const current = readLocalAssignments().filter((row) => row.assetKey !== assetKey)
    writeLocalAssignments([...current, { assetKey, workspaceId }])
    return
  }

  const { error } = await supabase.from('workspace_asset_assignments').upsert(
    {
      asset_key: assetKey,
      workspace_id: workspaceId,
      assigned_by: assignedByUserId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'asset_key' }
  )

  if (error) {
    throw error
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
