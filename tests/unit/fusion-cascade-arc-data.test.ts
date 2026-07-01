import { describe, expect, it } from 'vitest'
import { FUSION_PRIMARY_NOTIFICATION } from '@/data/fusion-centers-demo'
import {
  buildFusionCascadeArcs,
  coordinatesEqual,
  getNotificationCascadeExtent,
} from '@/features/hub/fusion-centers/fusion-cascade-arc-data'

describe('fusion-cascade-arc-data', () => {
  it('builds arcs from notification to distinct threat locations', () => {
    const arcs = buildFusionCascadeArcs(FUSION_PRIMARY_NOTIFICATION, 0)
    expect(arcs.length).toBeGreaterThan(0)
    expect(arcs.every((arc) => arc.notificationId === 0)).toBe(true)
    expect(arcs.every((arc) => arc.source[0] === FUSION_PRIMARY_NOTIFICATION.location[0])).toBe(
      true
    )
    arcs.forEach((arc) => {
      expect(coordinatesEqual(arc.source, arc.target)).toBe(false)
      expect(arc.width).toBeGreaterThan(0)
      expect(arc.sourceColor).toHaveLength(4)
      expect(arc.targetColor).toHaveLength(4)
    })
  })

  it('skips co-located notification and threat points', () => {
    const arcs = buildFusionCascadeArcs(FUSION_PRIMARY_NOTIFICATION, 0)
    const tosArc = arcs.find((arc) => arc.threatId === 'PHT-TOS-001')
    expect(tosArc).toBeUndefined()
  })

  it('computes map extent covering notification and threats', () => {
    const extent = getNotificationCascadeExtent(FUSION_PRIMARY_NOTIFICATION)
    expect(extent).not.toBeNull()
    expect(extent?.center[0]).toBeLessThan(-94)
    expect(extent?.center[1]).toBeGreaterThan(29)
    expect(extent?.zoom).toBe(9)
  })
})
