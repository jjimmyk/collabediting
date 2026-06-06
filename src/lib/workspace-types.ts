export type WorkspaceKind = 'incident' | 'exercise'

export type WorkspaceMemberStatus = 'invited' | 'active' | 'removed'

export type WorkspaceRosterMember = {
  id: string
  email: string
  icsPosition: string
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
}
