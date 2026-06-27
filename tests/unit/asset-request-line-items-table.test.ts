import { describe, expect, it } from 'vitest'
import { createEmptyAssetRequestLineItem } from '@/lib/ics-213rr-resource-request'

describe('asset request line items table helpers', () => {
  it('line items retain stable ids when patched through table-style updates', () => {
    const item = createEmptyAssetRequestLineItem()
    const originalId = item.id

    const updated = {
      ...item,
      kind: 'Teams',
      type: 'Fire Support',
      quantity: 3,
    }

    expect(updated.id).toBe(originalId)
    expect(updated.kind).toBe('Teams')
    expect(updated.quantity).toBe(3)
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
