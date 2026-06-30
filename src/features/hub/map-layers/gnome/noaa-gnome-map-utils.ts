import Graphic from '@arcgis/core/Graphic'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import {
  formatCurrentForcing,
  formatWindForcing,
  getNoaaGnomeHourlyForcing,
  getNoaaGnomeParticlesForHour,
  getNoaaGnomePlumeCentroid,
  getNoaaGnomePlumeHullRing,
  getNoaaGnomeParticleSplatRadius,
  NOAA_GNOME_RELEASE_POINT,
  NOAA_GNOME_SPILL_ID,
  type NoaaGnomeHourlyForcing,
  type NoaaGnomeTrajectoryParticle,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'

export const NOAA_GNOME_SLICK_LAYER_ID = 'noaa-gnome-slick'
export const NOAA_GNOME_PARTICLE_LAYER_ID = 'noaa-gnome-particles'
export const NOAA_GNOME_FORCING_LAYER_ID = 'noaa-gnome-forcing'
export const NOAA_GNOME_RELEASE_LAYER_ID = 'noaa-gnome-release'

const OIL_CORE_RGBA: [number, number, number, number] = [38, 38, 38, 0.42]
const OIL_MID_RGBA: [number, number, number, number] = [55, 45, 35, 0.24]
const OIL_SHEEN_RGBA: [number, number, number, number] = [120, 95, 55, 0.12]
const OIL_SPLAT_RGBA: [number, number, number, number] = [45, 38, 30, 0.09]
const OIL_POINT_RGBA: [number, number, number, number] = [30, 25, 20, 0.18]
const SUBSURFACE_SPLAT_RGBA: [number, number, number, number] = [25, 35, 55, 0.07]

function buildCircleRing(
  longitude: number,
  latitude: number,
  radiusLon: number,
  radiusLat: number,
  segments = 14
): Array<[number, number]> {
  const ring: Array<[number, number]> = []
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2
    ring.push([
      longitude + Math.cos(angle) * radiusLon,
      latitude + Math.sin(angle) * radiusLat,
    ])
  }
  return ring
}

function createNoaaGnomeDensitySplatGraphic(
  particle: NoaaGnomeTrajectoryParticle,
  hourIndex: number
): Graphic {
  const radius = getNoaaGnomeParticleSplatRadius(particle, hourIndex)
  const isSubsurface = particle.status === 'subsurface'
  const splatColor = isSubsurface ? SUBSURFACE_SPLAT_RGBA : OIL_SPLAT_RGBA

  return new Graphic({
    geometry: {
      type: 'polygon',
      rings: [
        buildCircleRing(
          particle.longitude,
          particle.latitude,
          radius.longitude,
          radius.latitude
        ),
      ],
    },
    attributes: {
      mapKey: `noaa-gnome-splat-${particle.particleId}`,
      particle_id: particle.particleId,
    },
    symbol: {
      type: 'simple-fill',
      color: splatColor,
      outline: { width: 0 },
    },
  })
}

function createNoaaGnomeParticleGraphic(particle: NoaaGnomeTrajectoryParticle): Graphic {
  const isSubsurface = particle.status === 'subsurface'

  return new Graphic({
    geometry: {
      type: 'point',
      longitude: particle.longitude,
      latitude: particle.latitude,
    },
    attributes: {
      mapKey: `noaa-gnome-particle-${particle.particleId}`,
      particle_id: particle.particleId,
      time_stamp: particle.timeStamp,
      mass_g: particle.massG,
      depth_m: particle.depthM,
      status: particle.status,
      mover_id: particle.moverId,
      spill_id: particle.spillId,
    },
    symbol: {
      type: 'simple-marker',
      style: 'circle',
      color: isSubsurface ? ([25, 35, 55, 0.22] as [number, number, number, number]) : OIL_POINT_RGBA,
      size: isSubsurface ? 1.5 : 2,
      outline: { width: 0 },
    },
    popupTemplate: {
      title: 'Oil particle · {particle_id}',
      content:
        '<b>Time:</b> {time_stamp}<br/><b>Mass:</b> {mass_g} g<br/><b>Depth:</b> {depth_m} m<br/><b>Status:</b> {status}<br/><b>Mover:</b> {mover_id}',
    },
  })
}

function createNoaaGnomePlumeBlobGraphic(options: {
  ring: Array<[number, number]>
  mapKey: string
  color: [number, number, number, number]
  title: string
}): Graphic | null {
  if (options.ring.length < 4) {
    return null
  }

  return new Graphic({
    geometry: {
      type: 'polygon',
      rings: [options.ring],
    },
    attributes: {
      mapKey: options.mapKey,
      title: options.title,
    },
    symbol: {
      type: 'simple-fill',
      color: options.color,
      outline: { width: 0 },
    },
    popupTemplate: {
      title: options.title,
      content: 'Modeled surface oil footprint from GNOME particle envelope.',
    },
  })
}

function buildNoaaGnomePlumeBlobGraphics(hourIndex: number): Graphic[] {
  const graphics: Graphic[] = []
  const sheenRing = getNoaaGnomePlumeHullRing(hourIndex, 1.55)
  const midRing = getNoaaGnomePlumeHullRing(hourIndex, 1.18)
  const coreRing = getNoaaGnomePlumeHullRing(hourIndex, 0.82)

  const sheen = createNoaaGnomePlumeBlobGraphic({
    ring: sheenRing,
    mapKey: 'noaa-gnome-plume-sheen',
    color: OIL_SHEEN_RGBA,
    title: 'Surface oil sheen',
  })
  const mid = createNoaaGnomePlumeBlobGraphic({
    ring: midRing,
    mapKey: 'noaa-gnome-plume-mid',
    color: OIL_MID_RGBA,
    title: 'Surface oil slick',
  })
  const core = createNoaaGnomePlumeBlobGraphic({
    ring: coreRing,
    mapKey: 'noaa-gnome-plume-core',
    color: OIL_CORE_RGBA,
    title: 'Surface oil core',
  })

  if (sheen) graphics.push(sheen)
  if (mid) graphics.push(mid)
  if (core) graphics.push(core)
  return graphics
}

function directionToOffset(
  centroidLon: number,
  centroidLat: number,
  towardDirectionDeg: number,
  lengthNauticalMiles: number
): [number, number] {
  const radians = (towardDirectionDeg * Math.PI) / 180
  const degreesLat = (lengthNauticalMiles / 60) * Math.cos(radians)
  const degreesLon =
    ((lengthNauticalMiles / 60) * Math.sin(radians)) / Math.cos((centroidLat * Math.PI) / 180)
  return [centroidLon + degreesLon, centroidLat + degreesLat]
}

function createForcingArrowGraphic(options: {
  mapKey: string
  startLon: number
  startLat: number
  towardDirectionDeg: number
  lengthNauticalMiles: number
  color: [number, number, number, number]
  title: string
  popupContent: string
}): Graphic {
  const [endLon, endLat] = directionToOffset(
    options.startLon,
    options.startLat,
    options.towardDirectionDeg,
    options.lengthNauticalMiles
  )

  return new Graphic({
    geometry: {
      type: 'polyline',
      paths: [
        [
          [options.startLon, options.startLat],
          [endLon, endLat],
        ],
      ],
    },
    attributes: {
      mapKey: options.mapKey,
      title: options.title,
    },
    symbol: {
      type: 'simple-line',
      color: options.color,
      width: 3,
      marker: {
        style: 'arrow',
        placement: 'end',
        color: options.color,
      },
    },
    popupTemplate: {
      title: options.title,
      content: options.popupContent,
    },
  })
}

function buildForcingArrowGraphics(hourIndex: number, forcing: NoaaGnomeHourlyForcing): Graphic[] {
  const centroid = getNoaaGnomePlumeCentroid(hourIndex)
  const windTowardDeg = (forcing.windFromDirectionDeg + 180) % 360
  const windLength = 0.08 + forcing.windSpeedKnots * 0.012
  const currentLength = 0.06 + forcing.currentSpeedKnots * 0.05

  const windStart = directionToOffset(centroid.longitude, centroid.latitude, windTowardDeg + 180, 0.02)
  const currentStart = directionToOffset(
    centroid.longitude,
    centroid.latitude,
    forcing.currentTowardDirectionDeg + 180,
    0.035
  )

  return [
    createForcingArrowGraphic({
      mapKey: 'noaa-gnome-wind-arrow',
      startLon: windStart[0],
      startLat: windStart[1],
      towardDirectionDeg: windTowardDeg,
      lengthNauticalMiles: windLength,
      color: [59, 130, 246, 0.95],
      title: 'Wind forcing',
      popupContent: `<b>Wind:</b> ${formatWindForcing(forcing)}`,
    }),
    createForcingArrowGraphic({
      mapKey: 'noaa-gnome-current-arrow',
      startLon: currentStart[0],
      startLat: currentStart[1],
      towardDirectionDeg: forcing.currentTowardDirectionDeg,
      lengthNauticalMiles: currentLength,
      color: [20, 184, 166, 0.95],
      title: 'Current forcing',
      popupContent: `<b>Current:</b> ${formatCurrentForcing(forcing)}`,
    }),
  ]
}

export function buildNoaaGnomeReleaseGraphic(): Graphic {
  return new Graphic({
    geometry: {
      type: 'point',
      longitude: NOAA_GNOME_RELEASE_POINT.longitude,
      latitude: NOAA_GNOME_RELEASE_POINT.latitude,
    },
    attributes: {
      mapKey: 'noaa-gnome-release-point',
      title: NOAA_GNOME_RELEASE_POINT.label,
      spill_id: NOAA_GNOME_SPILL_ID,
    },
    symbol: {
      type: 'simple-marker',
      style: 'diamond',
      color: [220, 38, 38, 0.95] as [number, number, number, number],
      size: 14,
      outline: {
        color: [255, 255, 255, 1] as [number, number, number, number],
        width: 2,
      },
    },
    popupTemplate: {
      title: NOAA_GNOME_RELEASE_POINT.label,
      content:
        `<b>Model:</b> NOAA GNOME<br/><b>Spill ID:</b> ${NOAA_GNOME_SPILL_ID}<br/><b>Location:</b> Northern Gulf of America offshore`,
    },
  })
}

export function syncNoaaGnomeReleaseGraphic(layer: GraphicsLayer) {
  layer.removeAll()
  layer.add(buildNoaaGnomeReleaseGraphic())
}

export function syncNoaaGnomeGraphicsForHour(
  particleLayer: GraphicsLayer,
  slickLayer: GraphicsLayer,
  forcingLayer: GraphicsLayer,
  hourIndex: number
) {
  particleLayer.removeAll()
  slickLayer.removeAll()
  forcingLayer.removeAll()

  const particles = getNoaaGnomeParticlesForHour(hourIndex)

  for (const particle of particles) {
    particleLayer.add(createNoaaGnomeDensitySplatGraphic(particle, hourIndex))
  }
  for (const particle of particles) {
    particleLayer.add(createNoaaGnomeParticleGraphic(particle))
  }

  for (const blobGraphic of buildNoaaGnomePlumeBlobGraphics(hourIndex)) {
    slickLayer.add(blobGraphic)
  }

  const forcing = getNoaaGnomeHourlyForcing(hourIndex)
  for (const arrowGraphic of buildForcingArrowGraphics(hourIndex, forcing)) {
    forcingLayer.add(arrowGraphic)
  }
}
