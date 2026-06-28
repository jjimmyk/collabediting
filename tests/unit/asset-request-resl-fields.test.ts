import { describe, expect, it } from 'vitest'
import { normalizeResourceRequestItem } from '@/lib/ics-213rr-resource-request'

describe('RESL field normalization', () => {
  it('derives tactical and personnel from legacy reslTacticalResources', () => {
    const normalized = normalizeResourceRequestItem({
      id: 1,
      mapLocation: [0, 0],
      status: 'Pending',
      incidentName: 'Test',
      dateTimeInitiated: '06/01/2026',
      requestNumber: 'RR-2026-0001',
      requestedByName: 'Alex',
      reslTacticalResources: true,
    })

    expect(normalized.reslTactical).toBe(true)
    expect(normalized.reslPersonnel).toBe(true)
    expect(normalized.reslTacticalResources).toBe(true)
  })

  it('syncs legacy reslTacticalResources from tactical or personnel flags', () => {
    const normalized = normalizeResourceRequestItem({
      id: 2,
      mapLocation: [0, 0],
      status: 'Pending',
      incidentName: 'Test',
      dateTimeInitiated: '06/01/2026',
      requestNumber: 'RR-2026-0002',
      requestedByName: 'Alex',
      reslTactical: true,
      reslPersonnel: false,
    })

    expect(normalized.reslTactical).toBe(true)
    expect(normalized.reslPersonnel).toBe(false)
    expect(normalized.reslTacticalResources).toBe(true)
  })
})
