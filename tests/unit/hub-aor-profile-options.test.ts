import { describe, expect, it } from 'vitest'
import {
  buildHubAorProfileOptions,
  filterHubAorProfileOptions,
  resolveHubAorProfileNodeLabel,
} from '@/features/hub/aor/hub-aor-profile-options'

describe('hub-aor-profile-options', () => {
  it('includes districts and hierarchy nodes with stable groups', () => {
    const options = buildHubAorProfileOptions()
    expect(options.some((option) => option.value === 'district-1')).toBe(true)
    expect(options.some((option) => option.value === 'sector-boston')).toBe(true)
    expect(options.find((option) => option.value === 'district-1')?.group).toBe('Districts')
    expect(options.find((option) => option.value === 'sector-boston')?.group).toBe('Sectors')
  })

  it('resolves district and sector labels', () => {
    expect(resolveHubAorProfileNodeLabel('district-1')).toContain('District 1')
    expect(resolveHubAorProfileNodeLabel('sector-boston')).toBe('Sector Boston')
    expect(resolveHubAorProfileNodeLabel(null)).toBeNull()
  })

  it('filters options by label or group', () => {
    const options = buildHubAorProfileOptions()
    const filtered = filterHubAorProfileOptions(options, 'sector boston')
    expect(filtered.some((option) => option.value === 'sector-boston')).toBe(true)
    expect(filtered.every((option) => option.value === 'sector-boston' || option.label.includes('Boston'))).toBe(
      true
    )
  })
})
