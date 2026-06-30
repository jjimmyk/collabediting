import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'

export type RosterTemplateEffectTiming = 'immediate' | 'op_period_1'

export type RosterTemplateSingleResourceSlot = {
  label: string
  reportsTo: string
}

export type RosterTemplateCustomPositionSeed = {
  name: string
  reportsTo: string
  positionType: WorkspacePositionType
  customTypeLabel?: string | null
}

export type RosterTemplateDefinition = {
  positions: string[]
  singleResourceSlots: RosterTemplateSingleResourceSlot[]
  customPositions?: RosterTemplateCustomPositionSeed[]
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

import type {
  RosterMemberEffectiveWhen,
  WorkspaceMemberPersonSource,
} from '@/lib/roster-member-assignment'
import type { AssetAssignmentKind } from '@/lib/roster-asset-assignment'

export type BuildTeamDraftMember = {
  id: string
  email: string
  assignmentKind: 'ics_position' | 'single_resource'
  icsPositions: string[]
  orgChartReportsTo: string | null
  competencyFunction?: string | null
  password: string
  personSource: WorkspaceMemberPersonSource
  existingUserId: string | null
  effectiveWhen: RosterMemberEffectiveWhen
  status?: 'invited' | 'active'
}

export type BuildTeamDraftCustomPosition = {
  id: string
  name: string
  reportsTo: string
  positionType: WorkspacePositionType
  customTypeLabel: string | null
  createOnFirstOpPeriod: boolean
}

export type BuildTeamDraftAsset = {
  id: string
  assetKey: string
  assignmentKind: AssetAssignmentKind
  icsPosition: string
  orgChartReportsTo: string
  pointOfContactUserId: string | null
  pointOfContactDraftMemberId: string | null
  effectiveWhen: RosterMemberEffectiveWhen
}

export type BuildTeamRosterDraft = {
  templateSlug: string
  effectTiming: RosterTemplateEffectTiming
  visibleStandardPositions: string[]
  archivedStandardPositions: string[]
  customPositions: BuildTeamDraftCustomPosition[]
  singleResourceSlots: RosterTemplateSingleResourceSlot[]
  draftMembers: BuildTeamDraftMember[]
  draftAssets: BuildTeamDraftAsset[]
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
