import { describe, expect, it } from 'vitest'
import { crossbarConnectLines } from '@/features/roster/org-chart-connector-draw'

describe('crossbarConnectLines', () => {
  it('returns no segments when child list is empty', () => {
    expect(crossbarConnectLines({} as HTMLElement, {} as HTMLElement, [])).toEqual([])
  })
})
