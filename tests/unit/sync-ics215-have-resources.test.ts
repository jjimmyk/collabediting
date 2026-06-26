import { describe, expect, it } from 'vitest'
import {
  buildInitialResourcesAssignedFromIcs215,
  collectExistingResourceRefKeys,
  collectHaveRefsForAssignee,
  createManualIcs204ResourceAssignedRowFromRef,
  mergeResourcesAssignedFrom215,
  syncIcs204ResourcesAssignedFromIcs215,
  syncIcs215HaveResourcesToLinkedIcs204Forms,
  unlinkHaveRefFromIcs215Form,
} from '@/features/ics204/sync-ics215-have-resources'
import { buildIcs204Ics215ImportSnapshot } from '@/features/ics204/create-from-ics215'
import { createEmptyIcs204Form } from '@/features/ics204/utils'
import { applyHaveRosterLink } from '@/features/ics215/ics215-have-asset-link'
import { createEmptyIcs215Form } from '@/features/ics215/utils'
import type { Ics204HaveResourcesSyncContext } from '@/features/ics204/sync-ics215-have-resources'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

const assignee = 'position:Division Alpha'
const heloRef = 'org_chart_asset:helo-1'
const boatRef = 'org_chart_asset:boat-1'

const haveLinkTargetOptions: WorkAssignmentTargetOption[] = [
  {
    value: heloRef,
    label: 'MH-65 Dolphin',
    group: 'Assets',
    targetType: 'org_chart_asset',
  },
  {
    value: boatRef,
    label: 'Small Boat',
    group: 'Assets',
    targetType: 'org_chart_asset',
  },
]

const syncContext: Ics204HaveResourcesSyncContext = {
  roster: [],
  assetsByKey: {},
  haveLinkTargetOptions,
}

function build215WithHaveLinks() {
  const form = createEmptyIcs215Form('fixture-215')
  form.resourceColumns = [{ id: 'helicopter', label: 'Helicopter' }]
  form.workAssignments = [
    {
      id: 1,
      assignee,
      workAssignment: 'Perimeter',
      resourceValues: {
        helicopter: applyHaveRosterLink(
          { required: '1', have: '1', need: '0' },
          [heloRef, boatRef],
          haveLinkTargetOptions
        ),
      },
      overheadPositions: '',
      specialEquipmentSupplies: '',
      reportingLocation: '',
      requestedArrivalTime: '',
      status: '',
    },
  ]
  return form
}

describe('sync-ics215-have-resources', () => {
  it('collects Have refs for assignee across work assignment rows', () => {
    const form = build215WithHaveLinks()
    expect(collectHaveRefsForAssignee(form, assignee)).toEqual(
      expect.arrayContaining([heloRef, boatRef])
    )
  })

  it('merges 215-synced rows while preserving manual rows and notes', () => {
    const manual = createManualIcs204ResourceAssignedRowFromRef([], boatRef, syncContext)
    const existing = [
      { ...manual, id: 1 },
      {
        id: 2,
        resourceId: 99,
        assetKey: heloRef.split(':')[1],
        reportingInfoNotes: 'Keep these notes',
        has204A: true,
        resourceSnapshot: null,
        rosterHaveRef: heloRef,
        manualRosterRef: null,
        rosterHaveRefType: 'org_chart_asset',
        ics204a: null,
      },
    ]

    const merged = mergeResourcesAssignedFrom215(existing, [heloRef], syncContext)
    expect(merged).toHaveLength(2)
    expect(merged.find((row) => row.manualRosterRef === boatRef)).toBeTruthy()
    const synced = merged.find((row) => row.rosterHaveRef === heloRef)
    expect(synced?.reportingInfoNotes).toBe('Keep these notes')
    expect(synced?.has204A).toBe(true)
  })

  it('removes 215-synced rows when Have ref is cleared', () => {
    const existing = mergeResourcesAssignedFrom215([], [heloRef], syncContext).map((row, index) => ({
      ...row,
      id: index + 1,
    }))
    const merged = mergeResourcesAssignedFrom215(existing, [], syncContext)
    expect(merged).toHaveLength(0)
  })

  it('syncs linked ICS-204 forms from ICS-215 Have', () => {
    const ics215Form = build215WithHaveLinks()
    const ics204Form = {
      ...createEmptyIcs204Form('fixture-204'),
      assignedUnit: assignee,
      ics215Import: buildIcs204Ics215ImportSnapshot(ics215Form, assignee),
    }

    const updated = syncIcs215HaveResourcesToLinkedIcs204Forms(
      ics215Form,
      [ics204Form],
      syncContext
    )
    expect(updated).toHaveLength(1)
    expect(updated[0].resourcesAssigned).toHaveLength(2)
    expect(updated[0].resourcesAssigned.every((row) => row.rosterHaveRef)).toBe(true)
  })

  it('builds initial resources when creating ICS-204 from ICS-215', () => {
    const ics215Form = build215WithHaveLinks()
    const rows = buildInitialResourcesAssignedFromIcs215(ics215Form, assignee, syncContext)
    expect(rows).toHaveLength(2)
  })

  it('unlinks Have ref from ICS-215 when synced row is deleted on ICS-204', () => {
    const ics215Form = build215WithHaveLinks()
    const next215 = unlinkHaveRefFromIcs215Form(ics215Form, assignee, heloRef, syncContext)
    expect(collectHaveRefsForAssignee(next215, assignee)).toEqual([boatRef])
  })

  it('collectExistingResourceRefKeys includes roster and asset keys', () => {
    const form = createEmptyIcs204Form('fixture')
    const synced = syncIcs204ResourcesAssignedFromIcs215(
      { ...form, assignedUnit: assignee },
      build215WithHaveLinks(),
      syncContext
    )
    const keys = collectExistingResourceRefKeys(synced.resourcesAssigned)
    expect(keys.has(heloRef)).toBe(true)
    expect(keys.has(boatRef)).toBe(true)
  })
})
