import { isSupabaseConfigured } from '@/lib/supabase'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'

export async function applyWorkspaceRosterPlan(params: {
  accessToken: string
  workspaceId: string
  draftPlan: BuildTeamRosterDraft
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/apply-workspace-roster-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      draftPlan: params.draftPlan,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    return {
      ok: false,
      message: payload.error ?? 'Could not apply workspace roster plan.',
    }
  }

  return { ok: true }
}

export async function fetchWorkspaceRosterPlan(
  workspaceId: string
): Promise<{
  effectTiming: 'immediate' | 'op_period_1'
  appliedAt: string | null
  templateName: string
} | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { getSupabaseClient } = await import('@/lib/supabase')
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('workspace_roster_plans')
    .select('effect_timing, applied_at, roster_templates(name)')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error || !data) return null

  const template = data.roster_templates as { name?: string } | { name?: string }[] | null
  const templateName = Array.isArray(template)
    ? template[0]?.name
    : template?.name

  return {
    effectTiming: data.effect_timing as 'immediate' | 'op_period_1',
    appliedAt: data.applied_at,
    templateName: templateName ?? 'Roster template',
  }
}
