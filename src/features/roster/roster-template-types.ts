import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'

export type RosterTemplateEffectTiming = 'immediate' | 'op_period_1'

export type RosterTemplateSingleResourceSlot = {
  label: string
  reportsTo: string
}

export type RosterTemplateDefinition = {
  positions: string[]
  singleResourceSlots: RosterTemplateSingleResourceSlot[]
}

export type RosterTemplateRecord = {
  id: string
  slug: string
  name: string
  description: string | null
  isDefault: boolean
  sortOrder: number
  definition: RosterTemplateDefinition
}

import type { WorkspaceMemberPersonSource } from '@/lib/roster-member-assignment'

export type BuildTeamDraftMember = {
  id: string
  email: string
  assignmentKind: 'ics_position' | 'single_resource'
  icsPositions: string[]
  orgChartReportsTo: string | null
  password: string
  personSource: WorkspaceMemberPersonSource
  existingUserId: string | null
  status?: 'invited' | 'active'
}

export type BuildTeamDraftCustomPosition = {
  id: string
  name: string
  reportsTo: string
  positionType: WorkspacePositionType
  customTypeLabel: string | null
}

export type BuildTeamRosterDraft = {
  templateSlug: string
  effectTiming: RosterTemplateEffectTiming
  visibleStandardPositions: string[]
  archivedStandardPositions: string[]
  customPositions: BuildTeamDraftCustomPosition[]
  singleResourceSlots: RosterTemplateSingleResourceSlot[]
  draftMembers: BuildTeamDraftMember[]
  positionSettings: Record<
    string,
    {
      positionType: WorkspacePositionType | null
      customTypeLabel: string | null
      allowWorkAssignment: boolean
    }
  >
}

export type WorkspaceRosterPlanRecord = {
  workspaceId: string
  rosterTemplateId: string
  rosterTemplateSlug: string
  rosterTemplateName: string
  effectTiming: RosterTemplateEffectTiming
  draftPlan: BuildTeamRosterDraft
  appliedAt: string | null
  invitesSentAt: string | null
}
