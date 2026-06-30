export type RosterMemberEffectiveWhen = 'now' | 'next_op_advance'

export type RosterTemplateEffectTiming = 'immediate' | 'op_period_1'

export type RosterTemplateSingleResourceSlot = {
  label: string
  reportsTo: string
}

export type RosterTemplateCustomPositionSeed = {
  name: string
  reportsTo: string
  positionType: ApiWorkspacePositionType
  customTypeLabel?: string | null
}

export type RosterTemplateDefinition = {
  positions: string[]
  singleResourceSlots: RosterTemplateSingleResourceSlot[]
  customPositions?: RosterTemplateCustomPositionSeed[]
}

export type RosterTemplateRecord = {
  slug: string
  name: string
  description: string | null
  isDefault: boolean
  sortOrder: number
  definition: RosterTemplateDefinition
}

export type ApiWorkspacePositionType =
  | 'branch'
  | 'division'
  | 'group'
  | 'strike_team'
  | 'task_force'
  | 'custom_type'

export type RosterMemberEffectiveWhen = 'now' | 'next_op_advance'

export type AssetAssignmentKind = 'ics_position' | 'single_resource'

export type BuildTeamDraftMember = {
  id: string
  email: string
  assignmentKind: 'ics_position' | 'single_resource'
  icsPositions: string[]
  orgChartReportsTo: string | null
  competencyFunction?: string | null
  password: string
  personSource: 'add_existing' | 'create_new' | 'invite_new'
  existingUserId: string | null
  effectiveWhen?: RosterMemberEffectiveWhen
  status?: 'invited' | 'active'
}

export type BuildTeamDraftCustomPosition = {
  id: string
  name: string
  reportsTo: string
  positionType: ApiWorkspacePositionType
  customTypeLabel: string | null
  createOnFirstOpPeriod?: boolean
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
  draftAssets?: BuildTeamDraftAsset[]
  positionSettings: Record<
    string,
    {
      positionType: ApiWorkspacePositionType | null
      customTypeLabel: string | null
      allowWorkAssignment: boolean
    }
  >
}
