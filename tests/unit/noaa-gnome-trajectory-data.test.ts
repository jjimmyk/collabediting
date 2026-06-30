import { describe, expect, it } from 'vitest'
import {
  buildNoaaGnomeTrajectoryParticles,
  NOAA_GNOME_PARTICLES_PER_STEP,
  NOAA_GNOME_PLUME_BBOX,
  NOAA_GNOME_STEP_COUNT,
  NOAA_GNOME_TIME_STEPS,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'

describe('buildNoaaGnomeTrajectoryParticles', () => {
  it('generates one particle row per timestep and particle slot', () => {
    const particles = buildNoaaGnomeTrajectoryParticles()
    expect(particles).toHaveLength(NOAA_GNOME_STEP_COUNT * NOAA_GNOME_PARTICLES_PER_STEP)
  })

  it('uses valid ISO timestamps within the demo window', () => {
    const particles = buildNoaaGnomeTrajectoryParticles()
    const allowed = new Set(NOAA_GNOME_TIME_STEPS)

    for (const particle of particles) {
      expect(allowed.has(particle.timeStamp)).toBe(true)
      expect(Number.isFinite(Date.parse(particle.timeStamp))).toBe(true)
    }
  })

  it('keeps coordinates within the New Orleans / Gulf plume bounding box', () => {
    const [minLon, minLat, maxLon, maxLat] = NOAA_GNOME_PLUME_BBOX
    const particles = buildNoaaGnomeTrajectoryParticles()

    for (const particle of particles) {
      expect(particle.longitude).toBeGreaterThanOrEqual(minLon)
      expect(particle.longitude).toBeLessThanOrEqual(maxLon)
      expect(particle.latitude).toBeGreaterThanOrEqual(minLat)
      expect(particle.latitude).toBeLessThanOrEqual(maxLat)
    }
  })

  it('is deterministic across repeated builds', () => {
    const first = buildNoaaGnomeTrajectoryParticles()
    const second = buildNoaaGnomeTrajectoryParticles()
    expect(second).toEqual(first)
  })
})
