import { describe, expect, it } from 'vitest'
import {
  applyNeedSeedToCreateInput,
  buildPrefilledLineItemFromNeedContext,
} from '@/lib/asset-request-ics215-prefill'
import {
  createEmptyResourceRequestInput,
  validateCreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'

describe('asset-request-ics215-prefill', () => {
  it('prefills description from column header only and leaves kind/location empty', () => {
    const lineItem = buildPrefilledLineItemFromNeedContext({
      rowId: 1,
      columnId: 'helo',
      columnLabel: 'Helicopter · MH-65',
      assigneeKey: 'position:Alpha',
      assigneeLabel: 'Alpha',
      workAssignment: 'Perimeter patrol',
      reportingLocation: 'ICP',
      required: '2',
      have: '0',
      need: '2',
    })

    expect(lineItem.kind).toBe('')
    expect(lineItem.type).toBe('')
    expect(lineItem.quantity).toBe(2)
    expect(lineItem.requestedReportingLocation).toBe('')
    expect(lineItem.detailedItemDescription).toBe('Helicopter · MH-65')
  })

  it('applies need seed to create input with ics215NeedLink', () => {
    const input = applyNeedSeedToCreateInput(createEmptyResourceRequestInput(), {
      workspaceId: 'ws-1',
      needContext: {
        rowId: 3,
        columnId: 'boat',
        columnLabel: 'Boat',
        assigneeKey: 'position:Bravo',
        assigneeLabel: 'Bravo',
        workAssignment: 'Water ops',
        reportingLocation: 'Staging',
        required: '1',
        have: '0',
        need: '1',
      },
    })

    expect(input.items).toHaveLength(1)
    expect(input.ics215NeedLink?.rowId).toBe(3)
    expect(input.ics215NeedLink?.workspaceId).toBe('ws-1')
  })

  it('allows need-linked create without kind, type, or reporting location', () => {
    const input = applyNeedSeedToCreateInput(
      {
        ...createEmptyResourceRequestInput(),
        incidentName: 'Storm Alpha',
        requestedByName: 'Planner',
      },
      {
        workspaceId: 'ws-1',
        needContext: {
          rowId: 1,
          columnId: 'helo',
          columnLabel: 'Helicopter',
          assigneeKey: 'position:Alpha',
          assigneeLabel: 'Alpha',
          workAssignment: 'Perimeter',
          reportingLocation: 'ICP',
          required: '1',
          have: '0',
          need: '1',
        },
      }
    )

    expect(validateCreateResourceRequestInput(input)).toBeNull()
  })
})
