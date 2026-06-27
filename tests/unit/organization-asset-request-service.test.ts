import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  buildResourceRequestFromInput,
  createEmptyAssetRequestLineItem,
  createEmptyResourceRequestInput,
  generateResourceRequestNumber,
  getResourceRequestItemCount,
  nextResourceRequestId,
  validateCreateResourceRequestInput,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'
import {
  createOrganizationAssetRequest,
  fetchOrganizationAssetRequests,
} from '@/lib/organization-asset-request-service'

const ORG_ID = 'org-test-asset-requests'

function validLineItem() {
  return {
    ...createEmptyAssetRequestLineItem(),
    kind: 'Teams',
    type: 'Industrial Fire Support',
    detailedItemDescription: 'Foam strike team requested for refinery perimeter.',
    requestedReportingLocation: 'Unified command staging',
  }
}

describe('ics-213rr resource request helpers', () => {
  it('generates sequential request numbers for the current year', () => {
    const existing: ResourceRequestItem[] = [
      normalizeExisting({
        ...createEmptyResourceRequestInput(),
        id: 1,
        requestNumber: 'RR-2026-0142',
      }),
    ]

    expect(generateResourceRequestNumber(existing)).toBe('RR-2026-0143')
  })

  it('validates required create fields', () => {
    const input = createEmptyResourceRequestInput()
    expect(validateCreateResourceRequestInput(input)).toBe('Incident name is required.')

    const valid = buildResourceRequestFromInput(
      {
        ...input,
        incidentName: 'Test Incident',
        requestedByName: 'Alex Rivera',
        items: [validLineItem()],
      },
      { id: 1, requestNumber: 'RR-2026-0999' }
    )

    expect(valid.status).toBe('Pending')
    expect(valid.requestNumber).toBe('RR-2026-0999')
    expect(getResourceRequestItemCount(valid)).toBe(1)
    expect(valid.items[0]?.quantity).toBe(1)
  })
})

function normalizeExisting(item: ResourceRequestItem): ResourceRequestItem {
  return buildResourceRequestFromInput(
    {
      ...item,
      items: item.items?.length ? item.items : [validLineItem()],
    },
    { id: item.id, requestNumber: item.requestNumber }
  )
}

describe('organization asset request service', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
        clear: () => {
          store.clear()
        },
      },
    })
  })

  it('creates and fetches multi-item requests from local storage when Supabase is not configured', async () => {
    const empty = await fetchOrganizationAssetRequests({ organizationId: ORG_ID })
    expect(empty.ok).toBe(true)
    if (!empty.ok) return
    expect(empty.requests).toEqual([])

    const input = {
      ...createEmptyResourceRequestInput({ requestedByName: 'Alex Rivera' }),
      incidentName: 'Gulf Coast Response',
      items: [
        validLineItem(),
        {
          ...validLineItem(),
          kind: 'Vehicle',
          type: 'Mobile Command Post',
          detailedItemDescription: 'Forward staging command support.',
        },
      ],
    }

    const created = await createOrganizationAssetRequest({
      organizationId: ORG_ID,
      input,
      existingRequests: [],
    })

    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.request.requestNumber).toMatch(/^RR-\d{4}-\d{4}$/)
    expect(created.request.id).toBe(nextResourceRequestId([]))
    expect(getResourceRequestItemCount(created.request)).toBe(2)

    const fetched = await fetchOrganizationAssetRequests({ organizationId: ORG_ID })
    expect(fetched.ok).toBe(true)
    if (!fetched.ok) return
    expect(fetched.requests).toHaveLength(1)
    expect(fetched.requests[0]?.requestNumber).toBe(created.request.requestNumber)
    expect(getResourceRequestItemCount(fetched.requests[0]!)).toBe(2)
  })
})
