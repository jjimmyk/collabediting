import { describe, expect, it } from 'vitest'
import {
  collectNeedLinkedAssetsForAssignee,
  mergeResourcesAssignedFrom215Need,
  syncIcs204ResourcesAssignedFromIcs215Need,
} from '@/features/ics204/sync-ics215-need-asset-requests'
import { createEmptyIcs204Form } from '@/features/ics204/utils'
import { applyNeedAssetRequestLink } from '@/features/ics215/ics215-need-asset-request-link'
import { createEmptyIcs215Form } from '@/features/ics215/utils'
import type { Ics204NeedAssetRequestSyncContext } from '@/features/ics204/sync-ics215-need-asset-requests'
import type { ResourceRequestItem } from '@/lib/ics-213rr-resource-request'
import { normalizeResourceRequestItem } from '@/lib/ics-213rr-resource-request'

const assignee = 'position:Division Alpha'
const assetKey = 'org-helo-1'

const syncContext: Ics204NeedAssetRequestSyncContext = {
  roster: [],
  assetsByKey: {
    [assetKey]: {
      id: 1,
      assetKey,
      areaKey: 'atlantic',
      name: 'MH-65 Dolphin',
      assetStatus: 'FMC',
      assetStatusUpdatedAt: '',
      owner: '',
      status: 'Assigned',
      type: 'Helicopter',
      teamLead: '',
      eta: '',
      location: '',
      notes: '',
      pointOfContact: '',
      quantity: 1,
      currentLocation: '',
      mapLocation: [0, 0],
    },
  },
  haveLinkTargetOptions: [],
  assetRequestsByStorageId: {},
  workspaceOptions: [],
  resolveAsset: (key) => syncContext.assetsByKey[key] ?? null,
}

function buildRequest(): ResourceRequestItem {
  return normalizeResourceRequestItem({
    id: 1,
    mapLocation: [0, 0],
    status: 'Pending',
    incidentName: 'Storm',
    dateTimeInitiated: '2026-01-01',
    requestNumber: 'RR-2026-0001',
    items: [
      {
        id: 'line-1',
        quantity: 1,
        kind: 'Helicopter',
        type: 'MH-65',
        priority: 'R',
        detailedItemDescription: 'Perimeter',
        requestedReportingLocation: 'ICP',
        dateTime: '',
        orderNumber: '',
        estimatedTimeOfArrival: '',
        costPerUnit: null,
        totalCost: null,
        suggestedSourcesOfSupplyAndSubstitutes: '',
        assetsToTransfer: [
          {
            assetKey,
            organizationAssetId: 'org-asset-1',
            name: 'MH-65 Dolphin',
            type: 'Helicopter',
          },
        ],
      },
    ],
    storageRecordId: 'req-storage-1',
  })
}

function build215WithNeedLink(request: ResourceRequestItem) {
  const form = createEmptyIcs215Form('fixture-215')
  form.resourceColumns = [{ id: 'helicopter', label: 'Helicopter' }]
  form.workAssignments = [
    {
      id: 1,
      assignee,
      workAssignment: 'Perimeter',
      resourceValues: {
        helicopter: applyNeedAssetRequestLink(
          { required: '1', have: '0', need: '1' },
          { storageRecordId: request.storageRecordId!, requestNumber: request.requestNumber }
        ),
      },
      overheadPositions: '',
      specialEquipmentSupplies: '',
      reportingLocation: 'ICP',
      requestedArrivalTime: '',
      status: '',
    },
  ]
  return form
}

describe('sync-ics215-need-asset-requests', () => {
  it('collects transfer assets for assignee from linked need cells', () => {
    const request = buildRequest()
    const form = build215WithNeedLink(request)
    const entries = collectNeedLinkedAssetsForAssignee(form, assignee, {
      [request.storageRecordId!]: request,
    })
    expect(entries).toHaveLength(1)
    expect(entries[0]?.assetKey).toBe(assetKey)
  })

  it('merges need-synced rows and preserves manual rows', () => {
    const request = buildRequest()
    const form = build215WithNeedLink(request)
    const incoming = collectNeedLinkedAssetsForAssignee(form, assignee, {
      [request.storageRecordId!]: request,
    })
    const manual = {
      id: 99,
      resourceId: null,
      assetKey: 'manual-asset',
      reportingInfoNotes: 'Manual',
      has204A: false,
      resourceSnapshot: null,
      manualRosterRef: 'org_chart_asset:manual-asset',
    }
    const merged = mergeResourcesAssignedFrom215Need([manual], incoming, {
      ...syncContext,
      assetRequestsByStorageId: { [request.storageRecordId!]: request },
    })
    expect(merged).toHaveLength(2)
    expect(merged.some((row) => row.assetKey === assetKey)).toBe(true)
    expect(merged.some((row) => row.assetKey === 'manual-asset')).toBe(true)
  })

  it('syncs ICS-204 resources assigned from ICS-215 need links', () => {
    const request = buildRequest()
    const form215 = build215WithNeedLink(request)
    const form204 = createEmptyIcs204Form('fixture-204')
    form204.assignedUnit = assignee

    const synced = syncIcs204ResourcesAssignedFromIcs215Need(form204, form215, {
      ...syncContext,
      assetRequestsByStorageId: { [request.storageRecordId!]: request },
    })

    expect(synced.resourcesAssigned).toHaveLength(1)
    expect(synced.resourcesAssigned[0]?.assetRequestNeedLink?.assetRequestNumber).toBe(
      'RR-2026-0001'
    )
  })
})
