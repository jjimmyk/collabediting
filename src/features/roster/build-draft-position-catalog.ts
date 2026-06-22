import type { WorkspacePositionSettingsMap } from '@/lib/workspace-position-settings'
import type { StandardPositionLifecycleRow } from '@/lib/operational-period-roster-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'
import {
  buildWorkspacePositionCatalog,
  type WorkspaceCustomPosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'

export function buildStandardLifecycleFromDraft(
  draft: BuildTeamRosterDraft
): StandardPositionLifecycleRow[] {
  return draft.archivedStandardPositions.map((positionName) => ({
    positionName,
    opAdvanceLabel: 'retire_on_op_advance' as const,
    archivedAt: new Date(0).toISOString(),
  }))
}

export function buildCustomPositionsFromDraft(
  draft: BuildTeamRosterDraft
): WorkspaceCustomPosition[] {
  return draft.customPositions.map((position, index) => ({
    id: position.id,
    name: position.name,
    reportsTo: position.reportsTo,
    sortOrder: index,
    lifecycleStatus: 'active',
  }))
}

export function buildDraftPositionCatalog(draft: BuildTeamRosterDraft): WorkspacePositionCatalog {
  return buildWorkspacePositionCatalog(
    buildCustomPositionsFromDraft(draft),
    buildStandardLifecycleFromDraft(draft)
  )
}

export function buildDraftRosterMembers(draft: BuildTeamRosterDraft): WorkspaceRosterMember[] {
  return draft.draftMembers.map((member) => ({
    id: member.id,
    userId: member.existingUserId,
    email: member.email,
    status: member.status ?? 'invited',
    icsPosition: member.icsPositions[0] ?? '',
    icsPositions: member.assignmentKind === 'ics_position' ? member.icsPositions : [],
    assignmentKind: member.assignmentKind,
    orgChartReportsTo:
      member.assignmentKind === 'single_resource' ? member.orgChartReportsTo : null,
    pendingOrgChartReportsTo: null,
    checkInStatus: 'not_arrived',
    addedAt: new Date().toISOString(),
  }))
}

export function buildDraftPositionSettings(draft: BuildTeamRosterDraft): WorkspacePositionSettingsMap {
  const settings: Record<
    string,
    {
      allowWorkAssignment: boolean
      positionType: BuildTeamRosterDraft['positionSettings'][string]['positionType']
      customTypeLabel: string | null
    }
  > = {}

  for (const [position, row] of Object.entries(draft.positionSettings)) {
    settings[position] = {
      allowWorkAssignment: row.allowWorkAssignment,
      positionType: row.positionType,
      customTypeLabel: row.customTypeLabel,
    }
  }

  return settings
}
