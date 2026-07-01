import { describe, expect, it } from 'vitest'
import {
  FUSION_PRIMARY_NOTIFICATION,
  getPrimaryNotificationSeed,
} from '@/data/fusion-centers-demo'
import {
  buildHubNotificationGraphic,
  buildHubNotificationThreatGraphic,
  hubNotificationMapKey,
  hubNotificationThreatMapKey,
  HUB_NOTIFICATION_MAP_KIND,
  HUB_NOTIFICATION_THREAT_MAP_KIND,
  syncHubNotificationMapGraphics,
} from '@/features/hub/map/hub-notification-map-graphics'

describe('hub-notification-map-graphics', () => {
  it('builds fusion notification graphic with notification-0 map key', () => {
    const graphic = buildHubNotificationGraphic(FUSION_PRIMARY_NOTIFICATION)
    const attrs = graphic.attributes as Record<string, string>

    expect(attrs.mapKey).toBe('notification-0')
    expect(attrs.kind).toBe(HUB_NOTIFICATION_MAP_KIND)
    expect(attrs.title).toBe(FUSION_PRIMARY_NOTIFICATION.title)
    expect(attrs.severity).toBe('Critical')
    expect(graphic.popupTemplate?.title).toBe(FUSION_PRIMARY_NOTIFICATION.title)
    expect(String(graphic.popupTemplate?.content)).toContain('APT41')
  })

  it('builds fusion threat graphics with indexed map keys', () => {
    const threatCount = FUSION_PRIMARY_NOTIFICATION.regionalThreats?.threats.length ?? 0
    expect(threatCount).toBe(5)

    for (let index = 0; index < threatCount; index += 1) {
      const graphic = buildHubNotificationThreatGraphic(FUSION_PRIMARY_NOTIFICATION, index)
      expect(graphic).not.toBeNull()

      const attrs = graphic!.attributes as Record<string, string>
      expect(attrs.mapKey).toBe(`notification-0-threat-${index}`)
      expect(attrs.kind).toBe(HUB_NOTIFICATION_THREAT_MAP_KIND)
      expect(graphic!.popupTemplate?.title).toBe(
        FUSION_PRIMARY_NOTIFICATION.regionalThreats!.threats[index].resource
      )
    }
  })

  it('syncHubNotificationMapGraphics returns 6 graphics for fusion primary notification', () => {
    const graphicsByKey = syncHubNotificationMapGraphics([FUSION_PRIMARY_NOTIFICATION])

    expect(graphicsByKey.size).toBe(6)
    expect(graphicsByKey.has('notification-0')).toBe(true)
    expect(graphicsByKey.has('notification-0-threat-0')).toBe(true)
    expect(graphicsByKey.has('notification-0-threat-4')).toBe(true)
  })

  it('syncHubNotificationMapGraphics works for Garyville USCG seed', () => {
    const uscgSeed = getPrimaryNotificationSeed(false)
    const graphicsByKey = syncHubNotificationMapGraphics([uscgSeed])

    expect(graphicsByKey.has(hubNotificationMapKey(0))).toBe(true)
    expect(
      graphicsByKey.has(
        hubNotificationThreatMapKey(0, (uscgSeed.regionalThreats?.threats.length ?? 1) - 1)
      )
    ).toBe(true)
    expect(graphicsByKey.size).toBe(1 + (uscgSeed.regionalThreats?.threats.length ?? 0))
  })
})
