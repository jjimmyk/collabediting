import { describe, expect, it } from 'vitest'
import { computeFitToScreenZoom } from '@/features/roster/roster-zoom'

describe('computeFitToScreenZoom', () => {
  it('returns the tighter of width and height ratios clamped to zoom bounds', () => {
    const container = {
      clientWidth: 1200,
      clientHeight: 800,
    } as HTMLElement
    const content = {
      scrollWidth: 2400,
      scrollHeight: 1600,
    } as HTMLElement

    expect(computeFitToScreenZoom(container, content, 0)).toBe(0.5)
  })

  it('clamps fit zoom to the 20% minimum', () => {
    const container = {
      clientWidth: 1200,
      clientHeight: 800,
    } as HTMLElement
    const content = {
      scrollWidth: 8000,
      scrollHeight: 4000,
    } as HTMLElement

    expect(computeFitToScreenZoom(container, content, 0)).toBe(0.2)
  })

  it('returns default zoom when measurements are unavailable', () => {
    const container = { clientWidth: 0, clientHeight: 800 } as HTMLElement
    const content = { scrollWidth: 2400, scrollHeight: 1600 } as HTMLElement

    expect(computeFitToScreenZoom(container, content)).toBe(1)
  })
})
