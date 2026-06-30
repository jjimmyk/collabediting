/**
 * Synthetic PyGNOME TrajectoryGeoJsonOutput-style data for the hub map.
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

export const NOAA_GNOME_SPILL_ID = 'nola-offshore-release'
export const NOAA_GNOME_START_ISO = '2026-06-01T12:00:00.000Z'
export const NOAA_GNOME_STEP_COUNT = 24
export const NOAA_GNOME_PARTICLES_PER_STEP = 72

/** Open Gulf release south of the Mississippi River Delta. */
export const NOAA_GNOME_RELEASE_POINT = {
  longitude: -89.1,
  latitude: 28.82,
  label: 'Spill release · Mississippi River Delta offshore',
}

export const NOAA_GNOME_MAP_EXTENT = {
  center: [-89.0, 28.65] as [number, number],
  scale: 450_000,
}

/** Bounding box for plausibility checks (lon min, lat min, lon max, lat max). */
export const NOAA_GNOME_PLUME_BBOX: [number, number, number, number] = [
  -90.0,
  28.2,
  -88.3,
  28.95,
]

const OFFSHORE_BUFFER_DEG = 0.06

function pseudoRandom(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function clampHourIndex(hourIndex: number): number {
  return Math.max(0, Math.min(NOAA_GNOME_STEP_COUNT - 1, Math.floor(hourIndex)))
}

function buildTimeStepIso(hourIndex: number): string {
  const start = new Date(NOAA_GNOME_START_ISO)
  start.setUTCHours(start.getUTCHours() + hourIndex)
  return start.toISOString()
}

export const NOAA_GNOME_TIME_STEPS: string[] = Array.from({ length: NOAA_GNOME_STEP_COUNT }, (_, hourIndex) =>
  buildTimeStepIso(hourIndex)
)

function maxOffshoreLatitude(longitude: number): number {
  return 28.95 + (longitude + 89.5) * 0.1 - OFFSHORE_BUFFER_DEG
}

export function isNoaaGnomeOffshorePoint(longitude: number, latitude: number): boolean {
  const [minLon, minLat, maxLon, maxLat] = NOAA_GNOME_PLUME_BBOX
  if (longitude < minLon || longitude > maxLon || latitude < minLat || latitude > maxLat) {
    return false
  }
  return latitude <= maxOffshoreLatitude(longitude)
}

function clampNoaaGnomeParticleToOcean(
  longitude: number,
  latitude: number,
  seed: number
): { longitude: number; latitude: number } {
  const [minLon, minLat, maxLon, maxLat] = NOAA_GNOME_PLUME_BBOX
  let lon = Math.max(minLon, Math.min(maxLon, longitude))
  let lat = Math.max(minLat, Math.min(maxLat, latitude))

  const maxLatAtLon = maxOffshoreLatitude(lon)
  if (lat > maxLatAtLon) {
    lat = maxLatAtLon - pseudoRandom(seed + 101) * 0.04
  }

  if (!isNoaaGnomeOffshorePoint(lon, lat)) {
    lat = Math.min(maxLatAtLon - 0.02, lat)
    lon = Math.max(minLon, Math.min(maxLon, lon))
  }

  return { longitude: lon, latitude: lat }
}

function knotsToDegreesPerHour(knots: number, directionTowardDeg: number): { lon: number; lat: number } {
  const radians = (directionTowardDeg * Math.PI) / 180
  const nauticalMilesPerHour = knots
  const degreesLat = (nauticalMilesPerHour / 60) * Math.cos(radians)
  const degreesLon =
    (nauticalMilesPerHour / 60) * Math.sin(radians) / Math.cos((28.7 * Math.PI) / 180)
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

function erraticSpread(
  particleIndex: number,
  hourIndex: number
): { longitude: number; latitude: number } {
  const seed = particleIndex * 1000 + hourIndex
  const [minLon, minLat, maxLon, maxLat] = NOAA_GNOME_PLUME_BBOX
  const envelope = 0.35 + (hourIndex / Math.max(1, NOAA_GNOME_STEP_COUNT - 1)) * 0.65
  const halfLon = ((maxLon - minLon) / 2) * envelope
  const halfLat = ((maxLat - minLat) / 2) * envelope

  const u = pseudoRandom(seed) * 2 - 1
  const v = pseudoRandom(seed + 23) * 2 - 1
  const w = pseudoRandom(seed + 47) * 2 - 1
  const x = pseudoRandom(seed + 71) * 2 - 1
  const biasLon = (pseudoRandom(particleIndex * 13 + 5) * 2 - 1) * halfLon * 0.35
  const biasLat = (pseudoRandom(particleIndex * 19 + 11) * 2 - 1) * halfLat * 0.35

  return {
    longitude: (u + 0.4 * w) * halfLon + biasLon,
    latitude: (v + 0.4 * x) * halfLat + biasLat,
  }
}

function statusForParticle(particleIndex: number, hourIndex: number): NoaaGnomeParticleStatus {
  const roll = pseudoRandom(particleIndex * 31 + hourIndex * 7)
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
  const spread = erraticSpread(particleIndex, hourIndex)

  const rawLongitude = NOAA_GNOME_RELEASE_POINT.longitude + drift.lon + spread.longitude
  const rawLatitude = NOAA_GNOME_RELEASE_POINT.latitude + drift.lat + spread.latitude
  const clamped = clampNoaaGnomeParticleToOcean(rawLongitude, rawLatitude, seed)
  const massG = Math.round(80 + pseudoRandom(seed + 5) * 420)
  const depthM =
    statusForParticle(particleIndex, hourIndex) === 'subsurface'
      ? Number((0.5 + pseudoRandom(seed + 9) * 3.5).toFixed(1))
      : 0

  return {
    objectId: hourIndex * NOAA_GNOME_PARTICLES_PER_STEP + particleIndex + 1,
    particleId: `particle-${String(particleIndex).padStart(3, '0')}`,
    longitude: clamped.longitude,
    latitude: clamped.latitude,
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
  return getNoaaGnomePlumeHullRing(hourIndex, 1.35)
}

function crossProduct(
  origin: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0])
}

function buildConvexHull(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length < 3) {
    return points
  }

  const sorted = [...points].sort((left, right) =>
    left[0] === right[0] ? left[1] - right[1] : left[0] - right[0]
  )

  const lower: Array<[number, number]> = []
  for (const point of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }

  const upper: Array<[number, number]> = []
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }

  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}

function expandHullRing(
  ring: Array<[number, number]>,
  padFactor: number
): Array<[number, number]> {
  if (ring.length === 0) {
    return ring
  }

  const centroid = ring.reduce(
    (accumulator, [longitude, latitude]) => ({
      longitude: accumulator.longitude + longitude / ring.length,
      latitude: accumulator.latitude + latitude / ring.length,
    }),
    { longitude: 0, latitude: 0 }
  )

  const expanded = ring.map(([longitude, latitude]) => {
    const deltaLon = longitude - centroid.longitude
    const deltaLat = latitude - centroid.latitude
    return [
      centroid.longitude + deltaLon * padFactor,
      centroid.latitude + deltaLat * padFactor,
    ] as [number, number]
  })

  if (expanded.length === 0) {
    return expanded
  }

  return [...expanded, expanded[0]]
}

export function getNoaaGnomePlumeHullRing(hourIndex: number, padFactor = 1.2): Array<[number, number]> {
  const particles = getNoaaGnomeParticlesForHour(hourIndex)
  if (particles.length === 0) {
    return []
  }

  const points = particles.map(
    (particle) => [particle.longitude, particle.latitude] as [number, number]
  )
  const hull =
    points.length >= 3 ? buildConvexHull(points) : points
  const hourPad = 1 + hourIndex * 0.025
  const ring = expandHullRing(hull, padFactor * hourPad)

  return ring.map(([longitude, latitude]) => {
    const clamped = clampNoaaGnomeParticleToOcean(longitude, latitude, hourIndex * 100 + longitude * 1000)
    return [clamped.longitude, clamped.latitude] as [number, number]
  })
}

function pseudoRandomForParticle(particleId: string, salt: number): number {
  let seed = salt
  for (let index = 0; index < particleId.length; index += 1) {
    seed = (seed * 31 + particleId.charCodeAt(index)) % 233280
  }
  return seed / 233280
}

export function getNoaaGnomeParticleSplatRadius(
  particle: NoaaGnomeTrajectoryParticle,
  hourIndex: number
): { longitude: number; latitude: number } {
  const roll = pseudoRandomForParticle(particle.particleId, hourIndex * 17 + 3)
  const base = 0.014 + hourIndex * 0.0012
  const stretch = 0.85 + roll * 0.35
  return {
    longitude: base * stretch,
    latitude: base * (0.75 + roll * 0.25),
  }
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
