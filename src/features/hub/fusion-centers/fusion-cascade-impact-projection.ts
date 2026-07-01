import { NOAA_GNOME_STEP_COUNT } from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'

export type FusionCascadeImpactStatus =
  | 'MONITORED'
  | 'ELEVATED'
  | 'HIGH RISK'
  | 'CRITICAL'

export type FusionCascadeImpactProjection = {
  impactScore: number
  status: FusionCascadeImpactStatus
  countdown: string
  operationalStatus: 'Operational' | 'Partially Operational' | 'Not Operational'
  narrative: string
}

type ThreatCascadeProfile = {
  milestoneHour: number
  peakScore: number
  peakStatus: FusionCascadeImpactStatus
  peakOperationalStatus: FusionCascadeImpactProjection['operationalStatus']
  narrative: string
}

const THREAT_PROFILES: Record<string, ThreatCascadeProfile> = {
  'PHT-TOS-001': {
    milestoneHour: 0,
    peakScore: 95,
    peakStatus: 'CRITICAL',
    peakOperationalStatus: 'Not Operational',
    narrative:
      'TOS encryption removes container location, lift planning, and gate control. Information layer offline.',
  },
  'PHT-GATE-002': {
    milestoneHour: 0,
    peakScore: 88,
    peakStatus: 'CRITICAL',
    peakOperationalStatus: 'Not Operational',
    narrative:
      'Gate and lift systems frozen without TOS restoration. Manual workarounds cannot scale to terminal throughput.',
  },
  'PHT-ENRG-003': {
    milestoneHour: 6,
    peakScore: 78,
    peakStatus: 'CRITICAL',
    peakOperationalStatus: 'Partially Operational',
    narrative:
      'Energy-sector impact projected within 6 hours as port fuel and petrochemical logistics stall.',
  },
  'PHT-TRAN-004': {
    milestoneHour: 12,
    peakScore: 62,
    peakStatus: 'HIGH RISK',
    peakOperationalStatus: 'Partially Operational',
    narrative:
      'Transportation disruption within 12 hours; defense logistics impact within 18 hours on military cargo flows.',
  },
  'PHT-FOOD-005': {
    milestoneHour: 24,
    peakScore: 31,
    peakStatus: 'MONITORED',
    peakOperationalStatus: 'Operational',
    narrative:
      'Food supply chain impact projected within 24 hours as refrigerated containers cannot be cleared or routed.',
  },
}

const DEFAULT_PROFILE: ThreatCascadeProfile = {
  milestoneHour: 12,
  peakScore: 50,
  peakStatus: 'ELEVATED',
  peakOperationalStatus: 'Partially Operational',
  narrative: 'Cascade consequence projection for linked critical infrastructure receptor.',
}

function clampHourIndex(hourIndex: number): number {
  return Math.max(0, Math.min(NOAA_GNOME_STEP_COUNT - 1, Math.floor(hourIndex)))
}

function statusForProgress(progress: number): FusionCascadeImpactStatus {
  if (progress >= 0.85) {
    return 'CRITICAL'
  }
  if (progress >= 0.65) {
    return 'HIGH RISK'
  }
  if (progress >= 0.35) {
    return 'ELEVATED'
  }
  return 'MONITORED'
}

function operationalStatusForProgress(
  progress: number,
  peak: FusionCascadeImpactProjection['operationalStatus']
): FusionCascadeImpactProjection['operationalStatus'] {
  if (progress >= 0.85) {
    return peak
  }
  if (progress >= 0.5) {
    return peak === 'Operational' ? 'Partially Operational' : peak
  }
  return 'Operational'
}

function formatCountdown(hoursRemaining: number): string {
  const clamped = Math.max(0, hoursRemaining)
  const hh = String(Math.floor(clamped)).padStart(2, '0')
  return `${hh}:00:00`
}

export function formatFusionCascadeHourLabel(hourIndex: number): string {
  return `T+${clampHourIndex(hourIndex)}h`
}

export function getFusionCascadeImpactProgress(threatId: string, hourIndex: number): number {
  const profile = THREAT_PROFILES[threatId] ?? DEFAULT_PROFILE
  const hour = clampHourIndex(hourIndex)
  if (profile.milestoneHour <= 0) {
    return hour >= 0 ? 1 : 0
  }
  return Math.min(1, hour / profile.milestoneHour)
}

export function getFusionCascadeImpactProjection(
  threatId: string,
  hourIndex: number
): FusionCascadeImpactProjection {
  const profile = THREAT_PROFILES[threatId] ?? DEFAULT_PROFILE
  const progress = getFusionCascadeImpactProgress(threatId, hourIndex)
  const impactScore = Math.round(profile.peakScore * progress)
  const status = progress >= 0.85 ? profile.peakStatus : statusForProgress(progress)
  const hoursRemaining = Math.max(0, profile.milestoneHour - clampHourIndex(hourIndex))

  return {
    impactScore,
    status,
    countdown: formatCountdown(hoursRemaining),
    operationalStatus: operationalStatusForProgress(progress, profile.peakOperationalStatus),
    narrative: profile.narrative,
  }
}

export function impactScoreToArcWidth(impactScore: number): number {
  return Math.max(1, Math.min(6, 1 + impactScore / 18))
}

export function impactStatusToRgba(
  status: FusionCascadeImpactStatus,
  alpha = 200
): [number, number, number, number] {
  switch (status) {
    case 'CRITICAL':
      return [220, 38, 38, alpha]
    case 'HIGH RISK':
      return [245, 158, 11, alpha]
    case 'ELEVATED':
      return [249, 115, 22, alpha]
    case 'MONITORED':
    default:
      return [100, 116, 139, alpha]
  }
}

export function getFusionCascadeArcColors(
  threatId: string,
  hourIndex: number
): {
  sourceColor: [number, number, number, number]
  targetColor: [number, number, number, number]
  width: number
} {
  const projection = getFusionCascadeImpactProjection(threatId, hourIndex)
  const progress = getFusionCascadeImpactProgress(threatId, hourIndex)
  const targetAlpha = Math.round(120 + progress * 135)
  const sourceAlpha = Math.round(80 + progress * 80)

  return {
    sourceColor: [220, 38, 38, sourceAlpha],
    targetColor: impactStatusToRgba(projection.status, targetAlpha),
    width: impactScoreToArcWidth(projection.impactScore),
  }
}
