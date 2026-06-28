import { describe, expect, it } from 'vitest'
import {
  applyNeedSeedToCreateInput,
  buildPrefilledLineItemFromNeedContext,
} from '@/lib/asset-request-ics215-prefill'
import { createEmptyResourceRequestInput } from '@/lib/ics-213rr-resource-request'

describe('asset-request-ics215-prefill', () => {
  it('maps column label and need quantity into line item', () => {
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

    expect(lineItem.kind).toBe('Helicopter')
    expect(lineItem.type).toBe('MH-65')
    expect(lineItem.quantity).toBe(2)
    expect(lineItem.requestedReportingLocation).toBe('ICP')
    expect(lineItem.detailedItemDescription).toContain('Perimeter patrol')
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
})
