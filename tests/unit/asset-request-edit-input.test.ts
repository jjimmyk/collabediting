import { describe, expect, it } from 'vitest'
import {
  buildResourceRequestFromInput,
  buildUpdatedResourceRequestFromInput,
  createEmptyAssetRequestLineItem,
  createEmptyResourceRequestInput,
  mergeTransferConfirmationsForUpdate,
  resourceRequestToEditInput,
  validateCreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'
import { applyNeedSeedToCreateInput } from '@/lib/asset-request-ics215-prefill'

describe('resourceRequestToEditInput', () => {
  it('strips id while preserving storage metadata and need link', () => {
    const request = buildResourceRequestFromInput(
      {
        ...createEmptyResourceRequestInput({
          requestedByName: 'Planner',
          incidentName: 'Storm Alpha',
        }),
        items: [
          {
            ...createEmptyAssetRequestLineItem(),
            detailedItemDescription: 'Helicopter',
            quantity: 2,
          },
        ],
        ics215NeedLink: {
          workspaceId: 'ws-1',
          rowId: 1,
          columnId: 'helo',
          assigneeKey: 'position:Alpha',
          columnLabel: 'Helicopter',
          workAssignment: 'Perimeter',
          reportingLocation: 'ICP',
        },
      },
      { id: 42, requestNumber: 'RR-2026-0042' }
    )

    const withMetadata = {
      ...request,
      storageRecordId: 'rec-1',
      recordCreatedAt: '2026-06-01T00:00:00.000Z',
      recordUpdatedAt: '2026-06-02T00:00:00.000Z',
      recordCreatedByName: 'Planner',
    }

    const input = resourceRequestToEditInput(withMetadata)
    expect('id' in input).toBe(false)
    expect(input.ics215NeedLink?.columnLabel).toBe('Helicopter')
    expect(input.items[0]?.quantity).toBe(2)
  })
})

describe('buildUpdatedResourceRequestFromInput', () => {
  it('preserves immutable request identity and metadata', () => {
    const existing = buildResourceRequestFromInput(
      {
        ...createEmptyResourceRequestInput({
          requestedByName: 'Planner',
          incidentName: 'Storm Alpha',
        }),
        items: [
          {
            ...createEmptyAssetRequestLineItem(),
            kind: 'Air',
            type: 'Helicopter',
            detailedItemDescription: 'Helicopter',
            requestedReportingLocation: 'ICP',
          },
        ],
      },
      { id: 7, requestNumber: 'RR-2026-0007' }
    )

    const existingWithMeta = {
      ...existing,
      storageRecordId: 'rec-7',
      recordCreatedAt: '2026-06-01T00:00:00.000Z',
      recordCreatedByName: 'Planner',
    }

    const input = resourceRequestToEditInput(existingWithMeta)
    const updated = buildUpdatedResourceRequestFromInput(existingWithMeta, {
      ...input,
      notes: 'Updated notes',
      items: [
        {
          ...input.items[0]!,
          quantity: 3,
        },
      ],
    })

    expect(updated.id).toBe(7)
    expect(updated.requestNumber).toBe('RR-2026-0007')
    expect(updated.storageRecordId).toBe('rec-7')
    expect(updated.notes).toBe('Updated notes')
    expect(updated.items[0]?.quantity).toBe(3)
    expect(validateCreateResourceRequestInput(resourceRequestToEditInput(updated))).toBeNull()
  })

  it('allows need-linked updates without kind or type', () => {
    const input = applyNeedSeedToCreateInput(
      {
        ...createEmptyResourceRequestInput({
          requestedByName: 'Planner',
          incidentName: 'Storm Alpha',
        }),
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

    const existing = buildResourceRequestFromInput(input, {
      id: 1,
      requestNumber: 'RR-2026-0001',
    })

    const updated = buildUpdatedResourceRequestFromInput(existing, {
      ...resourceRequestToEditInput({ ...existing, storageRecordId: 'rec-1' }),
      notes: 'Need-linked update',
    })

    expect(validateCreateResourceRequestInput(resourceRequestToEditInput(updated))).toBeNull()
  })
})

describe('mergeTransferConfirmationsForUpdate', () => {
  it('preserves appliedAt for assets still on the request', () => {
    const item = {
      ...createEmptyAssetRequestLineItem(),
      kind: 'Teams',
      type: 'Support',
      detailedItemDescription: 'Foam team',
      requestedReportingLocation: 'Staging',
      assetsToTransfer: [
        {
          assetKey: 'asset-1',
          name: 'Foam 1',
          type: 'Truck',
        },
      ],
    }

    const merged = mergeTransferConfirmationsForUpdate(
      [
        {
          assetKey: 'asset-1',
          confirmed: true,
          previousWorkspaceId: null,
          targetWorkspaceId: 'ws-1',
          appliedAt: '2026-06-01T12:00:00.000Z',
        },
      ],
      [item],
      'ws-1',
      () => null
    )

    expect(merged).toHaveLength(1)
    expect(merged[0]?.appliedAt).toBe('2026-06-01T12:00:00.000Z')
    expect(merged[0]?.confirmed).toBe(true)
  })
})
