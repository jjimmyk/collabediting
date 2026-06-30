import { describe, expect, it, beforeEach, vi } from 'vitest'
import { HUB_CISA_DASHBOARD_MENU_ITEMS } from '@/features/hub/cisa-dashboards/dashboard-registry'
import { DEFAULT_FEATURE_FLAG_STATE } from '@/features/hub/feature-flags/feature-flag-catalog'
import { getHubMoreMenuItems } from '@/features/hub/feature-flags/hub-menu'
import {
  HUB_FEATURE_FLAG_STORAGE_KEY,
  loadFeatureFlags,
  saveFeatureFlags,
} from '@/features/hub/feature-flags/feature-flag-storage'

describe('feature-flag storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null
        },
        setItem(key: string, value: string) {
          this.store[key] = value
        },
        removeItem(key: string) {
          delete this.store[key]
        },
      },
    })
  })

  it('defaults cisa to false when storage is empty', () => {
    expect(loadFeatureFlags()).toEqual(DEFAULT_FEATURE_FLAG_STATE)
    expect(loadFeatureFlags().cisa).toBe(false)
    expect(loadFeatureFlags().oilSpillTrajectoryModels).toBe(false)
  })

  it('persists and reloads feature flag state', () => {
    saveFeatureFlags({ cisa: true, oilSpillTrajectoryModels: true })
    expect(window.localStorage.getItem(HUB_FEATURE_FLAG_STORAGE_KEY)).toBeTruthy()
    expect(loadFeatureFlags().cisa).toBe(true)
    expect(loadFeatureFlags().oilSpillTrajectoryModels).toBe(true)
  })

  it('ignores unknown keys in storage', () => {
    window.localStorage.setItem(
      HUB_FEATURE_FLAG_STORAGE_KEY,
      JSON.stringify({ cisa: true, unknown: true })
    )
    expect(loadFeatureFlags()).toEqual({ cisa: true, oilSpillTrajectoryModels: false })
  })
})

describe('hub more menu filtering', () => {
  it('excludes cisa dashboards when flag is off', () => {
    const items = getHubMoreMenuItems(false)
    const cisaLabels = HUB_CISA_DASHBOARD_MENU_ITEMS.map((item) => item.label)

    expect(items.some((item) => cisaLabels.includes(item.label))).toBe(false)
    expect(items.some((item) => item.tab === 'incident-list')).toBe(true)
  })

  it('includes all seven cisa dashboards when flag is on', () => {
    const items = getHubMoreMenuItems(true)
    const cisaLabels = HUB_CISA_DASHBOARD_MENU_ITEMS.map((item) => item.label)

    for (const label of cisaLabels) {
      expect(items.some((item) => item.label === label)).toBe(true)
    }
  })
})
