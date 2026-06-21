export const ROSTER_ZOOM_MIN = 0.5
export const ROSTER_ZOOM_MAX = 2
export const ROSTER_ZOOM_STEP = 0.05
export const DEFAULT_ROSTER_ZOOM = 1

export function clampRosterZoom(zoom: number): number {
  const rounded = Math.round(zoom * 100) / 100
  return Math.min(ROSTER_ZOOM_MAX, Math.max(ROSTER_ZOOM_MIN, rounded))
}

export function formatRosterZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`
}

export function parseRosterZoomPercent(value: string): number | null {
  const normalized = value.trim().replace(/%/g, '')
  if (!normalized) return null

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed)) return null

  return clampRosterZoom(parsed / 100)
}

export function stepRosterZoom(current: number, direction: 'in' | 'out'): number {
  const delta = direction === 'in' ? ROSTER_ZOOM_STEP : -ROSTER_ZOOM_STEP
  return clampRosterZoom(current + delta)
}

export function rosterZoomAtMin(zoom: number): boolean {
  return zoom <= ROSTER_ZOOM_MIN
}

export function rosterZoomAtMax(zoom: number): boolean {
  return zoom >= ROSTER_ZOOM_MAX
}

export function scrollToHorizontalCenter(container: HTMLElement): void {
  container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2)
}
