export type WorkspaceKind = 'incident' | 'exercise'

export type WorkspaceMemberStatus = 'invited' | 'active' | 'removed'

export type WorkspaceMemberCheckInStatus =
  | 'not_arrived'
  | 'checked_in'
  | 'checked_out'
  | 'demobilizing'
  | 'demobilized'

export type WorkspaceMemberAssignmentKind = 'ics_position' | 'single_resource'

export type RosterMemberEffectiveWhen = 'now' | 'next_op_advance'

export type WorkspaceRosterMember = {
  id: string
  email: string
  /** Primary position label (first assigned position). */
  icsPosition: string
  icsPositions: string[]
  assignmentKind: WorkspaceMemberAssignmentKind
  orgChartReportsTo: string | null
  /** Pending single-resource org chart placement (activates on next OP). */
  pendingOrgChartReportsTo?: string | null
  /** Competency/function for single-resource members. */
  competencyFunction?: string | null
  /** Competency/function keyed by ICS position assignment. */
  competencyByPosition?: Record<string, string | null>
  /** Pending single-resource competency/function (activates on next OP). */
  pendingCompetencyFunction?: string | null
  status: WorkspaceMemberStatus
  checkInStatus: WorkspaceMemberCheckInStatus
  addedAt: string
  userId: string | null
}

export type WorkspaceMetadataRecord = {
  category?: string
  templateId?: string
  relatedEventIds?: number[]
  locationMethod?: string
  geometrySummary?: string
  aors?: string[]
  address?: string
  location?: [number, number]
  exerciseMsel?: import('@/features/exercise-msel/types').ExerciseMselState
}

export type AccessibleWorkspace = {
  workspaceId: string
  organizationId: string | null
  kind: WorkspaceKind
  legacyId: number
  name: string
  icsPosition: string
  icsPositions: string[]
  region: string | null
  summary: string | null
  archivedAt: string | null
  workspaceFormat: string | null
  incidentComplexity: string | null
  hasSequentialWorkflow: boolean
  sequentialWorkflowType: string | null
  startedOperationalPeriodCount: number
  workingOperationalPeriodNumber: number
  metadata: WorkspaceMetadataRecord
}

export type WorkspacePermissions = {
  positions: string[]
  permissions: string[]
  canEditIcs201Form: boolean
}

export type UserProfile = {
  id: string
  email: string
  fullName: string | null
  isOrgAdmin: boolean
}

export type DbWorkspace = {
  id: string
  kind: WorkspaceKind
  legacy_id: number
  name: string
  region: string | null
  summary: string | null
  archived_at?: string | null
  workspace_format?: string | null
  incident_complexity?: string | null
  has_sequential_workflow?: boolean | null
  sequential_workflow_type?: string | null
  started_operational_period_count?: number | null
  working_operational_period_number?: number | null
  metadata?: WorkspaceMetadataRecord | null
}

export type DbWorkspaceMember = {
  id: string
  workspace_id: string
  user_id: string | null
  email: string
  ics_position: string
  assignment_kind?: WorkspaceMemberAssignmentKind | null
  org_chart_reports_to?: string | null
  org_chart_sort_order?: number | null
  status: WorkspaceMemberStatus
  invited_at: string
  joined_at: string | null
  check_in_status?: WorkspaceMemberCheckInStatus | null
  competency_function?: string | null
  workspace_member_positions?: Array<{ ics_position: string; competency_function?: string | null }> | null
}
