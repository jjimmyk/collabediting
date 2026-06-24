import { describe, expect, it } from 'vitest'
import {
  USCG_ICS_WORKFLOW,
  USCG_INITIAL_RESPONSE_COMPLEXITY,
  USCG_PLANNING_P_COMPLEXITY,
  TABLETOP_EXERCISE_WORKFLOW,
  getWorkspaceSequentialWorkflowMetadata,
  isPlanningPWorkspace,
  isTabletopExerciseWorkspace,
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

  it('identifies tabletop exercise workspaces', () => {
    expect(
      isTabletopExerciseWorkspace({
        workspaceFormat: TABLETOP_EXERCISE_WORKFLOW,
        kind: 'exercise',
      })
    ).toBe(true)
    expect(
      isTabletopExerciseWorkspace({
        workspaceFormat: TABLETOP_EXERCISE_WORKFLOW,
        kind: 'incident',
      })
    ).toBe(false)
    expect(
      getWorkspaceSequentialWorkflowMetadata({
        workspaceFormat: TABLETOP_EXERCISE_WORKFLOW,
        incidentComplexity: null,
        kind: 'exercise',
      }).hasSequentialWorkflow
    ).toBe(false)
  })
})
