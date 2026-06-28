import { describe, expect, it } from 'vitest'
import {
  normalizeAssetRequestLineItemQuantity,
  parseAssetRequestLineItemQuantity,
} from '@/lib/ics-213rr-resource-request'

describe('asset request line item quantity parsing', () => {
  it('parses empty input as zero', () => {
    expect(parseAssetRequestLineItemQuantity('')).toBe(0)
    expect(parseAssetRequestLineItemQuantity('0')).toBe(0)
  })

  it('parses integers and floats', () => {
    expect(parseAssetRequestLineItemQuantity('3')).toBe(3)
    expect(parseAssetRequestLineItemQuantity('2.5')).toBe(2.5)
  })

  it('normalizes invalid values to safe numbers', () => {
    expect(normalizeAssetRequestLineItemQuantity(-2)).toBe(0)
    expect(normalizeAssetRequestLineItemQuantity('1.25')).toBe(1.25)
  })
})
