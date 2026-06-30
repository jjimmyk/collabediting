/**
 * Synthetic PyGNOME TrajectoryGeoJsonOutput-style demo data for the hub map.
 * @see https://github.com/NOAA-ORR-ERD/PyGnome
 * @see https://gnome.orr.noaa.gov/doc/pygnome/index.html
 */

export type NoaaGnomeParticleStatus = 'floating' | 'beached' | 'subsurface'

export type NoaaGnomeTrajectoryParticle = {
  objectId: number
  particleId: string
  longitude: number
  latitude: number
  timeStamp: string
  massG: number
  depthM: number
  status: NoaaGnomeParticleStatus
  moverId: string
  spillId: string
}

export const NOAA_GNOME_SPILL_ID = 'demo-nola-bay-release'
export const NOAA_GNOME_DEMO_START_ISO = '2026-06-01T12:00:00.000Z'
export const NOAA_GNOME_STEP_COUNT = 24
export const NOAA_GNOME_PARTICLES_PER_STEP = 72

/** Mississippi River Delta / Venice, LA release point. */
export const NOAA_GNOME_RELEASE_POINT = {
  longitude: -89.4,
  latitude: 29.27,
  label: 'Demo spill release · Mississippi River Delta',
}

export const NOAA_GNOME_MAP_EXTENT = {
  center: [-89.15, 28.95] as [number, number],
  scale: 450_000,
}

/** Bounding box for plausibility checks (lon min, lat min, lon max, lat max). */
export const NOAA_GNOME_PLUME_BBOX: [number, number, number, number] = [
  -90.2,
  28.4,
  -88.2,
  29.6,
]

function pseudoRandom(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function polarOffset(
  seed: number,
  maxRadiusLon: number,
  maxRadiusLat: number
): { longitude: number; latitude: number } {
  const angle = pseudoRandom(seed) * Math.PI * 2
  const radius = 0.25 + pseudoRandom(seed + 17) * 0.75
  return {
    longitude: Math.cos(angle) * maxRadiusLon * radius,
    latitude: Math.sin(angle) * maxRadiusLat * radius,
  }
}

function statusForParticle(particleIndex: number, hourIndex: number): NoaaGnomeParticleStatus {
  const roll = pseudoRandom(particleIndex * 31 + hourIndex * 7)
  if (hourIndex >= 18 && roll < 0.12) {
    return 'beached'
  }
  if (roll < 0.08) {
    return 'subsurface'
  }
  return 'floating'
}

function buildTimeStepIso(hourIndex: number): string {
  const start = new Date(NOAA_GNOME_DEMO_START_ISO)
  start.setUTCHours(start.getUTCHours() + hourIndex)
  return start.toISOString()
}

export const NOAA_GNOME_TIME_STEPS: string[] = Array.from({ length: NOAA_GNOME_STEP_COUNT }, (_, hourIndex) =>
  buildTimeStepIso(hourIndex)
)

function buildParticleAtStep(particleIndex: number, hourIndex: number): NoaaGnomeTrajectoryParticle {
  const seed = particleIndex * 1000 + hourIndex
  const driftScale = hourIndex + 1
  const driftLon = driftScale * 0.012 * (0.75 + pseudoRandom(particleIndex + 3))
  const driftLat = driftScale * -0.007 * (0.75 + pseudoRandom(particleIndex + 11))
  const spread = polarOffset(seed, 0.018 * Math.sqrt(driftScale), 0.014 * Math.sqrt(driftScale))

  const longitude = NOAA_GNOME_RELEASE_POINT.longitude + driftLon + spread.longitude
  const latitude = NOAA_GNOME_RELEASE_POINT.latitude + driftLat + spread.latitude
  const massG = Math.round(80 + pseudoRandom(seed + 5) * 420)
  const depthM =
    statusForParticle(particleIndex, hourIndex) === 'subsurface'
      ? Number((0.5 + pseudoRandom(seed + 9) * 3.5).toFixed(1))
      : 0

  return {
    objectId: hourIndex * NOAA_GNOME_PARTICLES_PER_STEP + particleIndex + 1,
    particleId: `particle-${String(particleIndex).padStart(3, '0')}`,
    longitude,
    latitude,
    timeStamp: buildTimeStepIso(hourIndex),
    massG,
    depthM,
    status: statusForParticle(particleIndex, hourIndex),
    moverId: 'surface_wind',
    spillId: NOAA_GNOME_SPILL_ID,
  }
}

let cachedParticles: NoaaGnomeTrajectoryParticle[] | null = null

export function buildNoaaGnomeTrajectoryParticles(): NoaaGnomeTrajectoryParticle[] {
  if (cachedParticles) {
    return cachedParticles
  }

  const particles: NoaaGnomeTrajectoryParticle[] = []
  for (let hourIndex = 0; hourIndex < NOAA_GNOME_STEP_COUNT; hourIndex += 1) {
    for (let particleIndex = 0; particleIndex < NOAA_GNOME_PARTICLES_PER_STEP; particleIndex += 1) {
      particles.push(buildParticleAtStep(particleIndex, hourIndex))
    }
  }

  cachedParticles = particles
  return particles
}

export function getNoaaGnomeTimeExtentForHour(hourIndex: number): { start: Date; end: Date } {
  const clamped = Math.max(0, Math.min(NOAA_GNOME_STEP_COUNT - 1, Math.floor(hourIndex)))
  const start = new Date(NOAA_GNOME_TIME_STEPS[clamped])
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { start, end }
}

export function formatNoaaGnomeHourLabel(hourIndex: number): string {
  const clamped = Math.max(0, Math.min(NOAA_GNOME_STEP_COUNT - 1, Math.floor(hourIndex)))
  const date = new Date(NOAA_GNOME_TIME_STEPS[clamped])
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}
