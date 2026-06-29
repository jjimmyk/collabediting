import { describe, expect, it } from 'vitest'
import {
  applyHaveAssetLink,
  applyHaveRosterLink,
  applyManualHaveValue,
  buildHaveLinkIndex,
  clearHaveRosterLink,
  collectWorkspaceAssignedHaveRefs,
  filterHaveRefsEligibleForConfirm,
  formatHaveLinkLocation,
  getConflictingHaveRefs,
  getLinkedHaveRefs,
  isHaveLinkedToRoster,
  isHaveRefEligibleForConfirm,
  isHaveRefLinkedElsewhere,
  normalizeIcs215ResourceValue,
  partitionHaveLinkRefs,
  removeHaveRosterLinkRefs,
  resolveHaveDisplayValue,
} from '@/features/ics215/ics215-have-asset-link'
import {
  patchResourceValueInDraft,
  computeIcs215Need,
  applyIcs215NeedRecalc,
} from '@/features/ics215/ics215-work-assignments-table-shared'
import type { Ics215ResourceColumn, Ics215WorkAssignmentRow } from '@/features/ics215/types'
import {
  buildAssetSearchText,
  rankWorkspaceAssetsForResourceQuery,
  scoreAssetRelevance,
} from '@/features/resources/workspace-asset-relevance'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { buildHaveLinkTargetOptions } from '@/lib/work-assignment-target-options'

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

const boatAlpha: ResourceListItemData = {
  ...helicopter,
  assetKey: 'org-boat-alpha-24c74de0',
  id: 2,
  name: 'Boat Alpha',
  type: 'Small Boat',
  unitName: 'Boat Alpha',
}

const boatCharlie: ResourceListItemData = {
  ...helicopter,
  assetKey: 'org-boat-charlie-cb1fbeaa',
  id: 3,
  name: 'Boat Charlie',
  type: 'Small Boat',
  unitName: 'Boat Charlie',
}

const boatAlphaRef = 'org_chart_asset:org-boat-alpha-24c74de0'
const boatCharlieRef = 'org_chart_asset:org-boat-charlie-cb1fbeaa'
const scheduledMemberRef = 'member:member-2\x1eAir Ops Branch'

const heloRef = 'org_chart_asset:helo-1'
const positionRef = 'position:Air Ops Branch'
const memberRef = 'member:member-1\x1eAir Ops Branch'

const sampleHaveLinkOptions: WorkAssignmentTargetOption[] = buildHaveLinkTargetOptions([
  {
    value: positionRef,
    label: 'Air Ops Branch',
    group: 'Positions (active roster)',
    targetType: 'position',
  },
  {
    value: memberRef,
    label: 'jane@example.com · Air Ops Branch',
    group: 'Members (active roster)',
    targetType: 'member',
  },
  {
    value: heloRef,
    label: 'MH-65 Dolphin Helicopter',
    group: 'Assets (active roster)',
    targetType: 'org_chart_asset',
  },
])

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

describe('ics215-have-roster-link', () => {
  it('normalizes legacy linked asset keys into linkedHaveRefs', () => {
    const normalized = normalizeIcs215ResourceValue({
      required: '2',
      have: '1',
      need: '1',
      linkedAssetKeys: ['helo-1'],
    })
    expect(normalized.haveSource).toBe('linked-roster')
    expect(normalized.linkedHaveRefs).toEqual([heloRef])
    expect(normalized.linkedAssetKeys).toBeUndefined()
  })

  it('applies manual have and clears links', () => {
    const linked = applyHaveRosterLink(
      { required: '3', have: '', need: '' },
      [heloRef],
      sampleHaveLinkOptions
    )
    expect(isHaveLinkedToRoster(linked)).toBe(true)
    expect(linked.have).toBe('1')

    const manual = applyManualHaveValue(linked, '5')
    expect(manual.haveSource).toBe('manual')
    expect(manual.linkedHaveRefs).toBeUndefined()
    expect(manual.need).toBe('0')
  })

  it('builds a single Have-cell index per roster ref', () => {
    const columns: Ics215ResourceColumn[] = [{ id: 'col-helo', label: 'Helicopter' }]
    const rows: Ics215WorkAssignmentRow[] = [
      {
        id: 1,
        assignee: 'unit-a',
        workAssignment: 'SAR hoist ops',
        resourceValues: {
          'col-helo': applyHaveRosterLink(
            { required: '1', have: '', need: '' },
            [heloRef],
            sampleHaveLinkOptions
          ),
        },
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
    ]

    const index = buildHaveLinkIndex(rows, columns, (key) =>
      key === 'unit-a' ? 'Air Ops Branch' : key
    )

    expect(index.get(heloRef)).toMatchObject({
      rowId: 1,
      columnId: 'col-helo',
      assigneeLabel: 'Air Ops Branch',
      workAssignment: 'SAR hoist ops',
      columnLabel: 'Helicopter',
    })
    expect(formatHaveLinkLocation(index.get(heloRef)!)).toContain('Air Ops Branch')
  })

  it('detects roster refs linked in other Have cells', () => {
    const columns: Ics215ResourceColumn[] = [{ id: 'col-helo', label: 'Helicopter' }]
    const rows: Ics215WorkAssignmentRow[] = [
      {
        id: 1,
        assignee: 'unit-a',
        workAssignment: 'Alpha',
        resourceValues: {
          'col-helo': applyHaveRosterLink(
            { required: '1', have: '', need: '' },
            [heloRef],
            sampleHaveLinkOptions
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

    const index = buildHaveLinkIndex(rows, columns, (key) => key)
    expect(
      isHaveRefLinkedElsewhere(heloRef, { rowId: 2, columnId: 'col-helo' }, index)
    ).toBe(true)
    expect(getConflictingHaveRefs([heloRef], { rowId: 2, columnId: 'col-helo' }, index)).toEqual([
      heloRef,
    ])
    expect(
      getConflictingHaveRefs([heloRef], { rowId: 1, columnId: 'col-helo' }, index)
    ).toEqual([])
  })

  it('clears linked Have state when no refs remain', () => {
    const linked = applyHaveRosterLink(
      { required: '2', have: '', need: '' },
      [heloRef],
      sampleHaveLinkOptions
    )
    expect(isHaveLinkedToRoster(linked)).toBe(true)

    const cleared = clearHaveRosterLink(linked)
    expect(isHaveLinkedToRoster(cleared)).toBe(false)
    expect(cleared.haveSource).toBe('manual')
    expect(cleared.linkedHaveRefs).toBeUndefined()
    expect(cleared.have).toBe('')
    expect(cleared.need).toBe('2')
  })

  it('applyHaveRosterLink with empty refs clears links', () => {
    const linked = applyHaveRosterLink(
      { required: '1', have: '', need: '' },
      [heloRef],
      sampleHaveLinkOptions
    )
    const cleared = applyHaveRosterLink(linked, [], sampleHaveLinkOptions)
    expect(isHaveLinkedToRoster(cleared)).toBe(false)
    expect(cleared.have).toBe('')
  })

  it('removeHaveRosterLinkRefs drops one of two linked refs', () => {
    const boatRef = 'org_chart_asset:boat-1'
    const options: WorkAssignmentTargetOption[] = [
      ...sampleHaveLinkOptions,
      {
        value: boatRef,
        label: 'Small Boat',
        group: 'Assets (active roster)',
        targetType: 'org_chart_asset',
      },
    ]
    const linked = applyHaveRosterLink(
      { required: '2', have: '', need: '' },
      [heloRef, boatRef],
      options
    )
    expect(linked.have).toBe('2')

    const partial = removeHaveRosterLinkRefs(linked, [boatRef], options)
    expect(getLinkedHaveRefs(partial)).toEqual([heloRef])
    expect(partial.have).toBe('1')
    expect(isHaveLinkedToRoster(partial)).toBe(true)
  })

  it('counts all linked refs even when an asset ref is not in eligible options', () => {
    const legacyOnlyAssetRef = 'org_chart_asset:incident-only-boat'
    const linked = applyHaveRosterLink(
      { required: '4', have: '', need: '' },
      [positionRef, memberRef, heloRef, legacyOnlyAssetRef],
      sampleHaveLinkOptions
    )
    expect(getLinkedHaveRefs(linked)).toHaveLength(4)
    expect(linked.have).toBe('4')
    expect(linked.need).toBe('0')
  })

  it('normalizes stale Have count from linkedHaveRefs on load', () => {
    const normalized = normalizeIcs215ResourceValue({
      required: '4',
      have: '3',
      need: '1',
      haveSource: 'linked-roster',
      linkedHaveRefs: [positionRef, memberRef, heloRef, 'org_chart_asset:incident-only-boat'],
    })
    expect(normalized.have).toBe('4')
    expect(normalized.need).toBe('0')
  })

  it('resolveHaveDisplayValue uses linked ref count', () => {
    const value = applyHaveRosterLink(
      { required: '4', have: '', need: '' },
      [positionRef, memberRef, heloRef, 'org_chart_asset:incident-only-boat'],
      sampleHaveLinkOptions
    )
    expect(resolveHaveDisplayValue({ ...value, have: '3' })).toBe('4')
  })

  it('counts positions and members as one each', () => {
    const linked = applyHaveRosterLink(
      { required: '5', have: '', need: '' },
      [positionRef, memberRef, heloRef],
      sampleHaveLinkOptions
    )
    expect(linked.have).toBe('3')
    expect(linked.need).toBe('2')
  })

  it('legacy applyHaveAssetLink still works via org_chart_asset refs', () => {
    const linked = applyHaveAssetLink(
      { required: '1', have: '', need: '' },
      ['helo-1'],
      [helicopter]
    )
    expect(getLinkedHaveRefs(linked)).toEqual([heloRef])
    expect(linked.have).toBe('1')
  })

  it('patchResourceValueInDraft updates one cell in a draft', () => {
    const draft = {
      resourceColumns: [{ id: 'col-helo', label: 'Helicopter' }],
      workAssignments: [
        {
          id: 1,
          assignee: 'unit-a',
          workAssignment: 'Alpha',
          resourceValues: { 'col-helo': { required: '1', have: '', need: '' } },
          overheadPositions: '',
          specialEquipmentSupplies: '',
          reportingLocation: '',
          requestedArrivalTime: '',
          status: '',
        },
      ],
    }
    const linked = applyHaveRosterLink(
      { required: '1', have: '', need: '' },
      [heloRef],
      sampleHaveLinkOptions
    )
    const next = patchResourceValueInDraft(draft, 1, 'col-helo', linked)
    expect(next.workAssignments[0]?.resourceValues['col-helo']?.have).toBe('1')
    expect(next.workAssignments[0]?.resourceValues['col-helo']?.linkedHaveRefs).toEqual([heloRef])
  })
})

describe('ics215-have-workspace-asset-eligibility', () => {
  it('collects workspace-assigned asset refs via assetKeyToHaveRef', () => {
    const refs = collectWorkspaceAssignedHaveRefs(
      [boatAlpha, boatCharlie],
      sampleHaveLinkOptions
    )

    expect(refs.has(boatAlphaRef)).toBe(true)
    expect(refs.has(boatCharlieRef)).toBe(true)
  })

  it('allows workspace-assigned asset refs on confirm without next-OP scheduling', () => {
    const nextOpEligibleRefs = new Set<string>()
    const workspaceAssignedRefs = collectWorkspaceAssignedHaveRefs(
      [boatAlpha, boatCharlie],
      sampleHaveLinkOptions
    )

    expect(
      isHaveRefEligibleForConfirm(boatAlphaRef, {
        nextOpEligibleRefs,
        workspaceAssignedRefs,
      })
    ).toBe(true)

    const filtered = filterHaveRefsEligibleForConfirm([boatAlphaRef, boatCharlieRef], {
      nextOpEligibleRefs,
      workspaceAssignedRefs,
    })

    expect(filtered.eligibleRefs).toEqual([boatAlphaRef, boatCharlieRef])
    expect(filtered.strippedRosterOnlyCount).toBe(0)
  })

  it('still requires next-OP scheduling for roster-only refs', () => {
    const nextOpEligibleRefs = new Set<string>([memberRef])
    const workspaceAssignedRefs = collectWorkspaceAssignedHaveRefs(
      [boatAlpha],
      sampleHaveLinkOptions
    )

    expect(
      isHaveRefEligibleForConfirm(scheduledMemberRef, {
        nextOpEligibleRefs,
        workspaceAssignedRefs,
      })
    ).toBe(false)

    const filtered = filterHaveRefsEligibleForConfirm(
      [boatAlphaRef, scheduledMemberRef],
      {
        nextOpEligibleRefs,
        workspaceAssignedRefs,
      }
    )

    expect(filtered.eligibleRefs).toEqual([boatAlphaRef])
    expect(filtered.strippedRosterOnlyCount).toBe(1)
  })

  it('does not mark workspace-assigned asset refs stale when absent from nextOpEligibleRefs', () => {
    const workspaceAssignedRefs = collectWorkspaceAssignedHaveRefs(
      [boatAlpha],
      sampleHaveLinkOptions
    )
    const { staleRefs } = partitionHaveLinkRefs(
      sampleHaveLinkOptions,
      [boatAlphaRef],
      new Set<string>(),
      workspaceAssignedRefs
    )

    expect(staleRefs).toEqual([])
  })

  it('marks workspace asset refs stale when no longer assigned to workspace', () => {
    const workspaceAssignedRefs = collectWorkspaceAssignedHaveRefs([], sampleHaveLinkOptions)
    const { staleRefs } = partitionHaveLinkRefs(
      sampleHaveLinkOptions,
      [boatAlphaRef],
      new Set<string>(),
      workspaceAssignedRefs
    )

    expect(staleRefs).toEqual([boatAlphaRef])
  })
})

describe('ics215-need-recalc', () => {
  it('computes need as required minus have', () => {
    expect(computeIcs215Need('3', '1')).toBe('2')
    expect(computeIcs215Need('2', '')).toBe('2')
    expect(computeIcs215Need('', '1')).toBe('')
    expect(computeIcs215Need('1', '5')).toBe('0')
  })

  it('applyIcs215NeedRecalc updates need on resource value', () => {
    const next = applyIcs215NeedRecalc({ required: '4', have: '1', need: '' })
    expect(next.need).toBe('3')
  })
})
