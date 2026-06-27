import { describe, expect, it } from 'vitest'
import {
  buildResourceRequestFromInput,
  computeLineItemTotalCost,
  createEmptyAssetRequestLineItem,
  createEmptyResourceRequestInput,
  getResourceRequestItemCount,
  getResourceRequestLineItems,
  getResourceRequestSearchValues,
  getResourceRequestTotalQuantity,
  normalizeResourceRequestItem,
  validateAssetRequestLineItem,
  validateCreateResourceRequestInput,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

describe('asset request line items', () => {
  it('normalizes legacy flat requests into a single line item', () => {
    const normalized = normalizeResourceRequestItem({
      id: 9,
      mapLocation: [-90, 30],
      status: 'Pending',
      incidentName: 'Legacy Incident',
      dateTimeInitiated: '06/01/2026 08:00',
      requestNumber: 'RR-2026-0001',
      orderQuantity: 3,
      orderKind: 'Teams',
      orderType: 'Fire Support',
      orderPriority: 'U',
      orderDetailedDescription: 'Need crews',
      orderRequestedReportingLocation: 'Staging A',
      orderLocationDateTime: '06/01/2026 12:00',
      orderNumberLsc: 'ORD-1',
      orderEtaLsc: '06/01/2026 11:00',
      orderCostLsc: '$1,000',
      suggestedSourcesAndSubstitutes: 'County mutual aid',
      requestedByName: 'Alex Rivera',
      requestedByPosition: 'Ops',
      requestedByDateTime: '06/01/2026 08:00',
      notes: '',
      sectionChiefApprovalName: '',
      sectionChiefApprovalPosition: '',
      sectionChiefApprovalSignature: '',
      sectionChiefApprovalDateTime: '',
      reslTacticalResources: false,
      reslResourceAvailable: false,
      reslResourceNotAvailable: false,
      reslReviewName: '',
      reslReviewSignature: '',
      reslReviewDateTime: '',
      requisitionPurchaseOrderNumber: '',
      supplierNamePhoneFaxEmail: '',
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
    })

    expect(getResourceRequestItemCount(normalized)).toBe(1)
    expect(normalized.items[0]?.quantity).toBe(3)
    expect(normalized.items[0]?.kind).toBe('Teams')
    expect(normalized.orderKind).toBe('Teams')
  })

  it('validates multi-item create input', () => {
    const input = createEmptyResourceRequestInput()
    expect(validateCreateResourceRequestInput(input)).toBe('Incident name is required.')

    const withHeader = {
      ...input,
      incidentName: 'Gulf Response',
      requestedByName: 'Alex Rivera',
    }
    expect(validateCreateResourceRequestInput(withHeader)).toBe('Item 1: Kind is required.')

    const validItem = {
      ...createEmptyAssetRequestLineItem(),
      kind: 'Teams',
      type: 'Fire Support',
      detailedItemDescription: 'Need additional crews',
      requestedReportingLocation: 'Staging Area A',
    }

    expect(validateAssetRequestLineItem(validItem, 0)).toBeNull()
    expect(
      validateCreateResourceRequestInput({
        ...withHeader,
        items: [validItem],
      })
    ).toBeNull()
  })

  it('builds requests with multiple line items and legacy mirror fields', () => {
    const built = buildResourceRequestFromInput(
      {
        ...createEmptyResourceRequestInput(),
        incidentName: 'Test Incident',
        requestedByName: 'Alex Rivera',
        items: [
          {
            ...createEmptyAssetRequestLineItem(),
            kind: 'Teams',
            type: 'Fire Support',
            detailedItemDescription: 'First line',
            requestedReportingLocation: 'Staging A',
            quantity: 2,
            costPerUnit: 100,
          },
          {
            ...createEmptyAssetRequestLineItem(),
            kind: 'Vehicle',
            type: 'Command Post',
            detailedItemDescription: 'Second line',
            requestedReportingLocation: 'Forward area',
            quantity: 1,
            assetsToTransfer: [
              {
                assetKey: 'org-test-1',
                organizationAssetId: 'uuid-1',
                name: 'Mobile CP',
                type: 'Vehicle',
              },
            ],
          },
        ],
      },
      { id: 42, requestNumber: 'RR-2026-0100' }
    )

    expect(built.items).toHaveLength(2)
    expect(built.orderKind).toBe('Teams')
    expect(built.orderQuantity).toBe(2)
    expect(getResourceRequestTotalQuantity(built)).toBe(3)
    expect(built.items[1]?.assetsToTransfer).toHaveLength(1)
    expect(built.items[0]?.totalCost).toBe(200)
  })

  it('includes line item and asset names in search values', () => {
    const request = normalizeResourceRequestItem({
      id: 1,
      mapLocation: [0, 0],
      status: 'Pending',
      incidentName: 'Incident',
      dateTimeInitiated: '06/01/2026',
      requestNumber: 'RR-2026-0002',
      requestedByName: 'Alex',
      requestedByPosition: '',
      requestedByDateTime: '',
      notes: '',
      items: [
        {
          ...createEmptyAssetRequestLineItem(),
          kind: 'Teams',
          type: 'Support',
          detailedItemDescription: 'Foam team',
          requestedReportingLocation: 'Staging',
          assetsToTransfer: [
            {
              assetKey: 'org-abc',
              organizationAssetId: 'uuid-abc',
              name: 'Foam Unit 7',
              type: 'Equipment',
            },
          ],
        },
      ],
    } as ResourceRequestItem)

    expect(getResourceRequestSearchValues(request).toLowerCase()).toContain('foam unit 7')
    expect(getResourceRequestLineItems(request)).toHaveLength(1)
  })

  it('computes total cost from quantity and unit cost', () => {
    expect(computeLineItemTotalCost(4, 125.5)).toBe(502)
    expect(computeLineItemTotalCost(1, null)).toBeNull()
  })
})
