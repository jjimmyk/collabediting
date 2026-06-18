import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'
import type { WorkspaceKind } from '@/lib/workspace-types'

export type ResourceCostUnitType = 'per day' | 'per hour' | 'to purchase'

export type ResourceDeploymentKind = 'available' | 'incident' | 'exercise'

export type AssetStatus = 'FMC' | 'PMC' | 'NMC'

export const ASSET_STATUS_OPTIONS: AssetStatus[] = ['FMC', 'PMC', 'NMC']

export type HubAssetCatalogRecord = {
  assetKey: string
  id: number
  areaKey: UscgCoastGuardAreaKey
  name: string
  assetStatus: AssetStatus
  assetStatusUpdatedAt: string
  owner: string
  status: 'Assigned' | 'Staged' | 'Available'
  type: string
  teamLead: string
  eta: string
  location: string
  notes: string
  mapLocation: [number, number]
  currentLocation: string
  datetimeOrdered: string
  opcon: string
  tacon: string
  pointOfContact: string
  owningOrganization: string
  quantity: number
  unitType: string
  unitName: string
  hullTailNumber: string
  symbology: string
  latitude: string
  longitude: string
  capabilities: string
  currentOpPeriod: string
  nextOpPeriod: string
  currentOpPeriodAssignment: string
  nextOpPeriodAssignment: string
  checkInStatus: string
  costUnitType: ResourceCostUnitType
  costPerUnit: number
}

export type ResourceListItemData = HubAssetCatalogRecord & {
  deploymentKind: ResourceDeploymentKind
  assignedWorkspaceId: string | null
  assignedWorkspaceKind: WorkspaceKind | null
  /** Display label resolved from assigned workspace name. */
  assignedIncidentName: string | null
  assignedExerciseName: string | null
  orgChartReportsTo: string | null
  orgChartSortOrder: number
  /** ICS-204 document id when this asset is attached to a 204 Resources Assigned section. */
  ics204DocumentId: string | null
  /** Roster member id serving as workspace-scoped Point of Contact for this asset. */
  pointOfContactMemberId: string | null
}

export type AssetWorkspaceOption = {
  workspaceId: string
  kind: WorkspaceKind
  name: string
}

export type WorkspaceAssetAssignment = {
  assetKey: string
  workspaceId: string
  orgChartReportsTo?: string | null
  orgChartSortOrder?: number
  ics204DocumentId?: string | null
  pointOfContactMemberId?: string | null
}
