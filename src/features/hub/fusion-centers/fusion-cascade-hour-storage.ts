export const FUSION_CASCADE_HOUR_INDEX_STORAGE_KEY = 'hub-fusion-cascade-hour-index'

export function loadFusionCascadeHourIndex(): number {
  if (typeof window === 'undefined') {
    return 0
  }

  try {
    const raw = window.localStorage.getItem(FUSION_CASCADE_HOUR_INDEX_STORAGE_KEY)
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

export function saveFusionCascadeHourIndex(hourIndex: number) {
  if (typeof window === 'undefined') {
    return
  }

  const clamped = Math.max(0, Math.min(23, Math.floor(hourIndex)))
  window.localStorage.setItem(FUSION_CASCADE_HOUR_INDEX_STORAGE_KEY, String(clamped))
}
