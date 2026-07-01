import { describe, expect, it } from 'vitest'
import { buildIcs201DocxBlocks, drawClippedMapSketchImage } from '@/features/ics201/export-download'
import { computeClippedImageLayout, verticesToClosedRing } from '@/features/ics201/map-sketch-geometry'
import type { Ics201FormState } from '@/features/ics201/types'
import { createInitialIcs201Form } from '@/features/ics201/constants'

const baseForm = (): Ics201FormState => createInitialIcs201Form()

describe('ics201 map sketch export', () => {
  it('closes polygon rings for map sketch vertices', () => {
    expect(
      verticesToClosedRing([
        { longitude: -76.3, latitude: 36.84 },
        { longitude: -76.2, latitude: 36.9 },
        { longitude: -76.1, latitude: 36.8 },
      ])
    ).toEqual([
      [-76.3, 36.84],
      [-76.2, 36.9],
      [-76.1, 36.8],
      [-76.3, 36.84],
    ])
  })

  it('computes clipped image layout for pdf embedding', () => {
    const layout = computeClippedImageLayout(800, 600, { x: 10, y: 20, width: 300, height: 200 }, 4)
    expect(layout.clipWidth).toBe(292)
    expect(layout.clipHeight).toBe(192)
    expect(layout.width).toBeLessThanOrEqual(292)
    expect(layout.height).toBeLessThanOrEqual(192)
  })

  it('builds docx blocks with image instead of vertex bullets when png provided', () => {
    const form = baseForm()
    form.mapSketchPolygon = [
      { longitude: -76.3, latitude: 36.84 },
      { longitude: -76.2, latitude: 36.9 },
      { longitude: -76.1, latitude: 36.8 },
    ]
    const png = new Uint8Array([137, 80, 78, 71])
    const blocks = buildIcs201DocxBlocks(form, png)
    expect(blocks.some((block) => block.kind === 'image')).toBe(true)
    expect(blocks.some((block) => block.kind === 'bullet' && block.text.includes('Vertex'))).toBe(
      false
    )
  })

  it('uses empty-state copy when no polygon is drawn', () => {
    const form = baseForm()
    form.mapSketchPolygon = []
    const blocks = buildIcs201DocxBlocks(form, null)
    expect(
      blocks.some((block) => block.kind === 'paragraph' && block.text.includes('No incident'))
    ).toBe(true)
  })

  it('uses fallback copy when polygon exists but png is unavailable', () => {
    const form = baseForm()
    form.mapSketchPolygon = [
      { longitude: -76.3, latitude: 36.84 },
      { longitude: -76.2, latitude: 36.9 },
      { longitude: -76.1, latitude: 36.8 },
    ]
    const blocks = buildIcs201DocxBlocks(form, null)
    expect(
      blocks.some(
        (block) => block.kind === 'paragraph' && block.text.includes('Map sketch image unavailable')
      )
    ).toBe(true)
  })
})

describe('export-download pdf helpers', () => {
  it('drawClippedMapSketchImage is defined', () => {
    expect(typeof drawClippedMapSketchImage).toBe('function')
  })
})
