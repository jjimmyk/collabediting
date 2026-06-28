import { describe, expect, it } from 'vitest'
import {
  buildInitialTransferConfirmations,
  buildResourceRequestFromInput,
  collectUniqueTransferAssets,
  createEmptyAssetRequestLineItem,
  createEmptyResourceRequestInput,
  getPendingTransferConfirmations,
  filterResourceRequestsForWorkspace,
  normalizeResourceRequestItem,
  validateCreateResourceRequestInput,
  type AssetRequestLineItem,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

function lineItemWithTransfer(
  assetKey: string,
  overrides: Partial<AssetRequestLineItem> = {}
): AssetRequestLineItem {
  return {
    ...createEmptyAssetRequestLineItem(),
    kind: 'Teams',
    type: 'Engine',
    detailedItemDescription: 'Support crew',
    requestedReportingLocation: 'Staging',
    assetsToTransfer: [
      {
        assetKey,
        organizationAssetId: `org-${assetKey}`,
        name: `Asset ${assetKey}`,
        type: 'Engine',
      },
    ],
    ...overrides,
  }
}

describe('asset request workspace context', () => {
  it('validates locked incident name for workspace-linked requests', () => {
    const input = createEmptyResourceRequestInput({
      incidentName: 'Wrong name',
      sourceWorkspaceId: 'ws-1',
      sourceWorkspaceName: 'Workspace Alpha',
    })
    input.requestedByName = 'Alex'
    input.items = [lineItemWithTransfer('asset-1')]

    expect(validateCreateResourceRequestInput(input)).toBe(
      'Incident name must match the linked workspace.'
    )
  })

  it('persists workspace linkage fields on create', () => {
    const input = createEmptyResourceRequestInput({
      incidentName: 'Workspace Alpha',
      sourceWorkspaceId: 'ws-1',
      sourceWorkspaceKind: 'incident',
      sourceWorkspaceName: 'Workspace Alpha',
    })
    input.requestedByName = 'Alex'
    input.items = [lineItemWithTransfer('asset-1')]
    input.assetTransferConfirmations = [
      {
        assetKey: 'asset-1',
        confirmed: true,
        previousWorkspaceId: null,
        targetWorkspaceId: 'ws-1',
        appliedAt: null,
      },
    ]

    const request = buildResourceRequestFromInput(input, { id: 1, requestNumber: 'RR-2026-0001' })

    expect(request.sourceWorkspaceId).toBe('ws-1')
    expect(request.sourceWorkspaceKind).toBe('incident')
    expect(request.sourceWorkspaceName).toBe('Workspace Alpha')
    expect(request.assetTransferConfirmations).toHaveLength(1)
  })
})

describe('asset request transfer helpers', () => {
  it('dedupes transfer assets across line items', () => {
    const items = [
      lineItemWithTransfer('asset-1'),
      lineItemWithTransfer('asset-1'),
      lineItemWithTransfer('asset-2'),
    ]

    expect(collectUniqueTransferAssets(items)).toHaveLength(2)
  })

  it('defaults confirmation to checked when asset is not already assigned', () => {
    const confirmations = buildInitialTransferConfirmations(
      [lineItemWithTransfer('asset-1')],
      'ws-target',
      () => ({ assignedWorkspaceId: 'ws-other' })
    )

    expect(confirmations[0]?.confirmed).toBe(true)
    expect(confirmations[0]?.targetWorkspaceId).toBe('ws-target')
  })

  it('defaults confirmation to unchecked when asset is already in target workspace', () => {
    const confirmations = buildInitialTransferConfirmations(
      [lineItemWithTransfer('asset-1')],
      'ws-target',
      () => ({ assignedWorkspaceId: 'ws-target' })
    )

    expect(confirmations[0]?.confirmed).toBe(false)
  })

  it('returns only confirmed pending transfers for apply', () => {
    const request = normalizeResourceRequestItem({
      id: 1,
      sourceWorkspaceId: 'ws-target',
      assetTransferConfirmations: [
        {
          assetKey: 'asset-1',
          confirmed: true,
          previousWorkspaceId: 'ws-other',
          targetWorkspaceId: 'ws-target',
        },
        {
          assetKey: 'asset-2',
          confirmed: false,
          previousWorkspaceId: null,
          targetWorkspaceId: 'ws-target',
        },
      ],
      items: [lineItemWithTransfer('asset-1'), lineItemWithTransfer('asset-2')],
    } as Partial<ResourceRequestItem>)

    const pending = getPendingTransferConfirmations(request, (assetKey) =>
      assetKey === 'asset-1'
        ? { assignedWorkspaceId: 'ws-other' }
        : { assignedWorkspaceId: null }
    )

    expect(pending).toHaveLength(1)
    expect(pending[0]?.assetKey).toBe('asset-1')
  })
})

describe('workspace asset request filtering', () => {
  it('filters requests by source workspace id', () => {
    const requests = [
      normalizeResourceRequestItem({
        id: 1,
        sourceWorkspaceId: 'ws-a',
        incidentName: 'A',
      } as Partial<ResourceRequestItem>),
      normalizeResourceRequestItem({
        id: 2,
        sourceWorkspaceId: 'ws-b',
        incidentName: 'B',
      } as Partial<ResourceRequestItem>),
    ]

    expect(filterResourceRequestsForWorkspace(requests, 'ws-a')).toHaveLength(1)
    expect(filterResourceRequestsForWorkspace(requests, 'ws-a')[0]?.id).toBe(1)
  })
})

describe('asset request line items table helpers', () => {
  it('line items retain stable ids when patched through table-style updates', () => {
    const item = createEmptyAssetRequestLineItem()
    const originalId = item.id

    const updated = {
      ...item,
      kind: 'Teams',
      type: 'Fire Support',
      quantity: 3,
      detailedItemDescription: 'Updated inline',
      requestedReportingLocation: 'Command post',
    }

    expect(updated.id).toBe(originalId)
    expect(updated.kind).toBe('Teams')
    expect(updated.quantity).toBe(3)
    expect(updated.detailedItemDescription).toBe('Updated inline')
  })

  it('supports removing an item while preserving others', () => {
    const first = createEmptyAssetRequestLineItem()
    const second = createEmptyAssetRequestLineItem()
    const items = [first, second]
    const remaining = items.filter((item) => item.id !== first.id)

    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.id).toBe(second.id)
  })
})
