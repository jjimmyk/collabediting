import type { ResourceListItemData } from '@/features/resources/types'
import type { Ics201ResourceSnapshot, Ics201ResourceSummaryRow } from './types'

type LegacyIcs201ResourceSummaryRow = Partial<Ics201ResourceSummaryRow>

export function ics201ResourceLabelsFromAsset(asset: ResourceListItemData): {
  resource: string
  resourceIdentifier: string
} {
  const resource = asset.type.trim() || asset.name.trim()
  const resourceIdentifier =
    asset.hullTailNumber.trim() || asset.unitName.trim() || asset.name.trim()
  return { resource, resourceIdentifier }
}

export function snapshotFromResourceListItem(resource: ResourceListItemData): Ics201ResourceSnapshot {
  return { ...resource, mapLocation: [...resource.mapLocation] as [number, number] }
}

export function createIcs201ResourceRowFromAsset(
  rowId: number,
  asset: ResourceListItemData
): Ics201ResourceSummaryRow {
  const { resource, resourceIdentifier } = ics201ResourceLabelsFromAsset(asset)
  return {
    id: rowId,
    assetKey: asset.assetKey,
    resourceId: asset.id,
    resourceSnapshot: snapshotFromResourceListItem(asset),
    resource,
    resourceIdentifier,
    dateTimeOrdered: '',
    eta: '',
    onScene: false,
    notes: '',
  }
}

const EMPTY_RESOURCE_SNAPSHOT = (id: number, name: string): Ics201ResourceSnapshot => ({
  id,
  assetKey: `ics201-empty-${id}`,
  areaKey: 'atlantic',
  name,
  assetStatus: 'FMC',
  assetStatusUpdatedAt: '',
  owner: '',
  status: 'Assigned',
  type: '',
  teamLead: '',
  eta: '',
  location: '',
  notes: '',
  mapLocation: [0, 0],
  currentLocation: '',
  datetimeOrdered: '',
  opcon: '',
  tacon: '',
  pointOfContact: '',
  owningOrganization: '',
  quantity: 0,
  unitType: '',
  unitName: '',
  hullTailNumber: '',
  symbology: '',
  latitude: '',
  longitude: '',
  capabilities: '',
  currentOpPeriod: '',
  nextOpPeriod: '',
  currentOpPeriodAssignment: '',
  nextOpPeriodAssignment: '',
  checkInStatus: '',
  costUnitType: 'per day',
  costPerUnit: 0,
  deploymentKind: 'incident',
  assignedWorkspaceId: null,
  assignedWorkspaceKind: null,
  assignedIncidentName: null,
  assignedExerciseName: null,
  orgChartReportsTo: null,
  orgChartSortOrder: 0,
  ics204DocumentId: null,
  pointOfContactMemberId: null,
  assetCheckInStatus: null,
  competencyFunction: null,
})

function legacyResourceSnapshotFromRow(row: LegacyIcs201ResourceSummaryRow): Ics201ResourceSnapshot {
  const rowId = typeof row.id === 'number' ? row.id : 0
  const snapshot = EMPTY_RESOURCE_SNAPSHOT(
    row.resourceId ?? rowId,
    String(row.resourceIdentifier ?? row.resource ?? 'Unknown resource')
  )
  snapshot.type = String(row.resource ?? '')
  snapshot.unitName = String(row.resourceIdentifier ?? '')
  snapshot.notes = String(row.notes ?? '')
  return snapshot
}

export function resolveIcs201ResourceSnapshot(
  row: Ics201ResourceSummaryRow,
  assetsByKey?: Record<string, ResourceListItemData>
): Ics201ResourceSnapshot {
  if (row.assetKey && assetsByKey?.[row.assetKey]) {
    return snapshotFromResourceListItem(assetsByKey[row.assetKey])
  }
  if (row.resourceSnapshot) {
    return {
      ...row.resourceSnapshot,
      mapLocation: [...row.resourceSnapshot.mapLocation] as [number, number],
    }
  }
  if (row.resource.trim() || row.resourceIdentifier.trim()) {
    return legacyResourceSnapshotFromRow(row)
  }
  return legacyResourceSnapshotFromRow(row)
}

export function normalizeIcs201ResourceSummaryRow(
  row: LegacyIcs201ResourceSummaryRow
): Ics201ResourceSummaryRow {
  const resourceSnapshot =
    row.resourceSnapshot != null
      ? snapshotFromResourceListItem(row.resourceSnapshot)
      : null

  return {
    id: typeof row.id === 'number' ? row.id : 0,
    assetKey: row.assetKey ?? resourceSnapshot?.assetKey ?? null,
    resourceId: row.resourceId ?? resourceSnapshot?.id ?? null,
    resourceSnapshot,
    resource: String(row.resource ?? ''),
    resourceIdentifier: String(row.resourceIdentifier ?? ''),
    dateTimeOrdered: String(row.dateTimeOrdered ?? ''),
    eta: String(row.eta ?? ''),
    onScene: Boolean(row.onScene),
    notes: String(row.notes ?? ''),
  }
}

export function refreshIcs201ResourceDenormalizedFields(
  row: Ics201ResourceSummaryRow,
  assetsByKey?: Record<string, ResourceListItemData>
): Ics201ResourceSummaryRow {
  if (!row.assetKey) {
    return row
  }
  const snapshot = resolveIcs201ResourceSnapshot(row, assetsByKey)
  const { resource, resourceIdentifier } = ics201ResourceLabelsFromAsset(snapshot)
  return { ...row, resource, resourceIdentifier }
}

export function cloneIcs201ResourceSummaryRow(
  row: Ics201ResourceSummaryRow
): Ics201ResourceSummaryRow {
  return {
    ...row,
    resourceSnapshot: row.resourceSnapshot
      ? {
          ...row.resourceSnapshot,
          mapLocation: [...row.resourceSnapshot.mapLocation] as [number, number],
        }
      : null,
  }
}
