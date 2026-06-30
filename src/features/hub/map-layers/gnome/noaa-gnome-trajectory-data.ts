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

export type NoaaGnomeHourlyForcing = {
  hourIndex: number
  windSpeedKnots: number
  windFromDirectionDeg: number
  currentSpeedKnots: number
  currentTowardDirectionDeg: number
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

function clampHourIndex(hourIndex: number): number {
  return Math.max(0, Math.min(NOAA_GNOME_STEP_COUNT - 1, Math.floor(hourIndex)))
}

function buildTimeStepIso(hourIndex: number): string {
  const start = new Date(NOAA_GNOME_DEMO_START_ISO)
  start.setUTCHours(start.getUTCHours() + hourIndex)
  return start.toISOString()
}

export const NOAA_GNOME_TIME_STEPS: string[] = Array.from({ length: NOAA_GNOME_STEP_COUNT }, (_, hourIndex) =>
  buildTimeStepIso(hourIndex)
)

function knotsToDegreesPerHour(knots: number, directionTowardDeg: number): { lon: number; lat: number } {
  const radians = (directionTowardDeg * Math.PI) / 180
  const nauticalMilesPerHour = knots
  const degreesLat = (nauticalMilesPerHour / 60) * Math.cos(radians)
  const degreesLon = (nauticalMilesPerHour / 60) * Math.sin(radians) / Math.cos((29 * Math.PI) / 180)
  return { lon: degreesLon, lat: degreesLat }
}

function buildHourlyForcing(hourIndex: number): NoaaGnomeHourlyForcing {
  const seed = hourIndex * 17 + 41
  const windSpeedKnots = Number((12 + pseudoRandom(seed) * 8).toFixed(1))
  const windFromDirectionDeg = Math.round(140 + pseudoRandom(seed + 3) * 20)
  const currentSpeedKnots = Number((0.4 + pseudoRandom(seed + 7) * 0.8).toFixed(2))
  const currentTowardDirectionDeg = Math.round(110 + pseudoRandom(seed + 11) * 20)

  return {
    hourIndex,
    windSpeedKnots,
    windFromDirectionDeg,
    currentSpeedKnots,
    currentTowardDirectionDeg,
  }
}

export const NOAA_GNOME_HOURLY_FORCING: NoaaGnomeHourlyForcing[] = Array.from(
  { length: NOAA_GNOME_STEP_COUNT },
  (_, hourIndex) => buildHourlyForcing(hourIndex)
)

export function getNoaaGnomeHourlyForcing(hourIndex: number): NoaaGnomeHourlyForcing {
  return NOAA_GNOME_HOURLY_FORCING[clampHourIndex(hourIndex)]
}

function windDriftVector(forcing: NoaaGnomeHourlyForcing): { lon: number; lat: number } {
  const windTowardDeg = (forcing.windFromDirectionDeg + 180) % 360
  const vector = knotsToDegreesPerHour(forcing.windSpeedKnots * 0.018, windTowardDeg)
  return vector
}

function currentDriftVector(forcing: NoaaGnomeHourlyForcing): { lon: number; lat: number } {
  return knotsToDegreesPerHour(forcing.currentSpeedKnots * 1.35, forcing.currentTowardDirectionDeg)
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

function cumulativeDriftThroughHour(hourIndex: number): { lon: number; lat: number } {
  let lon = 0
  let lat = 0

  for (let step = 0; step <= hourIndex; step += 1) {
    const forcing = getNoaaGnomeHourlyForcing(step)
    const wind = windDriftVector(forcing)
    const current = currentDriftVector(forcing)
    lon += wind.lon + current.lon
    lat += wind.lat + current.lat
  }

  return { lon, lat }
}

function buildParticleAtStep(particleIndex: number, hourIndex: number): NoaaGnomeTrajectoryParticle {
  const seed = particleIndex * 1000 + hourIndex
  const drift = cumulativeDriftThroughHour(hourIndex)
  const spread = polarOffset(seed, 0.012 + hourIndex * 0.0018, 0.009 + hourIndex * 0.0012)

  const longitude = NOAA_GNOME_RELEASE_POINT.longitude + drift.lon + spread.longitude
  const latitude = NOAA_GNOME_RELEASE_POINT.latitude + drift.lat + spread.latitude
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

export function getNoaaGnomeParticlesForHour(hourIndex: number): NoaaGnomeTrajectoryParticle[] {
  const clamped = clampHourIndex(hourIndex)
  const timeStamp = buildTimeStepIso(clamped)
  return buildNoaaGnomeTrajectoryParticles().filter((particle) => particle.timeStamp === timeStamp)
}

export function getNoaaGnomePlumeCentroid(hourIndex: number): { longitude: number; latitude: number } {
  const particles = getNoaaGnomeParticlesForHour(hourIndex)
  if (particles.length === 0) {
    return {
      longitude: NOAA_GNOME_RELEASE_POINT.longitude,
      latitude: NOAA_GNOME_RELEASE_POINT.latitude,
    }
  }

  const totals = particles.reduce(
    (accumulator, particle) => ({
      longitude: accumulator.longitude + particle.longitude,
      latitude: accumulator.latitude + particle.latitude,
    }),
    { longitude: 0, latitude: 0 }
  )

  return {
    longitude: totals.longitude / particles.length,
    latitude: totals.latitude / particles.length,
  }
}

export function getNoaaGnomeSlickRing(hourIndex: number): Array<[number, number]> {
  const particles = getNoaaGnomeParticlesForHour(hourIndex)
  if (particles.length === 0) {
    return []
  }

  const sortedByDistance = [...particles].sort((left, right) => {
    const centroid = getNoaaGnomePlumeCentroid(hourIndex)
    const leftDistance =
      (left.longitude - centroid.longitude) ** 2 + (left.latitude - centroid.latitude) ** 2
    const rightDistance =
      (right.longitude - centroid.longitude) ** 2 + (right.latitude - centroid.latitude) ** 2
    return rightDistance - leftDistance
  })

  const outerCount = Math.max(8, Math.ceil(sortedByDistance.length * 0.25))
  const outerParticles = sortedByDistance.slice(0, outerCount)

  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const particle of outerParticles) {
    minLon = Math.min(minLon, particle.longitude)
    maxLon = Math.max(maxLon, particle.longitude)
    minLat = Math.min(minLat, particle.latitude)
    maxLat = Math.max(maxLat, particle.latitude)
  }

  const padLon = 0.012 + hourIndex * 0.0015
  const padLat = 0.009 + hourIndex * 0.001

  return [
    [minLon - padLon, minLat - padLat],
    [maxLon + padLon, minLat - padLat],
    [maxLon + padLon, maxLat + padLat],
    [minLon - padLon, maxLat + padLat],
    [minLon - padLon, minLat - padLat],
  ]
}

export function getNoaaGnomeTimeExtentForHour(hourIndex: number): { start: Date; end: Date } {
  const clamped = clampHourIndex(hourIndex)
  const start = new Date(NOAA_GNOME_TIME_STEPS[clamped])
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { start, end }
}

export function formatNoaaGnomeHourLabel(hourIndex: number): string {
  const clamped = clampHourIndex(hourIndex)
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

export function formatCardinalDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(normalized / 45) % labels.length
  return labels[index]
}

export function formatWindForcing(forcing: NoaaGnomeHourlyForcing): string {
  return `${forcing.windSpeedKnots} kn from ${forcing.windFromDirectionDeg}° (${formatCardinalDirection(forcing.windFromDirectionDeg)})`
}

export function formatCurrentForcing(forcing: NoaaGnomeHourlyForcing): string {
  return `${forcing.currentSpeedKnots} kn toward ${forcing.currentTowardDirectionDeg}° (${formatCardinalDirection(forcing.currentTowardDirectionDeg)})`
}

/** @internal Reset cached particles for unit tests. */
export function resetNoaaGnomeTrajectoryCacheForTests() {
  cachedParticles = null
}
