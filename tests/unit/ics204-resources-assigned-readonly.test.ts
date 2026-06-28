import { describe, expect, it } from 'vitest'
import { getIcs204ResourceAssignedRowKey } from '@/features/ics204/Ics204ResourceAssignedRowDetails'

describe('ics204 resource assigned row details', () => {
  it('builds stable expand keys per form and row', () => {
    expect(getIcs204ResourceAssignedRowKey('form-1', 42)).toBe('form-1-resource-42')
    expect(getIcs204ResourceAssignedRowKey('form-2', 42)).toBe('form-2-resource-42')
  })
})
