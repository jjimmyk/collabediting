import {
  DEFAULT_FEATURE_FLAG_STATE,
  isFeatureFlagId,
  type FeatureFlagId,
  type FeatureFlagState,
} from '@/features/hub/feature-flags/feature-flag-catalog'

export const HUB_FEATURE_FLAG_STORAGE_KEY = 'hub-feature-flags'

export function loadFeatureFlags(): FeatureFlagState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_FEATURE_FLAG_STATE }
  }

  try {
    const raw = window.localStorage.getItem(HUB_FEATURE_FLAG_STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_FEATURE_FLAG_STATE }
    }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_FEATURE_FLAG_STATE }
    }

    const next = { ...DEFAULT_FEATURE_FLAG_STATE }
    for (const [key, value] of Object.entries(parsed)) {
      if (isFeatureFlagId(key) && typeof value === 'boolean') {
        next[key] = value
      }
    }

    return next
  } catch {
    return { ...DEFAULT_FEATURE_FLAG_STATE }
  }
}

export function saveFeatureFlags(state: FeatureFlagState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HUB_FEATURE_FLAG_STORAGE_KEY, JSON.stringify(state))
}

export function isFeatureFlagEnabled(
  state: FeatureFlagState,
  flagId: FeatureFlagId
): boolean {
  return state[flagId] ?? DEFAULT_FEATURE_FLAG_STATE[flagId]
}
