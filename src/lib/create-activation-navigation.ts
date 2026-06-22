export type CreateActivationKind = 'incident' | 'exercise'

export const CREATE_INCIDENT_PATH = '/create/incident'
export const CREATE_EXERCISE_PATH = '/create/exercise'

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

export function isBuildTeamActivationStep(kind: CreateActivationKind, step: number): boolean {
  return kind === 'incident' ? step === 2 : step === 3
}

/** Radix portals default to z-50; keep above create-activation page when stacked. */
export const CREATE_ACTIVATION_PORTAL_Z_CLASS = 'z-[250]'
