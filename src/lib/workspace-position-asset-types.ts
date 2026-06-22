export type PositionAssetRosterEntry = {
  assetKey: string
  name: string
  type: string
  pointOfContactMemberId: string | null
  pointOfContactEmail: string | null
  competencyFunction: string | null
}

export type AssetScheduleAction = 'assign_on_op_advance' | 'unassign_on_op_advance'

export type WorkspacePositionAssetScheduleRow = {
  id: string
  workspaceId: string
  positionName: string
  assetKey: string
  scheduleAction: AssetScheduleAction
  competencyFunction: string | null
  createdAt: string
  createdBy: string | null
}

export type WorkspacePositionAssetAssignmentRow = {
  id: string
  workspaceId: string
  positionName: string
  assetKey: string
  competencyFunction: string | null
  createdAt: string
  createdBy: string | null
}

export type PositionAssetScheduleMap = Record<
  string,
  { assignAssetKeys: string[]; unassignAssetKeys: string[] }
>

export type PositionAssetWorkspaceMeta = {
  pointOfContactMemberId: string | null
  pointOfContactEmail: string | null
}
