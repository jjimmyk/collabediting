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
  templateSlug: string | null
} | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { getSupabaseClient } = await import('@/lib/supabase')
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('workspace_roster_plans')
    .select('effect_timing, applied_at, draft_plan, roster_templates(name, slug)')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error || !data) return null

  const template = data.roster_templates as
    | { name?: string; slug?: string }
    | { name?: string; slug?: string }[]
    | null
  const templateRow = Array.isArray(template) ? template[0] : template
  const draftPlan = data.draft_plan as { templateSlug?: string } | null

  return {
    effectTiming: data.effect_timing as 'immediate' | 'op_period_1',
    appliedAt: data.applied_at,
    templateName: templateRow?.name ?? 'Roster template',
    templateSlug: templateRow?.slug ?? draftPlan?.templateSlug ?? null,
  }
}
