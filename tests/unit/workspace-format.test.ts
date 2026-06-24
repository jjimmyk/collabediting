import { describe, expect, it } from 'vitest'
import {
  USCG_ICS_WORKFLOW,
  USCG_INITIAL_RESPONSE_COMPLEXITY,
  USCG_PLANNING_P_COMPLEXITY,
  getWorkspaceSequentialWorkflowMetadata,
  isPlanningPWorkspace,
  isUscgInitialResponseWorkspace,
  workspaceHasPlanningPStepper,
  workspaceSupportsOperationalPeriods,
} from '@/lib/workspace-format'

describe('workspace-format', () => {
  it('identifies Planning-P USCG workspaces', () => {
    expect(
      isPlanningPWorkspace({
        workspaceFormat: USCG_ICS_WORKFLOW,
        incidentComplexity: USCG_PLANNING_P_COMPLEXITY,
      })
    ).toBe(true)
  })

  it('identifies Initial Response as non-Planning-P', () => {
    expect(
      isUscgInitialResponseWorkspace({
        workspaceFormat: USCG_ICS_WORKFLOW,
        incidentComplexity: USCG_INITIAL_RESPONSE_COMPLEXITY,
      })
    ).toBe(true)
    expect(workspaceSupportsOperationalPeriods({
      workspaceFormat: USCG_ICS_WORKFLOW,
      incidentComplexity: USCG_INITIAL_RESPONSE_COMPLEXITY,
    })).toBe(false)
  })

  it('derives sequential workflow metadata when upgrading complexity', () => {
    const initial = getWorkspaceSequentialWorkflowMetadata({
      workspaceFormat: USCG_ICS_WORKFLOW,
      incidentComplexity: USCG_INITIAL_RESPONSE_COMPLEXITY,
      kind: 'incident',
    })
    expect(initial.hasSequentialWorkflow).toBe(false)
    expect(initial.sequentialWorkflowType).toBeNull()

    const planningP = getWorkspaceSequentialWorkflowMetadata({
      workspaceFormat: USCG_ICS_WORKFLOW,
      incidentComplexity: USCG_PLANNING_P_COMPLEXITY,
      kind: 'incident',
    })
    expect(planningP.hasSequentialWorkflow).toBe(true)
    expect(planningP.sequentialWorkflowType).toBe('planning-p')
  })

  it('shows Planning-P stepper from metadata flags', () => {
    expect(
      workspaceHasPlanningPStepper({
        workspaceFormat: USCG_ICS_WORKFLOW,
        incidentComplexity: USCG_PLANNING_P_COMPLEXITY,
        hasSequentialWorkflow: true,
        sequentialWorkflowType: 'planning-p',
      })
    ).toBe(true)
  })
})
