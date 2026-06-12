export type ResourceCostUnitType = 'per day' | 'per hour' | 'to purchase'

export type ResourceDeploymentKind = 'available' | 'incident' | 'exercise'

export type AssetStatus = 'FMC' | 'PMC' | 'NMC'

export const ASSET_STATUS_OPTIONS: AssetStatus[] = ['FMC', 'PMC', 'NMC']

export type ResourceListItemData = {
  id: number
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
  deploymentKind: ResourceDeploymentKind
  assignedIncidentName: string | null
  assignedExerciseName: string | null
}
