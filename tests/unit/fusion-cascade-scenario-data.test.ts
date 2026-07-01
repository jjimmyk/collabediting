import { describe, expect, it } from 'vitest'
import { FUSION_CASCADE_LAYER_DEFINITION } from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'

describe('fusion-cascade-scenario-data', () => {
  it('defines fusion cascade map layer catalog entry', () => {
    expect(FUSION_CASCADE_LAYER_DEFINITION.id).toBe('fusion-cascade-impacts')
    expect(FUSION_CASCADE_LAYER_DEFINITION.label).toContain('Cascading Impacts')
    expect(FUSION_CASCADE_LAYER_DEFINITION.description).toContain('deck.gl')
  })
})
