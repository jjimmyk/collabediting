import { describe, expect, it } from 'vitest'
import {
  getAssetWorkspaceAssignmentBlockReason,
  resolveWorkspaceDisplayName,
} from '@/features/resources/asset-transfer-eligibility'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'

function buildAsset(
  overrides: Partial<ResourceListItemData> = {}
): ResourceListItemData {
  return {
    assetKey: 'asset-1',
    id: 1,
    areaKey: 'district-7',
    name: 'Engine 1',
    assetStatus: 'FMC',
    assetStatusUpdatedAt: '',
    owner: 'USCG',
    status: 'Available',
    type: 'Engine',
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
    quantity: 1,
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
    deploymentKind: 'available',
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
    ...overrides,
  }
}

const workspaceOptions: AssetWorkspaceOption[] = [
  { workspaceId: 'ws-a', kind: 'incident', name: 'Incident Alpha' },
]

describe('asset transfer eligibility', () => {
  it('resolves workspace name from options', () => {
    expect(resolveWorkspaceDisplayName('ws-a', workspaceOptions)).toBe('Incident Alpha')
  })

  it('falls back to asset assignment labels', () => {
    const asset = buildAsset({
      assignedWorkspaceId: 'ws-b',
      assignedIncidentName: 'Fallback Incident',
    })
    expect(resolveWorkspaceDisplayName('ws-b', [], asset)).toBe('Fallback Incident')
  })

  it('blocks assets already assigned to the target workspace', () => {
    const asset = buildAsset({ assignedWorkspaceId: 'ws-a' })
    expect(getAssetWorkspaceAssignmentBlockReason(asset, 'ws-a', workspaceOptions)).toBe(
      'This item is already assigned to workspace Incident Alpha.'
    )
  })

  it('allows assets assigned elsewhere or unassigned', () => {
    const elsewhere = buildAsset({ assignedWorkspaceId: 'ws-other' })
    const unassigned = buildAsset({ assignedWorkspaceId: null })
    expect(getAssetWorkspaceAssignmentBlockReason(elsewhere, 'ws-a', workspaceOptions)).toBeNull()
    expect(getAssetWorkspaceAssignmentBlockReason(unassigned, 'ws-a', workspaceOptions)).toBeNull()
    expect(getAssetWorkspaceAssignmentBlockReason(elsewhere, null, workspaceOptions)).toBeNull()
  })
})
