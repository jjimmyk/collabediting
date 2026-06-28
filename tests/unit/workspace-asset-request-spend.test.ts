import { describe, expect, it } from 'vitest'
import {
  aggregateWorkspaceSpendByDay,
  aggregateWorkspaceSpendSummary,
  filterSpendRowsByDateRange,
  flattenWorkspaceAssetRequestSpendRows,
  resolveLineItemSpendAmount,
  resolveSpendRowAssignee,
  resolveSpendRowLastUpdatedAt,
} from '@/features/analytics/workspace-asset-request-spend'
import type { ResourceRequestItem } from '@/lib/ics-213rr-resource-request'

function buildRequest(
  overrides: Partial<ResourceRequestItem> = {}
): ResourceRequestItem {
  return {
    id: 1,
    mapLocation: [-90, 30],
    status: 'Pending',
    incidentName: 'Test Incident',
    dateTimeInitiated: '2026-01-01T08:00:00.000Z',
    requestNumber: 'RR-2026-0001',
    items: [
      {
        id: 'line-1',
        quantity: 2,
        kind: 'Teams',
        type: 'Fire',
        priority: 'R',
        detailedItemDescription: 'Crew support',
        requestedReportingLocation: 'Staging',
        dateTime: '01/15/2026 10:00',
        orderNumber: 'ORD-1',
        estimatedTimeOfArrival: '',
        costPerUnit: 125,
        totalCost: null,
        suggestedSourcesOfSupplyAndSubstitutes: '',
        assetsToTransfer: [],
      },
    ],
    orderQuantity: 2,
    orderKind: 'Teams',
    orderType: 'Fire',
    orderPriority: 'R',
    orderDetailedDescription: 'Crew support',
    orderRequestedReportingLocation: 'Staging',
    orderLocationDateTime: '01/15/2026 10:00',
    orderNumberLsc: 'ORD-1',
    orderEtaLsc: '',
    orderCostLsc: '',
    suggestedSourcesAndSubstitutes: '',
    requestedByName: 'Alex',
    requestedByPosition: 'Ops',
    requestedByDateTime: '2026-01-01T08:00:00.000Z',
    sectionChiefApprovalName: '',
    sectionChiefApprovalPosition: '',
    sectionChiefApprovalSignature: '',
    sectionChiefApprovalDateTime: '',
    reslTactical: false,
    reslPersonnel: false,
    reslTacticalResources: false,
    reslResourceAvailable: false,
    reslResourceNotAvailable: false,
    reslReviewName: '',
    reslReviewSignature: '',
    reslReviewDateTime: '',
    requisitionPurchaseOrderNumber: '',
    supplierNamePhoneFaxEmail: '',
    notes: '',
    logisticsApprovalName: '',
    logisticsApprovalPosition: '',
    logisticsApprovalSignature: '',
    logisticsApprovalDateTime: '',
    orderPlacedBySpul: false,
    orderPlacedByProc: false,
    orderPlacedByOther: false,
    orderPlacedByOtherText: '',
    orderPlacedSignature: '',
    orderPlacedDateTime: '',
    financeReplyComments: '',
    financeApprovalName: '',
    financeApprovalPosition: '',
    financeApprovalSignature: '',
    financeApprovalDateTime: '',
    sourceWorkspaceId: 'ws-1',
    storageRecordId: 'storage-1',
    recordUpdatedAt: '2026-01-15T14:30:00.000Z',
    recordCreatedAt: '2026-01-01T08:00:00.000Z',
    ...overrides,
  }
}

describe('workspace-asset-request-spend', () => {
  it('resolves line item spend from total cost or quantity x unit cost', () => {
    expect(
      resolveLineItemSpendAmount({
        id: 'a',
        quantity: 4,
        kind: '',
        type: '',
        priority: 'R',
        detailedItemDescription: '',
        requestedReportingLocation: '',
        dateTime: '',
        orderNumber: '',
        estimatedTimeOfArrival: '',
        costPerUnit: 10,
        totalCost: null,
        suggestedSourcesOfSupplyAndSubstitutes: '',
        assetsToTransfer: [],
      })
    ).toBe(40)

    expect(
      resolveLineItemSpendAmount({
        id: 'b',
        quantity: 4,
        kind: '',
        type: '',
        priority: 'R',
        detailedItemDescription: '',
        requestedReportingLocation: '',
        dateTime: '',
        orderNumber: '',
        estimatedTimeOfArrival: '',
        costPerUnit: 10,
        totalCost: 99,
        suggestedSourcesOfSupplyAndSubstitutes: '',
        assetsToTransfer: [],
      })
    ).toBe(99)
  })

  it('flattens workspace requests into spend rows with derived totals', () => {
    const rows = flattenWorkspaceAssetRequestSpendRows([buildRequest()], 'ws-1')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.resolvedTotalCost).toBe(250)
    expect(rows[0]?.totalCostIsDerived).toBe(true)
    expect(rows[0]?.description).toContain('Teams')
  })

  it('excludes requests from other workspaces', () => {
    const rows = flattenWorkspaceAssetRequestSpendRows(
      [buildRequest({ sourceWorkspaceId: 'ws-other' })],
      'ws-1'
    )
    expect(rows).toHaveLength(0)
  })

  it('includes assignee only for matching workspace need links', () => {
    const linked = buildRequest({
      ics215NeedLink: {
        workspaceId: 'ws-1',
        rowId: 1,
        columnId: 'helo',
        assigneeKey: 'position:Alpha',
        columnLabel: 'Helicopter',
        workAssignment: 'Perimeter',
        reportingLocation: 'ICP',
      },
    })
    const otherWorkspaceLink = buildRequest({
      id: 2,
      requestNumber: 'RR-2026-0002',
      ics215NeedLink: {
        workspaceId: 'ws-other',
        rowId: 2,
        columnId: 'helo',
        assigneeKey: 'position:Beta',
        columnLabel: 'Helicopter',
        workAssignment: 'Perimeter',
        reportingLocation: 'ICP',
      },
    })

    expect(resolveSpendRowAssignee(linked, 'ws-1')).toContain('Alpha')
    expect(resolveSpendRowAssignee(otherWorkspaceLink, 'ws-1')).toBeNull()
  })

  it('filters rows by analytics date range using last updated timestamps', () => {
    const rows = flattenWorkspaceAssetRequestSpendRows([buildRequest()], 'ws-1')
    const filtered = filterSpendRowsByDateRange(
      rows,
      '2026-01-15T00:00',
      '2026-01-15T23:59'
    )
    expect(filtered).toHaveLength(1)

    const excluded = filterSpendRowsByDateRange(
      rows,
      '2026-02-01T00:00',
      '2026-02-28T23:59'
    )
    expect(excluded).toHaveLength(0)
  })

  it('aggregates spend summary excluding unpriced rows from totals', () => {
    const priced = flattenWorkspaceAssetRequestSpendRows([buildRequest()], 'ws-1')
    const unpriced = flattenWorkspaceAssetRequestSpendRows(
      [
        buildRequest({
          id: 2,
          requestNumber: 'RR-2026-0002',
          items: [
            {
              id: 'line-2',
              quantity: 1,
              kind: 'Fuel',
              type: 'Diesel',
              priority: 'R',
              detailedItemDescription: '',
              requestedReportingLocation: '',
              dateTime: '',
              orderNumber: '',
              estimatedTimeOfArrival: '',
              costPerUnit: null,
              totalCost: null,
              suggestedSourcesOfSupplyAndSubstitutes: '',
              assetsToTransfer: [],
            },
          ],
        }),
      ],
      'ws-1'
    )

    const summary = aggregateWorkspaceSpendSummary([...priced, ...unpriced])
    expect(summary.totalSpend).toBe(250)
    expect(summary.pricedRowCount).toBe(1)
    expect(summary.unpricedRowCount).toBe(1)
    expect(summary.totalQuantity).toBe(3)
  })

  it('aggregates daily spend buckets in local calendar days', () => {
    const rows = flattenWorkspaceAssetRequestSpendRows([buildRequest()], 'ws-1')
    const buckets = aggregateWorkspaceSpendByDay(rows)
    expect(buckets).toHaveLength(1)
    expect(buckets[0]?.totalSpend).toBe(250)
    expect(buckets[0]?.rowCount).toBe(1)
  })

  it('falls back through request timestamps and line item date/time', () => {
    const request = buildRequest({
      recordUpdatedAt: undefined,
      recordCreatedAt: '2026-01-10T12:00:00.000Z',
    })
    const lineItem = request.items[0]!
    expect(resolveSpendRowLastUpdatedAt(request, lineItem).iso).toBe('2026-01-10T12:00:00.000Z')
  })
})
