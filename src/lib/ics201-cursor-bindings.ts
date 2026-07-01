/**
 * Stable field keys for ICS-201 cursor broadcast (see ics201-cursor-sync.ts).
 *
 * Patterns:
 * - current-situation: `content`
 * - objectives: `objective:{rowId}`
 * - report-info: `reportInfo.{field}`
 * - incident-briefing: `incidentBriefing.{field}`
 * - actions: `actions:{rowId}.{task|owner|startTime|endTime}`
 * - org-chart: `orgChart.{field}`
 * - resources: `resources:{rowId}.{category|identifier|quantity|status|assignment}`
 * - safety-analysis: `safetyAnalysis:{rowId}.{hazard|mitigation|ppe|medicalPlan}`
 * - map-sketch: `mapSketch:{index}.lat|lng`, `map:draw` (anchor=latE6, head=lngE6)
 */

import type {
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  SyntheticEvent,
} from 'react'

export type Ics201TextSelection = {
  anchor: number
  head: number
}

export function ics201SelectionFromElement(
  element: HTMLInputElement | HTMLTextAreaElement
): Ics201TextSelection {
  return {
    anchor: element.selectionStart ?? 0,
    head: element.selectionEnd ?? 0,
  }
}

export function bindIcs201InputCursorHandlers(
  fieldKey: string,
  publish: (fieldKey: string, anchor: number, head: number) => void,
  clear: () => void
) {
  const report = (element: HTMLInputElement | HTMLTextAreaElement) => {
    const { anchor, head } = ics201SelectionFromElement(element)
    publish(fieldKey, anchor, head)
  }

  return {
    onFocus: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      report(event.currentTarget)
    },
    onSelect: (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      report(event.currentTarget)
    },
    onKeyUp: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      report(event.currentTarget)
    },
    onInput: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      report(event.currentTarget)
    },
    onBlur: () => {
      clear()
    },
  }
}

export function formatIcs201CursorFieldLabel(fieldKey: string): string {
  if (fieldKey === 'content') return 'content'
  if (fieldKey === 'map:draw') return 'map'
  if (fieldKey.startsWith('objective:')) {
    return `objective ${fieldKey.slice('objective:'.length)}`
  }
  if (fieldKey.startsWith('mapSketch:')) {
    const rest = fieldKey.slice('mapSketch:'.length)
    const [index, axis] = rest.split('.')
    return `vertex ${Number(index) + 1} ${axis ?? ''}`.trim()
  }
  const dot = fieldKey.lastIndexOf('.')
  if (dot !== -1) {
    return fieldKey.slice(dot + 1).replace(/([A-Z])/g, ' $1').trim()
  }
  const colon = fieldKey.indexOf(':')
  if (colon !== -1) {
    return fieldKey.slice(colon + 1).replace(/\./g, ' ')
  }
  return fieldKey
}
