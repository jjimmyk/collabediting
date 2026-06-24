import { describe, expect, it } from 'vitest'
import { defaultAllowWorkAssignmentForApi } from '../../api/roster-operations-work-assignment'

describe('defaultAllowWorkAssignmentForApi', () => {
  it('allows Operations Section Chief and subtree positions', () => {
    expect(defaultAllowWorkAssignmentForApi('Operations Section Chief')).toBe(true)
    expect(defaultAllowWorkAssignmentForApi('Staging Area Manager')).toBe(true)
  })

  it('denies positions outside the Operations subtree', () => {
    expect(defaultAllowWorkAssignmentForApi('Incident Commander')).toBe(false)
    expect(defaultAllowWorkAssignmentForApi('Planning Section Chief')).toBe(false)
  })

  it('walks custom position reports-to chains', () => {
    expect(
      defaultAllowWorkAssignmentForApi('Division Alpha', {
        reportsTo: 'Operations Section Chief',
      })
    ).toBe(true)
    expect(
      defaultAllowWorkAssignmentForApi('Division Beta', {
        reportsTo: 'Planning Section Chief',
      })
    ).toBe(false)
  })
})
