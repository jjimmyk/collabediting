import { describe, expect, it } from 'vitest'
import { reorderArrayItems } from '@/lib/reorder-array'

describe('reorderArrayItems', () => {
  const items = [
    { id: 1, label: 'a' },
    { id: 2, label: 'b' },
    { id: 3, label: 'c' },
  ]

  it('moves first item to last', () => {
    expect(reorderArrayItems(items, 0, 2)).toEqual([
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
      { id: 1, label: 'a' },
    ])
  })

  it('moves last item to first', () => {
    expect(reorderArrayItems(items, 2, 0)).toEqual([
      { id: 3, label: 'c' },
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ])
  })

  it('swaps adjacent items', () => {
    expect(reorderArrayItems(items, 0, 1)).toEqual([
      { id: 2, label: 'b' },
      { id: 1, label: 'a' },
      { id: 3, label: 'c' },
    ])
  })

  it('returns a copy when indices match', () => {
    const result = reorderArrayItems(items, 1, 1)
    expect(result).toEqual(items)
    expect(result).not.toBe(items)
  })

  it('preserves row ids when reordering', () => {
    const result = reorderArrayItems(items, 0, 2)
    expect(result.map((item) => item.id)).toEqual([2, 3, 1])
  })

  it('returns a copy for out-of-range indices', () => {
    const result = reorderArrayItems(items, -1, 5)
    expect(result).toEqual(items)
    expect(result).not.toBe(items)
  })
})
