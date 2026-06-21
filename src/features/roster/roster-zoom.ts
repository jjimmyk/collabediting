export const ROSTER_ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export type RosterZoomLevel = (typeof ROSTER_ZOOM_PRESETS)[number]

export const DEFAULT_ROSTER_ZOOM: RosterZoomLevel = 1

export function formatRosterZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`
}

export function stepRosterZoom(current: number, direction: 'in' | 'out'): RosterZoomLevel {
  const presets = ROSTER_ZOOM_PRESETS
  const currentIndex = presets.findIndex((preset) => preset === current)
  const resolvedIndex = currentIndex === -1 ? presets.indexOf(DEFAULT_ROSTER_ZOOM) : currentIndex

  if (direction === 'in') {
    return presets[Math.min(resolvedIndex + 1, presets.length - 1)]
  }

  return presets[Math.max(resolvedIndex - 1, 0)]
}

export function rosterZoomAtMin(zoom: number): boolean {
  return zoom <= ROSTER_ZOOM_PRESETS[0]
}

export function rosterZoomAtMax(zoom: number): boolean {
  return zoom >= ROSTER_ZOOM_PRESETS[ROSTER_ZOOM_PRESETS.length - 1]
}
