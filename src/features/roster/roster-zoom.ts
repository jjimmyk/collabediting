export const ROSTER_ZOOM_MIN = 0.2
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

export function computeFitToScreenZoom(
  container: HTMLElement,
  content: HTMLElement,
  padding = 24
): number {
  const availableWidth = Math.max(0, container.clientWidth - padding * 2)
  const availableHeight = Math.max(0, container.clientHeight - padding * 2)
  const contentWidth = content.scrollWidth
  const contentHeight = content.scrollHeight

  if (availableWidth <= 0 || availableHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
    return DEFAULT_ROSTER_ZOOM
  }

  const widthRatio = availableWidth / contentWidth
  const heightRatio = availableHeight / contentHeight
  return clampRosterZoom(Math.min(widthRatio, heightRatio))
}
