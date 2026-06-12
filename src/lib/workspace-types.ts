export type WorkspaceKind = 'incident' | 'exercise'

export type WorkspaceMemberStatus = 'invited' | 'active' | 'removed'

export type WorkspaceRosterMember = {
  id: string
  email: string
  /** Primary position label (first assigned position). */
  icsPosition: string
  icsPositions: string[]
  status: WorkspaceMemberStatus
  addedAt: string
  userId: string | null
}

export type AccessibleWorkspace = {
  workspaceId: string
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
}

export type DbWorkspaceMember = {
  id: string
  workspace_id: string
  user_id: string | null
  email: string
  ics_position: string
  status: WorkspaceMemberStatus
  invited_at: string
  joined_at: string | null
  workspace_member_positions?: Array<{ ics_position: string }> | null
}
