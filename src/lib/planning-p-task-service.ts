import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

type DbPlanningPTaskCompletionRow = {
  task_id: string
}

export async function fetchPlanningPTaskCompletions(
  workspaceId: string,
  userId: string,
  operationalPeriodNumber: number
): Promise<Record<string, boolean>> {
  const supabase = getSupabaseClient()
  if (!supabase || !isSupabaseConfigured) {
    return {}
  }

  const { data, error } = await supabase
    .from('planning_p_task_completions')
    .select('task_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('operational_period_number', operationalPeriodNumber)

  if (error) {
    throw new Error(error.message)
  }

  const completions: Record<string, boolean> = {}
  for (const row of (data ?? []) as DbPlanningPTaskCompletionRow[]) {
    completions[row.task_id] = true
  }
  return completions
}

export async function setPlanningPTaskCompletion(
  workspaceId: string,
  userId: string,
  operationalPeriodNumber: number,
  taskId: string,
  completed: boolean
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase || !isSupabaseConfigured) {
    return
  }

  if (completed) {
    const { error } = await supabase.from('planning_p_task_completions').upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        operational_period_number: operationalPeriodNumber,
        task_id: taskId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,user_id,operational_period_number,task_id' }
    )

    if (error) {
      throw new Error(error.message)
    }
    return
  }

  const { error } = await supabase
    .from('planning_p_task_completions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('operational_period_number', operationalPeriodNumber)
    .eq('task_id', taskId)

  if (error) {
    throw new Error(error.message)
  }
}
