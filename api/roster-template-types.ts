export type RosterTemplateEffectTiming = 'immediate' | 'op_period_1'

export type RosterTemplateSingleResourceSlot = {
  label: string
  reportsTo: string
}

export type ApiWorkspacePositionType =
  | 'branch'
  | 'division'
  | 'group'
  | 'strike_team'
  | 'task_force'
  | 'custom_type'

export type BuildTeamDraftMember = {
  id: string
  email: string
  assignmentKind: 'ics_position' | 'single_resource'
  icsPositions: string[]
  orgChartReportsTo: string | null
  competencyFunction?: string | null
  password: string
  personSource: 'add_existing' | 'create_new'
  existingUserId: string | null
  status?: 'invited' | 'active'
}

export type BuildTeamDraftCustomPosition = {
  id: string
  name: string
  reportsTo: string
  positionType: ApiWorkspacePositionType
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
      positionType: ApiWorkspacePositionType | null
      customTypeLabel: string | null
      allowWorkAssignment: boolean
    }
  >
}
