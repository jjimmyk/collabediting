import { describe, expect, it } from 'vitest'
import {
  buildNoaaGnomeTrajectoryParticles,
  getNoaaGnomeHourlyForcing,
  getNoaaGnomeParticlesForHour,
  getNoaaGnomePlumeCentroid,
  getNoaaGnomeSlickRing,
  isNoaaGnomeOffshorePoint,
  NOAA_GNOME_HOURLY_FORCING,
  NOAA_GNOME_PARTICLES_PER_STEP,
  NOAA_GNOME_PLUME_BBOX,
  NOAA_GNOME_STEP_COUNT,
  NOAA_GNOME_TIME_STEPS,
  resetNoaaGnomeTrajectoryCacheForTests,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'

function standardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

describe('buildNoaaGnomeTrajectoryParticles', () => {
  it('generates one particle row per timestep and particle slot', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const particles = buildNoaaGnomeTrajectoryParticles()
    expect(particles).toHaveLength(NOAA_GNOME_STEP_COUNT * NOAA_GNOME_PARTICLES_PER_STEP)
  })

  it('uses valid ISO timestamps within the trajectory window', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const particles = buildNoaaGnomeTrajectoryParticles()
    const allowed = new Set(NOAA_GNOME_TIME_STEPS)

    for (const particle of particles) {
      expect(allowed.has(particle.timeStamp)).toBe(true)
      expect(Number.isFinite(Date.parse(particle.timeStamp))).toBe(true)
    }
  })

  it('keeps coordinates within the Gulf plume bounding box', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
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
    resetNoaaGnomeTrajectoryCacheForTests()
    const first = buildNoaaGnomeTrajectoryParticles()
    const second = buildNoaaGnomeTrajectoryParticles()
    expect(second).toEqual(first)
  })
})

describe('getNoaaGnomeParticlesForHour', () => {
  it('returns 72 particles for hour 0', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const particles = getNoaaGnomeParticlesForHour(0)
    expect(particles).toHaveLength(NOAA_GNOME_PARTICLES_PER_STEP)
  })

  it('returns particles whose positions differ between hour 0 and hour 12', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const hourZero = getNoaaGnomeParticlesForHour(0)
    const hourTwelve = getNoaaGnomeParticlesForHour(12)

    const hourZeroById = new Map(hourZero.map((particle) => [particle.particleId, particle]))
    let movedCount = 0

    for (const particle of hourTwelve) {
      const baseline = hourZeroById.get(particle.particleId)
      if (!baseline) {
        continue
      }

      const moved =
        particle.longitude !== baseline.longitude || particle.latitude !== baseline.latitude
      if (moved) {
        movedCount += 1
      }
    }

    expect(movedCount).toBeGreaterThan(0)
  })

  it('keeps all particles offshore at every hour', () => {
    resetNoaaGnomeTrajectoryCacheForTests()

    for (let hourIndex = 0; hourIndex < NOAA_GNOME_STEP_COUNT; hourIndex += 1) {
      const particles = getNoaaGnomeParticlesForHour(hourIndex)
      for (const particle of particles) {
        expect(isNoaaGnomeOffshorePoint(particle.longitude, particle.latitude)).toBe(true)
      }
    }
  })

  it('spreads particles erratically across the bbox at hour 12', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const particles = getNoaaGnomeParticlesForHour(12)
    const longitudes = particles.map((particle) => particle.longitude)
    const latitudes = particles.map((particle) => particle.latitude)

    expect(standardDeviation(longitudes)).toBeGreaterThan(0.08)
    expect(standardDeviation(latitudes)).toBeGreaterThan(0.04)
  })
})

describe('getNoaaGnomePlumeCentroid', () => {
  it('drifts southeast between hour 0 and later hours', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const hourZero = getNoaaGnomePlumeCentroid(0)
    const hourTwelve = getNoaaGnomePlumeCentroid(12)

    expect(hourTwelve.longitude).toBeGreaterThan(hourZero.longitude)
    expect(hourTwelve.latitude).toBeLessThan(hourZero.latitude)
  })
})

describe('getNoaaGnomeSlickRing', () => {
  it('returns a closed ring with at least four vertices', () => {
    resetNoaaGnomeTrajectoryCacheForTests()
    const ring = getNoaaGnomeSlickRing(6)

    expect(ring.length).toBeGreaterThanOrEqual(4)
    expect(ring[0]).toEqual(ring[ring.length - 1])
  })
})

describe('NOAA_GNOME_HOURLY_FORCING', () => {
  it('has 24 entries with plausible wind and current ranges', () => {
    expect(NOAA_GNOME_HOURLY_FORCING).toHaveLength(NOAA_GNOME_STEP_COUNT)

    for (const forcing of NOAA_GNOME_HOURLY_FORCING) {
      expect(forcing.windSpeedKnots).toBeGreaterThanOrEqual(12)
      expect(forcing.windSpeedKnots).toBeLessThanOrEqual(20)
      expect(forcing.windFromDirectionDeg).toBeGreaterThanOrEqual(140)
      expect(forcing.windFromDirectionDeg).toBeLessThanOrEqual(160)
      expect(forcing.currentSpeedKnots).toBeGreaterThanOrEqual(0.4)
      expect(forcing.currentSpeedKnots).toBeLessThanOrEqual(1.2)
      expect(forcing.currentTowardDirectionDeg).toBeGreaterThanOrEqual(110)
      expect(forcing.currentTowardDirectionDeg).toBeLessThanOrEqual(130)
    }
  })

  it('matches getNoaaGnomeHourlyForcing lookup', () => {
    expect(getNoaaGnomeHourlyForcing(3)).toEqual(NOAA_GNOME_HOURLY_FORCING[3])
  })
})
