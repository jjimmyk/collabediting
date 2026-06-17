export type PositionLifecycleStatus =
  | 'active'
  | 'planned_create'
  | 'retire_on_op_advance'
  | 'archived'

export type PositionOpAdvanceLabel = 'retire_on_op_advance' | 'create_on_op_advance' | null

export type OperationalPeriodRosterSnapshotMember = {
  email: string
  status: string
  icsPositions: string[]
}

export type OperationalPeriodRosterSnapshotPosition = {
  name: string
  source: 'standard' | 'custom'
  lifecycleStatus: PositionLifecycleStatus
  opAdvanceLabel: PositionOpAdvanceLabel
  reportsTo?: string | null
  editIcs201: boolean
  members: OperationalPeriodRosterSnapshotMember[]
}

export type OperationalPeriodRosterSnapshot = {
  capturedAt: string
  periodNumber: number
  positions: OperationalPeriodRosterSnapshotPosition[]
  orgChartAssetPlacements: Array<{ assetKey: string; reportsTo: string | null }>
}

export type StandardPositionLifecycleRow = {
  positionName: string
  opAdvanceLabel: 'retire_on_op_advance'
  archivedAt: string | null
}

export type OpAdvanceLifecycleSummary = {
  retiring: string[]
  creating: string[]
  persistingCount: number
  memberSchedules?: {
    assign: Array<{ positionName: string; emails: string[] }>
    unassign: Array<{ positionName: string; emails: string[] }>
  }
}
