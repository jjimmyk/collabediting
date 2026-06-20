import type { ResourceListItemData } from '../src/features/resources/types'
import {
  assetMatchesResourceNameQuery,
  countWorkspaceAssetsForResourceName,
  fillHaveForResourceRequirementRow,
  fillHaveForResourceValue,
  lookupHaveFromWorkspaceAssets,
} from '../src/features/resources/workspace-asset-have-lookup'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const assets: ResourceListItemData[] = [
  {
    assetKey: 'helo-1',
    id: 1,
    areaKey: 'atlantic',
    name: 'MH-65 Dolphin Helicopter',
    assetStatus: 'FMC',
    assetStatusUpdatedAt: '',
    owner: 'USCG',
    status: 'Assigned',
    type: 'Helicopter',
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
    unitType: 'aircraft',
    unitName: 'MH-65 6501',
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
    assignedWorkspaceId: 'ws-1',
    assignedWorkspaceKind: 'incident',
    assignedIncidentName: 'Demo',
    assignedExerciseName: null,
    orgChartReportsTo: null,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
    pointOfContactMemberId: null,
  },
  {
    assetKey: 'helo-2',
    id: 2,
    areaKey: 'atlantic',
    name: 'MH-65 Dolphin Helicopter (Reserve)',
    assetStatus: 'FMC',
    assetStatusUpdatedAt: '',
    owner: 'USCG',
    status: 'Assigned',
    type: 'Helicopter',
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
    unitType: 'aircraft',
    unitName: 'MH-65 6502',
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
    assignedWorkspaceId: 'ws-1',
    assignedWorkspaceKind: 'incident',
    assignedIncidentName: 'Demo',
    assignedExerciseName: null,
    orgChartReportsTo: null,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
    pointOfContactMemberId: null,
  },
  {
    assetKey: 'boat-1',
    id: 3,
    areaKey: 'atlantic',
    name: 'Small Boat 01',
    assetStatus: 'FMC',
    assetStatusUpdatedAt: '',
    owner: 'USCG',
    status: 'Assigned',
    type: 'Small Boat',
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
    quantity: 2,
    unitType: 'boat',
    unitName: 'RB-S 01',
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
    assignedWorkspaceId: 'ws-1',
    assignedWorkspaceKind: 'incident',
    assignedIncidentName: 'Demo',
    assignedExerciseName: null,
    orgChartReportsTo: null,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
    pointOfContactMemberId: null,
  },
]

assert(assetMatchesResourceNameQuery(assets[0], 'Helicopter'), 'helicopter should match by type')
assert(!assetMatchesResourceNameQuery(assets[2], 'Helicopter'), 'boat should not match helicopter')
assert(countWorkspaceAssetsForResourceName(assets, 'Helicopter') === 2, 'should count two helicopters')
assert(
  countWorkspaceAssetsForResourceName(assets, 'Helicopter', { countMode: 'quantity-sum' }) === 2,
  'quantity sum should be 2'
)
assert(countWorkspaceAssetsForResourceName(assets, 'H') === 0, 'short query should be ignored')

const lookup = lookupHaveFromWorkspaceAssets(assets, 'Helicopter')
assert(lookup.have === '2', 'lookup should return have 2')
assert(lookup.matchCount === 2, 'lookup match count')

const filled = fillHaveForResourceValue(
  { required: '5', have: '', need: '' },
  'Helicopter',
  assets,
  { overwrite: true }
)
assert(filled.filled, 'should fill empty have')
assert(filled.value.have === '2', 'filled have value')
assert(filled.value.need === '3', 'need should recalculate')

const skipped = fillHaveForResourceValue(
  { required: '5', have: '9', need: '0' },
  'Helicopter',
  assets,
  { onlyIfHaveEmpty: true }
)
assert(!skipped.filled, 'should not overwrite existing have by default')

const requirementFill = fillHaveForResourceRequirementRow(
  { id: 1, resource: 'Small Boat', required: '4', have: '', need: '' },
  assets,
  { overwrite: true }
)
assert(requirementFill.filled, 'requirement row should fill')
assert(requirementFill.requirement.have === '1', 'one small boat asset matches')

console.log('verify-workspace-asset-have-lookup: all checks passed')
