import type { SupabaseClient } from '@supabase/supabase-js'
import { WORKSPACE_ROSTER_POSITIONS } from '../src/lib/ics-positions.js'
import type { BuildTeamRosterDraft } from '../src/features/roster/roster-template-types.js'
import {
  addIcsWorkspaceMemberWithEffectiveWhen,
  addSingleResourceWorkspaceMemberWithEffectiveWhen,
  provisionIcsWorkspaceMemberWithEffectiveWhen,
  provisionSingleResourceMemberWithEffectiveWhen,
} from './roster-member-add-shared.js'

type DbRosterTemplateRow = {
  id: string
  slug: string
  name: string
  definition: {
    positions?: string[]
    singleResourceSlots?: Array<{ label: string; reportsTo: string }>
  }
}

type DbRosterPlanRow = {
  workspace_id: string
  roster_template_id: string
  effect_timing: 'immediate' | 'op_period_1'
  draft_plan: BuildTeamRosterDraft
  applied_at: string | null
  invites_sent_at: string | null
  roster_templates?: DbRosterTemplateRow | DbRosterTemplateRow[] | null
}

export async function loadRosterTemplateBySlug(
  admin: SupabaseClient,
  slug: string
): Promise<DbRosterTemplateRow | null> {
  const { data, error } = await admin
    .from('roster_templates')
    .select('id, slug, name, definition')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as DbRosterTemplateRow | null) ?? null
}

export async function loadDefaultRosterTemplate(
  admin: SupabaseClient
): Promise<DbRosterTemplateRow> {
  const { data, error } = await admin
    .from('roster_templates')
    .select('id, slug, name, definition')
    .eq('is_default', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Default roster template is not configured.')
  }

  return data as DbRosterTemplateRow
}

export async function loadUnappliedRosterPlan(
  admin: SupabaseClient,
  workspaceId: string
): Promise<DbRosterPlanRow | null> {
  const { data, error } = await admin
    .from('workspace_roster_plans')
    .select(
      'workspace_id, roster_template_id, effect_timing, draft_plan, applied_at, invites_sent_at, roster_templates(id, slug, name, definition)'
    )
    .eq('workspace_id', workspaceId)
    .is('applied_at', null)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as DbRosterPlanRow | null) ?? null
}

async function upsertArchivedStandardPositions(
  admin: SupabaseClient,
  workspaceId: string,
  archivedPositions: string[]
): Promise<void> {
  if (archivedPositions.length === 0) return

  const timestamp = new Date().toISOString()
  const { error } = await admin.from('workspace_standard_position_lifecycle').upsert(
    archivedPositions.map((positionName) => ({
      workspace_id: workspaceId,
      position_name: positionName,
      op_advance_label: 'retire_on_op_advance',
      archived_at: timestamp,
      updated_at: timestamp,
    })),
    { onConflict: 'workspace_id,position_name' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function clearArchivedStandardPositions(
  admin: SupabaseClient,
  workspaceId: string,
  visiblePositions: string[]
): Promise<void> {
  if (visiblePositions.length === 0) return

  const { error } = await admin
    .from('workspace_standard_position_lifecycle')
    .delete()
    .eq('workspace_id', workspaceId)
    .in('position_name', visiblePositions)

  if (error) {
    throw new Error(error.message)
  }
}

async function replaceSingleResourceSlots(
  admin: SupabaseClient,
  workspaceId: string,
  slots: Array<{ label: string; reportsTo: string }>
): Promise<void> {
  const { error: deleteError } = await admin
    .from('workspace_roster_single_resource_slots')
    .delete()
    .eq('workspace_id', workspaceId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (slots.length === 0) return

  const { error: insertError } = await admin.from('workspace_roster_single_resource_slots').insert(
    slots.map((slot, index) => ({
      workspace_id: workspaceId,
      label: slot.label,
      reports_to: slot.reportsTo,
      sort_order: index,
    }))
  )

  if (insertError) {
    throw new Error(insertError.message)
  }
}

async function upsertCustomPositionsFromDraft(
  admin: SupabaseClient,
  workspaceId: string,
  draft: BuildTeamRosterDraft,
  invitedBy: string
): Promise<void> {
  for (const [index, position] of draft.customPositions.entries()) {
    const { error } = await admin.from('workspace_custom_positions').insert({
      workspace_id: workspaceId,
      name: position.name,
      reports_to: position.reportsTo,
      sort_order: index,
      lifecycle_status: 'active',
      created_by: invitedBy,
    })

    if (error && !error.message.includes('duplicate')) {
      throw new Error(error.message)
    }
  }
}

async function upsertPositionSettingsFromDraft(
  admin: SupabaseClient,
  workspaceId: string,
  draft: BuildTeamRosterDraft
): Promise<void> {
  for (const positionName of draft.visibleStandardPositions) {
    const settings = draft.positionSettings[positionName]
    const { error } = await admin.from('workspace_position_settings').upsert(
      {
        workspace_id: workspaceId,
        position_name: positionName,
        allow_work_assignment: settings?.allowWorkAssignment ?? true,
        position_type: settings?.positionType ?? null,
        custom_type_label:
          settings?.positionType === 'custom_type' ? settings.customTypeLabel : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,position_name' }
    )

    if (error) {
      throw new Error(error.message)
    }
  }

  for (const custom of draft.customPositions) {
    const settings = draft.positionSettings[custom.name]
    const { error } = await admin.from('workspace_position_settings').upsert(
      {
        workspace_id: workspaceId,
        position_name: custom.name,
        allow_work_assignment: settings?.allowWorkAssignment ?? false,
        position_type: settings?.positionType ?? custom.positionType,
        custom_type_label:
          (settings?.positionType ?? custom.positionType) === 'custom_type'
            ? settings?.customTypeLabel ?? custom.customTypeLabel
            : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,position_name' }
    )

    if (error) {
      throw new Error(error.message)
    }
  }
}

export async function applyRosterPlanToWorkspace(
  admin: SupabaseClient,
  workspaceId: string,
  draft: BuildTeamRosterDraft,
  invitedBy: string
): Promise<void> {
  await clearArchivedStandardPositions(admin, workspaceId, draft.visibleStandardPositions)
  await upsertArchivedStandardPositions(admin, workspaceId, draft.archivedStandardPositions)
  await upsertCustomPositionsFromDraft(admin, workspaceId, draft, invitedBy)
  await replaceSingleResourceSlots(admin, workspaceId, draft.singleResourceSlots)
  await upsertPositionSettingsFromDraft(admin, workspaceId, draft)
}

export async function applyMinimalIcOnlyRoster(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const archived = WORKSPACE_ROSTER_POSITIONS.filter((position) => position !== 'Incident Commander')
  await clearArchivedStandardPositions(admin, workspaceId, ['Incident Commander'])
  await upsertArchivedStandardPositions(admin, workspaceId, archived)
  await replaceSingleResourceSlots(admin, workspaceId, [])
}

export async function sendBuildTeamInvites(
  admin: SupabaseClient,
  workspaceId: string,
  draft: BuildTeamRosterDraft,
  invitedBy: string,
  creatorEmail: string
): Promise<void> {
  const normalizedCreator = creatorEmail.trim().toLowerCase()

  for (const member of draft.draftMembers) {
    const email = member.email.trim().toLowerCase()
    if (!email || email === normalizedCreator) {
      continue
    }

    if (member.personSource === 'add_existing' && member.existingUserId) {
      if (member.assignmentKind === 'single_resource') {
        if (!member.orgChartReportsTo) continue
        await addSingleResourceWorkspaceMemberWithEffectiveWhen(admin, {
          workspaceId,
          email: member.email,
          orgChartReportsTo: member.orgChartReportsTo,
          scheduleOnOpAdvance: false,
          status: 'invited',
          userId: member.existingUserId,
          invitedBy,
        })
      } else {
        await addIcsWorkspaceMemberWithEffectiveWhen(admin, {
          workspaceId,
          email: member.email,
          icsPositions: member.icsPositions,
          scheduleOnOpAdvance: false,
          status: 'invited',
          userId: member.existingUserId,
          invitedBy,
        })
      }
      continue
    }

    if (member.assignmentKind === 'single_resource') {
      if (!member.orgChartReportsTo) continue
      const result = await provisionSingleResourceMemberWithEffectiveWhen(admin, {
        workspaceId,
        email: member.email,
        orgChartReportsTo: member.orgChartReportsTo,
        password: member.password,
        invitedBy,
        confirmPasswordOverwrite: false,
        scheduleOnOpAdvance: false,
      })
      if (!result.ok) {
        throw new Error(`Could not invite ${member.email}.`)
      }
      continue
    }

    const result = await provisionIcsWorkspaceMemberWithEffectiveWhen(admin, {
      workspaceId,
      email: member.email,
      icsPositions: member.icsPositions,
      password: member.password,
      invitedBy,
      confirmPasswordOverwrite: false,
      scheduleOnOpAdvance: false,
    })

    if (!result.ok) {
      throw new Error(`Could not invite ${member.email}.`)
    }
  }
}

export async function saveWorkspaceRosterPlan(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    templateId: string
    effectTiming: 'immediate' | 'op_period_1'
    draftPlan: BuildTeamRosterDraft
    appliedAt?: string | null
    invitesSentAt?: string | null
  }
): Promise<void> {
  const { error } = await admin.from('workspace_roster_plans').upsert(
    {
      workspace_id: params.workspaceId,
      roster_template_id: params.templateId,
      effect_timing: params.effectTiming,
      draft_plan: params.draftPlan,
      applied_at: params.appliedAt ?? null,
      invites_sent_at: params.invitesSentAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function markRosterPlanApplied(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const { error } = await admin
    .from('workspace_roster_plans')
    .update({
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function markRosterInvitesSent(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const { error } = await admin
    .from('workspace_roster_plans')
    .update({
      invites_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }
}

export function resolveTemplatePositions(template: DbRosterTemplateRow): string[] {
  return Array.isArray(template.definition?.positions) ? template.definition.positions : []
}

export class RosterPlanApplyError extends Error {
  step: string

  constructor(step: string, message: string) {
    super(`${step}: ${message}`)
    this.name = 'RosterPlanApplyError'
    this.step = step
  }
}

export async function runRosterPlanStep<T>(
  step: string,
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new RosterPlanApplyError(step, message)
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isEffectTiming(value: unknown): value is BuildTeamRosterDraft['effectTiming'] {
  return value === 'immediate' || value === 'op_period_1'
}

export function validateBuildTeamRosterDraft(draft: unknown): BuildTeamRosterDraft {
  if (!draft || typeof draft !== 'object') {
    throw new Error('draftPlan must be an object.')
  }

  const candidate = draft as Partial<BuildTeamRosterDraft>

  if (typeof candidate.templateSlug !== 'string' || candidate.templateSlug.trim().length === 0) {
    throw new Error('draftPlan.templateSlug is required.')
  }

  if (!isEffectTiming(candidate.effectTiming)) {
    throw new Error('draftPlan.effectTiming must be immediate or op_period_1.')
  }

  if (!isStringArray(candidate.visibleStandardPositions)) {
    throw new Error('draftPlan.visibleStandardPositions must be a string array.')
  }

  if (!isStringArray(candidate.archivedStandardPositions)) {
    throw new Error('draftPlan.archivedStandardPositions must be a string array.')
  }

  if (!Array.isArray(candidate.singleResourceSlots)) {
    throw new Error('draftPlan.singleResourceSlots must be an array.')
  }

  if (!Array.isArray(candidate.draftMembers)) {
    throw new Error('draftPlan.draftMembers must be an array.')
  }

  if (!candidate.positionSettings || typeof candidate.positionSettings !== 'object') {
    throw new Error('draftPlan.positionSettings must be an object.')
  }

  if (!Array.isArray(candidate.customPositions)) {
    throw new Error('draftPlan.customPositions must be an array.')
  }

  return {
    templateSlug: candidate.templateSlug.trim(),
    effectTiming: candidate.effectTiming,
    visibleStandardPositions: [...candidate.visibleStandardPositions],
    archivedStandardPositions: [...candidate.archivedStandardPositions],
    customPositions: [...candidate.customPositions],
    singleResourceSlots: candidate.singleResourceSlots.map((slot) => ({
      label: typeof slot.label === 'string' ? slot.label : '',
      reportsTo: typeof slot.reportsTo === 'string' ? slot.reportsTo : '',
    })),
    draftMembers: [...candidate.draftMembers],
    positionSettings: { ...candidate.positionSettings },
  }
}

export async function ensureCreatorAsIncidentCommander(
  admin: SupabaseClient,
  workspaceId: string,
  userId: string,
  creatorEmail: string
): Promise<void> {
  const normalizedEmail = creatorEmail.trim().toLowerCase()

  const { error: memberError } = await admin.from('workspace_members').upsert(
    {
      workspace_id: workspaceId,
      user_id: userId,
      email: normalizedEmail,
      ics_position: 'Incident Commander',
      status: 'active',
      invited_by: userId,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,email' }
  )

  if (memberError) {
    throw new Error(memberError.message)
  }

  const { data: memberRow, error: memberLookupError } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', normalizedEmail)
    .single()

  if (memberLookupError || !memberRow) {
    throw new Error(memberLookupError?.message ?? 'Could not find workspace member.')
  }

  const { error: positionError } = await admin.from('workspace_member_positions').upsert(
    {
      member_id: memberRow.id,
      ics_position: 'Incident Commander',
    },
    { onConflict: 'member_id,ics_position' }
  )

  if (positionError) {
    throw new Error(positionError.message)
  }
}
