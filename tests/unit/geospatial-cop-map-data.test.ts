import { describe, expect, it } from 'vitest'
import {
  countAisVesselsByStatus,
  generateGeospatialCopAisVessels,
  GEOSPATIAL_COP_AIS_VESSELS,
  isOnWaterNearHouston,
  minPairwiseDegreeDistance,
} from '@/features/hub/cisa-dashboards/geospatial-cop-ais-vessels'
import {
  PORT_OF_HOUSTON_OUTAGE_INCIDENT,
  PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY,
} from '@/features/hub/cisa-dashboards/geospatial-cop-dashboard-data'
import {
  filterGeospatialCopImpactedAssetsBySector,
  GEOSPATIAL_COP_IMPACTED_ASSETS,
} from '@/features/hub/cisa-dashboards/geospatial-cop-impacted-assets'
import {
  GEOSPATIAL_COP_IMPACTED_AORS,
  isImpactedAorOnWater,
} from '@/features/hub/cisa-dashboards/geospatial-cop-impacted-aors'
import {
  GEOSPATIAL_COP_GRIST_MILL_SOURCE,
  GEOSPATIAL_COP_NOTIFICATIONS,
} from '@/features/hub/cisa-dashboards/geospatial-cop-notifications'
import {
  GEOSPATIAL_COP_BASE_MAP_FEATURES,
  PORT_OF_HOUSTON_BOUNDARY_RING,
} from '@/features/hub/cisa-dashboards/geospatial-cop-map-data'
import { createAisVesselGraphic, createGeospatialCopGraphic } from '@/features/hub/cisa-dashboards/geospatial-cop-map-utils'

describe('geospatial cop dashboard data', () => {
  it('defines Port of Houston Outage with current situation report', () => {
    expect(PORT_OF_HOUSTON_OUTAGE_INCIDENT.name).toBe('Port of Houston Outage')
    expect(PORT_OF_HOUSTON_OUTAGE_INCIDENT.currentSituationReport).toContain('14:22 CDT')
    expect(PORT_OF_HOUSTON_OUTAGE_INCIDENT.currentSituationReportUpdatedBy).toContain('Maria Reyes')
    expect(PORT_OF_HOUSTON_OUTAGE_INCIDENT.currentSituationReportUpdatedAt).toBe('2026-04-26 14:22 CDT')
    expect(PORT_OF_HOUSTON_OUTAGE_INCIDENT).not.toHaveProperty('resourcesCommitted')
    expect(PORT_OF_HOUSTON_OUTAGE_INCIDENT).not.toHaveProperty('interagencyNotes')
  })

  it('includes full ResourceListItemData for impacted assets', () => {
    for (const asset of GEOSPATIAL_COP_IMPACTED_ASSETS) {
      expect(asset.assetKey).toBeTruthy()
      expect(asset.opcon).toBeTruthy()
      expect(asset.capabilities).toBeTruthy()
      expect(asset.copMapKey).toMatch(/^geospatial-cop-asset-/)
      expect(asset.mapLocation).toHaveLength(2)
    }
  })

  it('filters impacted assets by sector category', () => {
    const energyOnly = filterGeospatialCopImpactedAssetsBySector(
      GEOSPATIAL_COP_IMPACTED_ASSETS,
      ['Energy']
    )
    expect(energyOnly).toHaveLength(3)
    expect(energyOnly.every((asset) => asset.sector === 'Energy')).toBe(true)
  })

  it('defines grist mill social media notifications for geospatial cop', () => {
    expect(GEOSPATIAL_COP_NOTIFICATIONS.length).toBeGreaterThanOrEqual(3)
    for (const notification of GEOSPATIAL_COP_NOTIFICATIONS) {
      expect(notification.owner).toBe(GEOSPATIAL_COP_GRIST_MILL_SOURCE)
      expect(notification.mapKey).toMatch(/^geospatial-cop-notification-/)
      expect(notification.summary.toLowerCase()).toMatch(/grist mill|social|telegram|forum|hashtag|reddit|paste/)
      expect(notification.impact).toBeTruthy()
      expect(notification.location).toHaveLength(2)
    }
  })
})

describe('geospatial cop impacted aors', () => {
  it('defines impacted port aors with risk scores and map keys', () => {
    expect(GEOSPATIAL_COP_IMPACTED_AORS).toHaveLength(3)
    expect(GEOSPATIAL_COP_IMPACTED_AORS.map((aor) => aor.name)).toEqual([
      'Port of Houston',
      'Port Beaumont',
      'Port Texas City',
    ])
    expect(GEOSPATIAL_COP_IMPACTED_AORS.map((aor) => aor.riskScore)).toEqual([99, 82, 74])
    for (const aor of GEOSPATIAL_COP_IMPACTED_AORS) {
      expect(aor.copMapKey).toMatch(/^geospatial-cop-aor-/)
      expect(aor.mapLocation).toHaveLength(2)
      expect(aor.terminalOperators.length).toBeGreaterThan(0)
      expect(aor.cargoTypes.length).toBeGreaterThan(0)
      expect(aor.interdependencies.length).toBeGreaterThan(0)
      const [longitude, latitude] = aor.mapLocation
      expect(isImpactedAorOnWater(aor.id, longitude, latitude)).toBe(true)
    }
  })
})

describe('geospatial cop map data', () => {
  it('includes port boundary and incident map key', () => {
    const boundary = GEOSPATIAL_COP_BASE_MAP_FEATURES.find(
      (feature) => feature.id === 'port-houston-footprint'
    )
    const incident = GEOSPATIAL_COP_BASE_MAP_FEATURES.find(
      (feature) => feature.mapKey === PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY
    )

    expect(boundary?.geometry.type).toBe('polygon')
    expect(PORT_OF_HOUSTON_BOUNDARY_RING.length).toBeGreaterThan(3)
    expect(incident?.label).toBe('Port of Houston Outage')
  })

  it('maps each impacted asset to a geospatial point', () => {
    for (const asset of GEOSPATIAL_COP_IMPACTED_ASSETS) {
      const feature = GEOSPATIAL_COP_BASE_MAP_FEATURES.find(
        (entry) => entry.mapKey === asset.copMapKey
      )
      expect(feature?.geometry.type).toBe('point')
    }
  })

  it('maps each impacted aor to a geospatial point', () => {
    for (const aor of GEOSPATIAL_COP_IMPACTED_AORS) {
      const feature = GEOSPATIAL_COP_BASE_MAP_FEATURES.find(
        (entry) => entry.mapKey === aor.copMapKey
      )
      expect(feature?.geometry.type).toBe('point')
      expect(feature?.status).toBe(`Risk score ${aor.riskScore}`)
    }
  })

  it('creates arcgis graphics with map keys', () => {
    const feature = GEOSPATIAL_COP_BASE_MAP_FEATURES[0]
    const graphic = createGeospatialCopGraphic(feature!)
    expect(graphic.attributes?.mapKey).toBe(feature?.mapKey)
  })
})

describe('geospatial cop ais vessels', () => {
  it('generates forty-seven vessels with affected, delayed, and normal statuses', () => {
    expect(GEOSPATIAL_COP_AIS_VESSELS).toHaveLength(47)
    const counts = countAisVesselsByStatus(GEOSPATIAL_COP_AIS_VESSELS)
    expect(counts.Affected).toBe(14)
    expect(counts.Delayed).toBe(9)
    expect(counts.Normal).toBe(24)
  })

  it('places all vessels on water near houston with scattered positions', () => {
    const vessels = generateGeospatialCopAisVessels()
    for (const vessel of vessels) {
      expect(isOnWaterNearHouston(vessel.longitude, vessel.latitude)).toBe(true)
      expect(vessel.latitude).toBeLessThan(29.54)
    }

    const minDistance = minPairwiseDegreeDistance(vessels)
    expect(minDistance).toBeGreaterThan(0)
    expect(minDistance).toBeLessThan(0.08)
  })

  it('creates triangle vessel markers for the map', () => {
    const graphic = createAisVesselGraphic(GEOSPATIAL_COP_AIS_VESSELS[0]!)
    expect(graphic.symbol?.type).toBe('simple-marker')
    expect(graphic.attributes?.status).toBe('Affected')
  })
})
