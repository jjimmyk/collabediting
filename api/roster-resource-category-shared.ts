import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchWorkspacePositionAllowlist } from './roster-shared.js'
import type { ResourceCategoryLifecycle } from '../src/lib/workspace-resource-category-types.js'

export type DbResourceCategoryRow = {
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

export async function fetchWorkspaceResourceCategories(
  admin: SupabaseClient,
  workspaceId: string
): Promise<DbResourceCategoryRow[]> {
  const { data, error } = await admin
    .from('workspace_position_resource_categories')
    .select(
      'id, workspace_id, position_name, name, lifecycle, filled_member_id, filled_asset_key, sort_order, created_at, created_by'
    )
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as DbResourceCategoryRow[]
}

export async function createWorkspaceResourceCategory(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    name: string
    lifecycle: ResourceCategoryLifecycle
    createdBy: string | null
  }
): Promise<DbResourceCategoryRow> {
  const positionName = params.positionName.trim()
  const name = params.name.trim()

  if (!positionName || !name) {
    throw new Error('positionName and name are required.')
  }

  const allowed = await fetchWorkspacePositionAllowlist(admin, params.workspaceId)
  if (!allowed.has(positionName)) {
    throw new Error('Invalid position name.')
  }

  const { data, error } = await admin
    .from('workspace_position_resource_categories')
    .insert({
      workspace_id: params.workspaceId,
      position_name: positionName,
      name,
      lifecycle: params.lifecycle,
      created_by: params.createdBy,
    })
    .select(
      'id, workspace_id, position_name, name, lifecycle, filled_member_id, filled_asset_key, sort_order, created_at, created_by'
    )
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A resource category with this name already exists for this section.')
    }
    throw new Error(error.message)
  }

  return data as DbResourceCategoryRow
}

export async function updateWorkspaceResourceCategory(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    categoryId: string
    name?: string
    filledMemberId?: string | null
    filledAssetKey?: string | null
  }
): Promise<DbResourceCategoryRow> {
  const patch: Record<string, unknown> = {}

  if (params.name !== undefined) {
    const name = params.name.trim()
    if (!name) {
      throw new Error('Resource category name cannot be empty.')
    }
    patch.name = name
  }

  if (params.filledMemberId !== undefined) {
    patch.filled_member_id = params.filledMemberId
    if (params.filledMemberId) {
      patch.filled_asset_key = null
    }
  }

  if (params.filledAssetKey !== undefined) {
    patch.filled_asset_key = params.filledAssetKey
    if (params.filledAssetKey) {
      patch.filled_member_id = null
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new Error('No updates provided.')
  }

  const { data, error } = await admin
    .from('workspace_position_resource_categories')
    .update(patch)
    .eq('workspace_id', params.workspaceId)
    .eq('id', params.categoryId)
    .select(
      'id, workspace_id, position_name, name, lifecycle, filled_member_id, filled_asset_key, sort_order, created_at, created_by'
    )
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A resource category with this name already exists for this section.')
    }
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Resource category not found.')
  }

  return data as DbResourceCategoryRow
}

export async function deleteWorkspaceResourceCategory(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    categoryId: string
  }
): Promise<void> {
  const { error } = await admin
    .from('workspace_position_resource_categories')
    .delete()
    .eq('workspace_id', params.workspaceId)
    .eq('id', params.categoryId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function applyResourceCategoriesOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const { error: deleteError } = await admin
    .from('workspace_position_resource_categories')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('lifecycle', 'scheduled_unassign')

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const { error: promoteError } = await admin
    .from('workspace_position_resource_categories')
    .update({ lifecycle: 'active' })
    .eq('workspace_id', workspaceId)
    .eq('lifecycle', 'scheduled_assign')

  if (promoteError) {
    throw new Error(promoteError.message)
  }
}

export async function clearResourceCategoriesForPosition(
  admin: SupabaseClient,
  workspaceId: string,
  positionName: string
): Promise<void> {
  const { error } = await admin
    .from('workspace_position_resource_categories')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('position_name', positionName)

  if (error) {
    throw new Error(error.message)
  }
}
