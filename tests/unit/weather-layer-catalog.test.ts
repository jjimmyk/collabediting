import { describe, expect, it } from 'vitest'
import {
  groupWeatherLayersByCategory,
  HUB_WEATHER_LAYER_CATALOG,
  HUB_WEATHER_LAYER_STORAGE_KEY,
  isWeatherLayerId,
  loadEnabledWeatherLayerIds,
  saveEnabledWeatherLayerIds,
} from '@/features/hub/map-layers/weather-layer-catalog'

describe('weather-layer-catalog', () => {
  it('uses unique layer ids', () => {
    const ids = HUB_WEATHER_LAYER_CATALOG.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('groups catalog entries by category', () => {
    const groups = groupWeatherLayersByCategory()
    expect(groups.map((entry) => entry.group)).toEqual(['radar', 'alerts', 'forecast'])
    expect(groups.flatMap((entry) => entry.layers)).toHaveLength(HUB_WEATHER_LAYER_CATALOG.length)
  })

  it('validates weather layer ids', () => {
    expect(isWeatherLayerId('radar-base-reflectivity')).toBe(true)
    expect(isWeatherLayerId('not-a-layer')).toBe(false)
  })

  it('persists enabled layer ids in localStorage', () => {
    const storage = new Map<string, string>()
    const originalWindow = globalThis.window

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value)
          },
        },
      },
    })

    try {
      saveEnabledWeatherLayerIds(new Set(['radar-base-reflectivity', 'invalid-id']))
      expect(storage.get(HUB_WEATHER_LAYER_STORAGE_KEY)).toBe(
        JSON.stringify(['radar-base-reflectivity'])
      )

      saveEnabledWeatherLayerIds(new Set(['wwa-warnings']))
      expect(loadEnabledWeatherLayerIds()).toEqual(new Set(['wwa-warnings']))
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      })
    }
  })
})
