import type { StandardPositionLifecycleRow } from '@/lib/operational-period-roster-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { WorkspaceCustomPosition } from '@/features/roster/workspace-positions'
import type { WorkspacePositionSettingsMap } from '@/lib/workspace-position-settings'
import {
  buildCustomPositionsFromDraft,
  buildDraftRosterMembers,
  buildStandardLifecycleFromDraft,
} from '@/features/roster/build-draft-position-catalog'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'
import { buildDraftPositionSettings } from '@/features/roster/build-draft-position-catalog'

export type LocalRosterPlanRecord = {
  draft: BuildTeamRosterDraft
  applied: boolean
}

export function resolveEffectiveLocalRosterDraft(
  plan: LocalRosterPlanRecord | undefined
): BuildTeamRosterDraft | null {
  return plan?.draft ?? null
}

export function buildLocalStandardLifecycleFromPlan(
  plan: LocalRosterPlanRecord | undefined
): StandardPositionLifecycleRow[] {
  const effectiveDraft = resolveEffectiveLocalRosterDraft(plan)
  if (!effectiveDraft) return []
  return buildStandardLifecycleFromDraft(effectiveDraft)
}

export function buildLocalCustomPositionsFromPlan(
  plan: LocalRosterPlanRecord | undefined
): WorkspaceCustomPosition[] {
  const effectiveDraft = resolveEffectiveLocalRosterDraft(plan)
  if (!effectiveDraft) return []
  return buildCustomPositionsFromDraft(effectiveDraft)
}

export function buildLocalRosterMembersFromPlan(
  baseRoster: WorkspaceRosterMember[],
  plan: LocalRosterPlanRecord | undefined
): WorkspaceRosterMember[] {
  if (!plan) return baseRoster
  const draftMembers = buildDraftRosterMembers(plan.draft)
  const existingEmails = new Set(baseRoster.map((member) => member.email.toLowerCase()))
  const additions = draftMembers.filter((member) => !existingEmails.has(member.email.toLowerCase()))
  return [...baseRoster, ...additions]
}

export function buildLocalPositionSettingsFromPlan(
  plan: LocalRosterPlanRecord | undefined
): WorkspacePositionSettingsMap {
  const effectiveDraft = resolveEffectiveLocalRosterDraft(plan)
  if (!effectiveDraft) return {}
  return buildDraftPositionSettings(effectiveDraft)
}
