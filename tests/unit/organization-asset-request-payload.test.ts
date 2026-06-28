import { describe, expect, it } from 'vitest'
import { parseResourceRequestPayload } from '../../api/organization-asset-request-shared.js'
import { buildResourceRequestFromInput } from '@/lib/ics-213rr-resource-request'
import { applyNeedSeedToCreateInput, buildPrefilledLineItemFromNeedContext } from '@/lib/asset-request-ics215-prefill'
import { createEmptyResourceRequestInput } from '@/lib/ics-213rr-resource-request'

describe('parseResourceRequestPayload', () => {
  it('accepts ICS-215 Need-linked line items without kind, type, or reporting location', () => {
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

    const request = buildResourceRequestFromInput(input, {
      id: 1,
      requestNumber: 'RR-2026-0001',
    })

    const parsed = parseResourceRequestPayload({
      organizationId: 'org-1',
      payload: request,
    })

    expect(parsed).not.toBeNull()
    expect(parsed?.ics215NeedLink).toBeTruthy()
  })

  it('still requires kind and type for non-need-linked requests', () => {
    const lineItem = buildPrefilledLineItemFromNeedContext({
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
    })

    const request = buildResourceRequestFromInput(
      {
        ...createEmptyResourceRequestInput(),
        incidentName: 'Storm Alpha',
        requestedByName: 'Planner',
        items: [lineItem],
      },
      { id: 1, requestNumber: 'RR-2026-0002' }
    )

    expect(
      parseResourceRequestPayload({
        organizationId: 'org-1',
        payload: request,
      })
    ).toBeNull()
  })
})
