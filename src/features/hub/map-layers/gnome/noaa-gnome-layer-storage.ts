export const NOAA_GNOME_LAYER_ENABLED_STORAGE_KEY = 'hub-noaa-gnome-layer-enabled'
export const NOAA_GNOME_HOUR_INDEX_STORAGE_KEY = 'hub-noaa-gnome-hour-index'

export function loadNoaaGnomeLayerEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(NOAA_GNOME_LAYER_ENABLED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveNoaaGnomeLayerEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(NOAA_GNOME_LAYER_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
}

export function loadNoaaGnomeHourIndex(): number {
  if (typeof window === 'undefined') {
    return 0
  }

  try {
    const raw = window.localStorage.getItem(NOAA_GNOME_HOUR_INDEX_STORAGE_KEY)
    if (!raw) {
      return 0
    }

    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) {
      return 0
    }

    return parsed
  } catch {
    return 0
  }
}

export function saveNoaaGnomeHourIndex(hourIndex: number) {
  if (typeof window === 'undefined') {
    return
  }

  const clamped = Math.max(0, Math.min(23, Math.floor(hourIndex)))
  window.localStorage.setItem(NOAA_GNOME_HOUR_INDEX_STORAGE_KEY, String(clamped))
}
