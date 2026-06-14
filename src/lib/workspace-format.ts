export const USCG_ICS_WORKFLOW = 'uscg-ics' as const

export const DEFAULT_INCIDENT_COMPLEXITY = 'tier-1' as const
export const USCG_INITIAL_RESPONSE_COMPLEXITY = 'initial-response' as const
export const USCG_PLANNING_P_COMPLEXITY = 'planning-p' as const

export type IncidentComplexityValue =
  | typeof DEFAULT_INCIDENT_COMPLEXITY
  | 'tier-2'
  | 'tier-3'
  | typeof USCG_INITIAL_RESPONSE_COMPLEXITY
  | typeof USCG_PLANNING_P_COMPLEXITY

export const STANDARD_INCIDENT_COMPLEXITY_OPTIONS = [
  { value: DEFAULT_INCIDENT_COMPLEXITY, label: 'Minor (Tier 1)' },
  { value: 'tier-2', label: 'Major (Tier 2)' },
  { value: 'tier-3', label: 'Full (Tier 3)' },
] as const

export const USCG_INCIDENT_COMPLEXITY_OPTIONS = [
  { value: USCG_INITIAL_RESPONSE_COMPLEXITY, label: 'Initial Response' },
  { value: USCG_PLANNING_P_COMPLEXITY, label: 'Planning-P' },
] as const

export function getIncidentComplexityOptionsForWorkflow(workflow: string) {
  if (workflow === USCG_ICS_WORKFLOW) {
    return USCG_INCIDENT_COMPLEXITY_OPTIONS
  }
  return STANDARD_INCIDENT_COMPLEXITY_OPTIONS
}

export function normalizeIncidentComplexityForWorkflow(
  workflow: string,
  complexity: string
): IncidentComplexityValue {
  const options = getIncidentComplexityOptionsForWorkflow(workflow)
  if (options.some((option) => option.value === complexity)) {
    return complexity as IncidentComplexityValue
  }
  return workflow === USCG_ICS_WORKFLOW
    ? USCG_INITIAL_RESPONSE_COMPLEXITY
    : DEFAULT_INCIDENT_COMPLEXITY
}

export const SEQUENTIAL_WORKFLOW_PLANNING_P = USCG_PLANNING_P_COMPLEXITY

export type SequentialWorkflowType = typeof SEQUENTIAL_WORKFLOW_PLANNING_P

export function isPlanningPWorkspace(options: {
  workspaceFormat?: string | null
  incidentComplexity?: string | null
}) {
  return (
    options.workspaceFormat === USCG_ICS_WORKFLOW &&
    options.incidentComplexity === USCG_PLANNING_P_COMPLEXITY
  )
}

/** @deprecated Use {@link isPlanningPWorkspace} */
export const isPlanningPIncidentWorkspace = isPlanningPWorkspace

export function workspaceSupportsOperationalPeriods(options: {
  workspaceFormat?: string | null
  incidentComplexity?: string | null
}) {
  return isPlanningPWorkspace(options)
}

export function getWorkspaceSequentialWorkflowMetadata(options: {
  workspaceFormat?: string | null
  incidentComplexity?: string | null
  kind?: 'incident' | 'exercise'
}) {
  const workspaceFormat = options.workspaceFormat?.trim() || null
  const incidentComplexity = options.incidentComplexity?.trim() || null
  const isPlanningP = isPlanningPWorkspace({
    workspaceFormat,
    incidentComplexity,
  })

  return {
    workspaceFormat,
    incidentComplexity,
    hasSequentialWorkflow: isPlanningP,
    sequentialWorkflowType: isPlanningP ? SEQUENTIAL_WORKFLOW_PLANNING_P : null,
  }
}

export function workspaceHasPlanningPStepper(options: {
  workspaceFormat?: string
  incidentComplexity?: string
  hasSequentialWorkflow?: boolean
  sequentialWorkflowType?: string | null
}) {
  if (
    options.hasSequentialWorkflow &&
    options.sequentialWorkflowType === SEQUENTIAL_WORKFLOW_PLANNING_P
  ) {
    return true
  }

  return isPlanningPWorkspace({
    workspaceFormat: options.workspaceFormat,
    incidentComplexity: options.incidentComplexity,
  })
}
