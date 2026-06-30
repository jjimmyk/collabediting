import Graphic from '@arcgis/core/Graphic'
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import {
  buildNoaaGnomeTrajectoryParticles,
  NOAA_GNOME_RELEASE_POINT,
  NOAA_GNOME_SPILL_ID,
  type NoaaGnomeTrajectoryParticle,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'

export const NOAA_GNOME_PARTICLE_LAYER_ID = 'noaa-gnome-particles'
export const NOAA_GNOME_RELEASE_LAYER_ID = 'noaa-gnome-release'

export const NOAA_GNOME_PARTICLE_FIELDS = [
  { name: 'ObjectID', type: 'oid' as const },
  { name: 'time_stamp', type: 'date' as const },
  { name: 'mass_g', type: 'double' as const },
  { name: 'depth_m', type: 'double' as const },
  { name: 'status', type: 'string' as const, length: 32 },
  { name: 'mover_id', type: 'string' as const, length: 64 },
  { name: 'particle_id', type: 'string' as const, length: 64 },
  { name: 'spill_id', type: 'string' as const, length: 64 },
]

export function createNoaaGnomeParticleGraphic(particle: NoaaGnomeTrajectoryParticle): Graphic {
  const isSubsurface = particle.status === 'subsurface'
  const isBeached = particle.status === 'beached'

  return new Graphic({
    geometry: {
      type: 'point',
      longitude: particle.longitude,
      latitude: particle.latitude,
    },
    attributes: {
      ObjectID: particle.objectId,
      time_stamp: new Date(particle.timeStamp).getTime(),
      mass_g: particle.massG,
      depth_m: particle.depthM,
      status: particle.status,
      mover_id: particle.moverId,
      particle_id: particle.particleId,
      spill_id: particle.spillId,
    },
    symbol: {
      type: 'simple-marker',
      color: isBeached
        ? ([180, 83, 9, 0.92] as [number, number, number, number])
        : isSubsurface
          ? ([120, 53, 15, 0.85] as [number, number, number, number])
          : ([234, 88, 12, 0.88] as [number, number, number, number]),
      size: isBeached ? 7 : 6,
      outline: {
        color: [255, 255, 255, 0.9] as [number, number, number, number],
        width: 0.75,
      },
    },
  })
}

export function buildNoaaGnomeParticleGraphics(): Graphic[] {
  return buildNoaaGnomeTrajectoryParticles().map(createNoaaGnomeParticleGraphic)
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
        '<b>Model:</b> NOAA GNOME (demo)<br/><b>Spill ID:</b> demo-nola-bay-release<br/><b>Location:</b> Mississippi River Delta',
    },
  })
}

export async function loadNoaaGnomeParticleLayerSource(layer: FeatureLayer, graphics: Graphic[]) {
  if (layer.loaded) {
    const query = await layer.queryFeatures()
    await layer.applyEdits({
      deleteFeatures: query.features,
      addFeatures: graphics,
    })
    return
  }

  layer.source.removeAll()
  if (graphics.length > 0) {
    layer.source.addMany(graphics)
  }
}
