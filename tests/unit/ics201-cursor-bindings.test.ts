/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from 'vitest'
import type { FocusEvent } from 'react'
import {
  bindIcs201InputCursorHandlers,
  formatIcs201CursorFieldLabel,
  ics201SelectionFromElement,
} from '@/lib/ics201-cursor-bindings'
import {
  decodeIcs201MapPointer,
  encodeIcs201MapPointer,
} from '@/features/ics201/Ics201MapSketchRemotePointers'

describe('ics201-cursor-bindings', () => {
  it('reads selection from input elements', () => {
    const element = document.createElement('input')
    element.value = 'hello'
    element.selectionStart = 2
    element.selectionEnd = 4
    expect(ics201SelectionFromElement(element)).toEqual({ anchor: 2, head: 4 })
  })

  it('binds cursor handlers that publish on focus and clear on blur', () => {
    const publish = vi.fn()
    const clear = vi.fn()
    const handlers = bindIcs201InputCursorHandlers('reportInfo.incidentName', publish, clear)
    const element = document.createElement('input')
    element.value = 'Alpha'
    element.selectionStart = 5
    element.selectionEnd = 5

    handlers.onFocus?.({ currentTarget: element } as FocusEvent<HTMLInputElement>)
    expect(publish).toHaveBeenCalledWith('reportInfo.incidentName', 5, 5)

    handlers.onBlur?.({} as FocusEvent<HTMLInputElement>)
    expect(clear).toHaveBeenCalled()
  })

  it('formats field keys for display labels', () => {
    expect(formatIcs201CursorFieldLabel('objective:3')).toBe('objective 3')
    expect(formatIcs201CursorFieldLabel('map:draw')).toBe('map')
    expect(formatIcs201CursorFieldLabel('mapSketch:2.lat')).toBe('vertex 3 lat')
    expect(formatIcs201CursorFieldLabel('reportInfo.incidentName')).toBe('incident Name')
  })
})

describe('ics201 map pointer encoding', () => {
  it('round-trips lat/lng through anchor/head', () => {
    const encoded = encodeIcs201MapPointer(29.7604, -95.3698)
    const decoded = decodeIcs201MapPointer(encoded.anchor, encoded.head)
    expect(decoded.latitude).toBeCloseTo(29.7604, 4)
    expect(decoded.longitude).toBeCloseTo(-95.3698, 4)
  })
})
