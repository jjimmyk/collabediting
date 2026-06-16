import type { StandardPositionLifecycleRow } from '@/lib/operational-period-roster-types'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

type DbStandardPositionLifecycleRow = {
  position_name: string
  op_advance_label: 'retire_on_op_advance'
  archived_at: string | null
}

function mapRow(row: DbStandardPositionLifecycleRow): StandardPositionLifecycleRow {
  return {
    positionName: row.position_name,
    opAdvanceLabel: row.op_advance_label,
    archivedAt: row.archived_at,
  }
}

export async function fetchWorkspaceStandardPositionLifecycle(
  workspaceId: string
): Promise<StandardPositionLifecycleRow[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('workspace_standard_position_lifecycle')
    .select('position_name, op_advance_label, archived_at')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw error
  }

  return ((data ?? []) as DbStandardPositionLifecycleRow[]).map(mapRow)
}

export async function setStandardPositionRetireOnOpAdvance(params: {
  workspaceId: string
  positionName: string
  enabled: boolean
}): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Position lifecycle requires Supabase persistence.')
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  if (!params.enabled) {
    const { error } = await supabase
      .from('workspace_standard_position_lifecycle')
      .delete()
      .eq('workspace_id', params.workspaceId)
      .eq('position_name', params.positionName)

    if (error) {
      throw error
    }
    return
  }

  const { error } = await supabase.from('workspace_standard_position_lifecycle').upsert(
    {
      workspace_id: params.workspaceId,
      position_name: params.positionName,
      op_advance_label: 'retire_on_op_advance',
      archived_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,position_name' }
  )

  if (error) {
    throw error
  }
}
