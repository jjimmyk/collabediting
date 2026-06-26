import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  ResourceCategoryLifecycle,
  WorkspaceResourceCategoryRow,
} from '@/lib/workspace-resource-category-types'

type DbResourceCategoryRow = {
  id: string
  workspace_id: string
  position_name: string
  name: string
  lifecycle: ResourceCategoryLifecycle
  filled_member_id: string | null
  filled_asset_key: string | null
  sort_order: number
  created_at: string
  created_by: string | null
}

function mapDbResourceCategoryRow(row: DbResourceCategoryRow): WorkspaceResourceCategoryRow {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    positionName: row.position_name,
    name: row.name,
    lifecycle: row.lifecycle,
    filledMemberId: row.filled_member_id,
    filledAssetKey: row.filled_asset_key,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

export async function fetchWorkspaceResourceCategories(
  workspaceId: string
): Promise<WorkspaceResourceCategoryRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_position_resource_categories')
    .select(
      'id, workspace_id, position_name, name, lifecycle, filled_member_id, filled_asset_key, sort_order, created_at, created_by'
    )
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error || !data) {
    return []
  }

  return (data as DbResourceCategoryRow[]).map(mapDbResourceCategoryRow)
}

export async function manageWorkspaceResourceCategory(params: {
  accessToken: string
  workspaceId: string
  action: 'create' | 'update' | 'delete'
  categoryId?: string
  positionName?: string
  name?: string
  lifecycle?: ResourceCategoryLifecycle
  filledMemberId?: string | null
  filledAssetKey?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/manage-workspace-resource-category', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update resource category.' }
  }

  return { ok: true }
}

export async function createWorkspaceResourceCategory(params: {
  accessToken: string
  workspaceId: string
  positionName: string
  name: string
  lifecycle: ResourceCategoryLifecycle
}): Promise<{ ok: true } | { ok: false; message: string }> {
  return manageWorkspaceResourceCategory({ ...params, action: 'create' })
}

export async function updateWorkspaceResourceCategoryFill(params: {
  accessToken: string
  workspaceId: string
  categoryId: string
  filledMemberId?: string | null
  filledAssetKey?: string | null
  name?: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  return manageWorkspaceResourceCategory({ ...params, action: 'update' })
}

export async function deleteWorkspaceResourceCategory(params: {
  accessToken: string
  workspaceId: string
  categoryId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  return manageWorkspaceResourceCategory({ ...params, action: 'delete' })
}
