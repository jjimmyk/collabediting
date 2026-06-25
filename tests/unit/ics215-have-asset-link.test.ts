import { describe, expect, it } from 'vitest'
import {
  applyHaveAssetLink,
  applyManualHaveValue,
  buildHaveAssetLinkIndex,
  formatHaveAssetLinkLocation,
  getConflictingHaveAssetKeys,
  isAssetLinkedElsewhere,
  isHaveLinkedToAssets,
  normalizeIcs215ResourceValue,
} from '@/features/ics215/ics215-have-asset-link'
import type { Ics215ResourceColumn, Ics215WorkAssignmentRow } from '@/features/ics215/types'
import {
  buildAssetSearchText,
  rankWorkspaceAssetsForResourceQuery,
  scoreAssetRelevance,
} from '@/features/resources/workspace-asset-relevance'
import type { ResourceListItemData } from '@/features/resources/types'

const helicopter: ResourceListItemData = {
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
  notes: 'search and rescue',
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
  capabilities: 'aerial hoist',
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
  assetCheckInStatus: null,
  pointOfContactMemberId: null,
  competencyFunction: null,
}

describe('workspace-asset-relevance', () => {
  it('scores helicopter assets for helicopter query', () => {
    const score = scoreAssetRelevance(helicopter, 'Helicopter')
    expect(score.score).toBeGreaterThan(12)
    expect(buildAssetSearchText(helicopter)).toContain('helicopter')
  })

  it('ranks suggested and other assets', () => {
    const ranked = rankWorkspaceAssetsForResourceQuery([helicopter], 'Helicopter')
    expect(ranked.suggested).toHaveLength(1)
    expect(ranked.suggested[0]?.asset.assetKey).toBe('helo-1')
  })
})

describe('ics215-have-asset-link', () => {
  it('normalizes linked resource values', () => {
    const normalized = normalizeIcs215ResourceValue({
      required: '2',
      have: '1',
      need: '1',
      linkedAssetKeys: ['helo-1'],
    })
    expect(normalized.haveSource).toBe('linked-assets')
    expect(normalized.linkedAssetKeys).toEqual(['helo-1'])
  })

  it('applies manual have and clears links', () => {
    const linked = applyHaveAssetLink(
      { required: '3', have: '', need: '' },
      ['helo-1'],
      [helicopter]
    )
    expect(isHaveLinkedToAssets(linked)).toBe(true)
    expect(linked.have).toBe('1')

    const manual = applyManualHaveValue(linked, '5')
    expect(manual.haveSource).toBe('manual')
    expect(manual.linkedAssetKeys).toBeUndefined()
    expect(manual.need).toBe('0')
  })

  it('builds a single Have-cell index per asset key', () => {
    const columns: Ics215ResourceColumn[] = [{ id: 'col-helo', label: 'Helicopter' }]
    const rows: Ics215WorkAssignmentRow[] = [
      {
        id: 1,
        assignee: 'unit-a',
        workAssignment: 'SAR hoist ops',
        resourceValues: {
          'col-helo': applyHaveAssetLink(
            { required: '1', have: '', need: '' },
            ['helo-1'],
            [helicopter]
          ),
        },
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
    ]

    const index = buildHaveAssetLinkIndex(rows, columns, (key) =>
      key === 'unit-a' ? 'Air Ops Branch' : key
    )

    expect(index.get('helo-1')).toMatchObject({
      rowId: 1,
      columnId: 'col-helo',
      assigneeLabel: 'Air Ops Branch',
      workAssignment: 'SAR hoist ops',
      columnLabel: 'Helicopter',
    })
    expect(formatHaveAssetLinkLocation(index.get('helo-1')!)).toContain('Air Ops Branch')
  })

  it('detects assets linked in other Have cells', () => {
    const columns: Ics215ResourceColumn[] = [{ id: 'col-helo', label: 'Helicopter' }]
    const rows: Ics215WorkAssignmentRow[] = [
      {
        id: 1,
        assignee: 'unit-a',
        workAssignment: 'Alpha',
        resourceValues: {
          'col-helo': applyHaveAssetLink(
            { required: '1', have: '', need: '' },
            ['helo-1'],
            [helicopter]
          ),
        },
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
      {
        id: 2,
        assignee: 'unit-b',
        workAssignment: 'Bravo',
        resourceValues: { 'col-helo': { required: '', have: '', need: '' } },
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
    ]

    const index = buildHaveAssetLinkIndex(rows, columns, (key) => key)
    expect(
      isAssetLinkedElsewhere('helo-1', { rowId: 2, columnId: 'col-helo' }, index)
    ).toBe(true)
    expect(getConflictingHaveAssetKeys(['helo-1'], { rowId: 2, columnId: 'col-helo' }, index)).toEqual([
      'helo-1',
    ])
    expect(
      getConflictingHaveAssetKeys(['helo-1'], { rowId: 1, columnId: 'col-helo' }, index)
    ).toEqual([])
  })
})
