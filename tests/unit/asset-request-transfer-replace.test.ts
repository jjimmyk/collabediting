import { describe, expect, it } from 'vitest'
import {
  buildAssetRequestTransferRef,
  canReplaceTransferAsset,
  createEmptyAssetRequestLineItem,
  normalizeResourceRequestItem,
  replaceTransferAssetInRequest,
  type AssetRequestLineItem,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

function lineItemWithTransfer(assetKey: string): AssetRequestLineItem {
  return {
    ...createEmptyAssetRequestLineItem(),
    kind: 'Teams',
    type: 'Engine',
    detailedItemDescription: 'Support',
    requestedReportingLocation: 'Staging',
    assetsToTransfer: [
      buildAssetRequestTransferRef({
        assetKey,
        organizationAssetId: `org-${assetKey}`,
        name: `Asset ${assetKey}`,
        type: 'Engine',
      }),
    ],
  }
}

function buildRequest(overrides: Partial<ResourceRequestItem> = {}): ResourceRequestItem {
  return normalizeResourceRequestItem({
    id: 1,
    sourceWorkspaceId: 'ws-target',
    sourceWorkspaceName: 'Target Workspace',
    incidentName: 'Target Workspace',
    items: [lineItemWithTransfer('asset-old'), lineItemWithTransfer('asset-old')],
    assetTransferConfirmations: [
      {
        assetKey: 'asset-old',
        confirmed: true,
        previousWorkspaceId: 'ws-other',
        targetWorkspaceId: 'ws-target',
      },
    ],
    ...overrides,
  } as Partial<ResourceRequestItem>)
}

describe('replaceTransferAssetInRequest', () => {
  it('replaces asset across all line items and confirmations', () => {
    const request = buildRequest()
    const updated = replaceTransferAssetInRequest(
      request,
      'asset-old',
      buildAssetRequestTransferRef({
        assetKey: 'asset-new',
        organizationAssetId: 'org-new',
        name: 'New Asset',
        type: 'Engine',
      }),
      (assetKey) =>
        assetKey === 'asset-new'
          ? { assignedWorkspaceId: 'ws-other' }
          : { assignedWorkspaceId: 'ws-other' }
    )

    expect(updated.items.every((item) => item.assetsToTransfer[0]?.assetKey === 'asset-new')).toBe(
      true
    )
    expect(updated.assetTransferConfirmations?.some((entry) => entry.assetKey === 'asset-old')).toBe(
      false
    )
    expect(updated.assetTransferConfirmations?.some((entry) => entry.assetKey === 'asset-new')).toBe(
      true
    )
  })

  it('blocks replace when transfer already applied', () => {
    const request = buildRequest({
      assetTransferConfirmations: [
        {
          assetKey: 'asset-old',
          confirmed: true,
          previousWorkspaceId: 'ws-other',
          targetWorkspaceId: 'ws-target',
          appliedAt: '2026-06-22T12:00:00.000Z',
        },
      ],
    })

    expect(canReplaceTransferAsset(request, 'asset-old', () => ({ assignedWorkspaceId: 'ws-target' }))).toBe(
      false
    )
    expect(() =>
      replaceTransferAssetInRequest(
        request,
        'asset-old',
        buildAssetRequestTransferRef({
          assetKey: 'asset-new',
          name: 'New Asset',
          type: 'Engine',
        }),
        () => ({ assignedWorkspaceId: 'ws-target' })
      )
    ).toThrow(/already been transferred/)
  })
})
