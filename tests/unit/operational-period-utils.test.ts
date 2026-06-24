import { describe, expect, it } from 'vitest'
import {
  formatOperationalPeriodLabel,
  formatWorkingOperationalPeriodLabel,
} from '@/lib/operational-period-utils'

describe('operational-period-utils', () => {
  it('formats operational period labels', () => {
    expect(formatOperationalPeriodLabel(1)).toBe('Operational Period 1')
    expect(formatWorkingOperationalPeriodLabel(2)).toContain('2')
  })
})
