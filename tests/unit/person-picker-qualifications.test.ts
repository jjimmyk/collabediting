import { describe, expect, it } from 'vitest'
import {
  formatQualificationsSummary,
  normalizeQualificationLabels,
} from '@/features/roster/person-picker-qualifications'

describe('person-picker-qualifications', () => {
  it('returns null when no qualifications are present', () => {
    expect(formatQualificationsSummary([])).toBeNull()
    expect(formatQualificationsSummary(undefined)).toBeNull()
  })

  it('formats a readable qualifications summary', () => {
    expect(formatQualificationsSummary(['EMT', 'ICS-300'])).toBe(
      'Qualifications: EMT, ICS-300'
    )
  })

  it('truncates long qualification summaries', () => {
    const summary = formatQualificationsSummary([
      'Very Long Qualification Name Alpha',
      'Very Long Qualification Name Beta',
      'Very Long Qualification Name Gamma',
      'Very Long Qualification Name Delta',
    ])
    expect(summary?.endsWith('…')).toBe(true)
    expect(summary!.length).toBeLessThanOrEqual(120)
  })

  it('deduplicates qualification labels case-insensitively', () => {
    expect(normalizeQualificationLabels(['EMT', ' emt ', 'ICS-300', ''])).toEqual([
      'EMT',
      'ICS-300',
    ])
  })
})
