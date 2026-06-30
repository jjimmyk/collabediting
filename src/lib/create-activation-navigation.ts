export type CreateActivationKind = 'incident' | 'exercise'

export const CREATE_INCIDENT_PATH = '/create/incident'
export const CREATE_EXERCISE_PATH = '/create/exercise'

export const CREATE_INCIDENT_ACTIVATION_STEP = {
  nameLocation: 0,
  initialReport: 1,
  ics201: 2,
  buildTeam: 3,
  scheduleMeetings: 4,
  notifications: 5,
} as const

export const CREATE_EXERCISE_ACTIVATION_STEP = {
  nameLocation: 0,
  objectives: 1,
  initialReport: 2,
  ics201: 3,
  buildTeam: 4,
  scheduleMeetings: 5,
  notifications: 6,
  msel: 7,
} as const

export type CreateIncidentActivationStepKey = keyof typeof CREATE_INCIDENT_ACTIVATION_STEP
export type CreateExerciseActivationStepKey = keyof typeof CREATE_EXERCISE_ACTIVATION_STEP

export function getCreateActivationKindFromPath(
  pathname: string
): CreateActivationKind | null {
  if (pathname === CREATE_INCIDENT_PATH || pathname.startsWith(`${CREATE_INCIDENT_PATH}/`)) {
    return 'incident'
  }
  if (pathname === CREATE_EXERCISE_PATH || pathname.startsWith(`${CREATE_EXERCISE_PATH}/`)) {
    return 'exercise'
  }
  return null
}

export function navigateToCreateActivation(kind: CreateActivationKind) {
  const path = kind === 'incident' ? CREATE_INCIDENT_PATH : CREATE_EXERCISE_PATH
  if (window.location.pathname !== path) {
    window.history.pushState({ createActivation: kind }, '', path)
  }
}

export function navigateFromCreateActivation() {
  if (window.location.pathname.startsWith('/create/')) {
    window.history.pushState({}, '', '/')
  }
}

export function getActivationStepIndex(
  kind: CreateActivationKind,
  key: CreateIncidentActivationStepKey | CreateExerciseActivationStepKey
): number {
  if (kind === 'incident') {
    return CREATE_INCIDENT_ACTIVATION_STEP[key as CreateIncidentActivationStepKey]
  }
  return CREATE_EXERCISE_ACTIVATION_STEP[key as CreateExerciseActivationStepKey]
}

export function isActivationStep(
  kind: CreateActivationKind,
  step: number,
  key: CreateIncidentActivationStepKey | CreateExerciseActivationStepKey
): boolean {
  return getActivationStepIndex(kind, key) === step
}

export function isBuildTeamActivationStep(kind: CreateActivationKind, step: number): boolean {
  return isActivationStep(kind, step, 'buildTeam')
}

/** Radix portals default to z-50; keep above create-activation page when stacked. */
export const CREATE_ACTIVATION_PORTAL_Z_CLASS = 'z-[250]'
