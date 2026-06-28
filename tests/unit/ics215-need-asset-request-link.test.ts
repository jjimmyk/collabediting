import { describe, expect, it } from 'vitest'
import {
  applyNeedAssetRequestLink,
  applyNeedAssetRequestLinkToWorkAssignmentsDraft,
  buildNeedLinkIndex,
  clearNeedAssetRequestLink,
  getConflictingNeedRequestIds,
  isNeedLinkedToAssetRequest,
  resolveNeedDisplayValue,
} from '@/features/ics215/ics215-need-asset-request-link'
import { createEmptyIcs215Form } from '@/features/ics215/utils'

describe('ics215-need-asset-request-link', () => {
  it('shows request number when linked', () => {
    const linked = applyNeedAssetRequestLink(
      { required: '2', have: '1', need: '1' },
      { storageRecordId: 'req-1', requestNumber: 'RR-2026-0001' }
    )
    expect(isNeedLinkedToAssetRequest(linked)).toBe(true)
    expect(resolveNeedDisplayValue(linked)).toBe('RR-2026-0001')
  })

  it('computes need when unlinked', () => {
    expect(resolveNeedDisplayValue({ required: '3', have: '1', need: '' })).toBe('2')
  })

  it('builds global index and detects conflicts', () => {
    const form = createEmptyIcs215Form('fixture')
    form.resourceColumns = [{ id: 'helo', label: 'Helicopter' }]
    form.workAssignments = [
      {
        id: 1,
        assignee: 'position:Alpha',
        workAssignment: 'Perimeter',
        resourceValues: {
          helo: applyNeedAssetRequestLink(
            { required: '1', have: '0', need: '1' },
            { storageRecordId: 'req-1', requestNumber: 'RR-2026-0001' }
          ),
        },
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
    ]

    const index = buildNeedLinkIndex(form.workAssignments, form.resourceColumns, () => 'Alpha')
    expect(index.size).toBe(1)
    expect(
      getConflictingNeedRequestIds('req-1', { rowId: 2, columnId: 'helo' }, index)
    ).toHaveLength(1)
    expect(
      getConflictingNeedRequestIds('req-1', { rowId: 1, columnId: 'helo' }, index)
    ).toHaveLength(0)
  })

  it('applies and clears links on draft rows', () => {
    const form = createEmptyIcs215Form('fixture')
    form.resourceColumns = [{ id: 'helo', label: 'Helicopter' }]
    form.workAssignments = [
      {
        id: 1,
        assignee: 'position:Alpha',
        workAssignment: 'Perimeter',
        resourceValues: {
          helo: { required: '1', have: '0', need: '1' },
        },
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
    ]

    const linkedDraft = applyNeedAssetRequestLinkToWorkAssignmentsDraft(
      { resourceColumns: form.resourceColumns, workAssignments: form.workAssignments },
      { rowId: 1, columnId: 'helo' },
      { storageRecordId: 'req-1', requestNumber: 'RR-2026-0001' }
    )
    expect(
      isNeedLinkedToAssetRequest(linkedDraft.workAssignments[0]?.resourceValues.helo)
    ).toBe(true)

    const cleared = clearNeedAssetRequestLink(
      linkedDraft.workAssignments[0]!.resourceValues.helo!
    )
    expect(isNeedLinkedToAssetRequest(cleared)).toBe(false)
  })
})
