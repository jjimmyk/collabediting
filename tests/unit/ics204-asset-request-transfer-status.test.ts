import { describe, expect, it } from 'vitest'
import { isIcs204ResourcePendingWorkspaceAssignment } from '@/features/ics204/ics204-asset-request-transfer-status'
import type { Ics204ResourceAssignedRow } from '@/features/ics204/types'
import type { ResourceRequestItem } from '@/lib/ics-213rr-resource-request'
import { normalizeResourceRequestItem } from '@/lib/ics-213rr-resource-request'

const assetKey = 'helo-1'
const targetWorkspaceId = 'ws-target'

const row: Ics204ResourceAssignedRow = {
  id: 1,
  resourceId: 1,
  assetKey,
  reportingInfoNotes: '',
  has204A: false,
  resourceSnapshot: null,
  assetRequestNeedLink: {
    assetRequestStorageRecordId: 'req-1',
    assetRequestNumber: 'RR-2026-0001',
    ics215RowId: 1,
    ics215ColumnId: 'helo',
    assetKey,
  },
}

function buildRequest(
  overrides: Partial<ResourceRequestItem> = {}
): ResourceRequestItem {
  return normalizeResourceRequestItem({
    id: 1,
    mapLocation: [0, 0],
    status: 'Approved',
    incidentName: 'Storm',
    dateTimeInitiated: '2026-01-01',
    requestNumber: 'RR-2026-0001',
    items: [],
    sourceWorkspaceId: targetWorkspaceId,
    storageRecordId: 'req-1',
    assetTransferConfirmations: [
      {
        assetKey,
        confirmed: false,
        previousWorkspaceId: 'ws-other',
        targetWorkspaceId,
        appliedAt: null,
      },
    ],
    ...overrides,
  })
}

describe('ics204-asset-request-transfer-status', () => {
  it('is pending when transfer is not confirmed', () => {
    const request = buildRequest()
    const resolveAsset = () => ({ assignedWorkspaceId: 'ws-other' })
    expect(isIcs204ResourcePendingWorkspaceAssignment(row, request, resolveAsset)).toBe(true)
  })

  it('is not pending when asset is already in target workspace', () => {
    const request = buildRequest()
    const resolveAsset = () => ({ assignedWorkspaceId: targetWorkspaceId })
    expect(isIcs204ResourcePendingWorkspaceAssignment(row, request, resolveAsset)).toBe(false)
  })

  it('is not pending for non-need-synced rows', () => {
    const request = buildRequest()
    expect(
      isIcs204ResourcePendingWorkspaceAssignment(
        { ...row, assetRequestNeedLink: null },
        request,
        () => ({ assignedWorkspaceId: 'ws-other' })
      )
    ).toBe(false)
  })
})
