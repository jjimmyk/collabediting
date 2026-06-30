export type RosterSchedulingPhase = 'pre_first_op' | 'live_ops'

export function resolveRosterSchedulingPhase(
  startedOperationalPeriodCount: number
): RosterSchedulingPhase {
  return startedOperationalPeriodCount > 0 ? 'live_ops' : 'pre_first_op'
}

export type EffectiveWhenLabels = {
  nowTitle: string
  nowDescription: string
  nextOpTitle: string
  nextOpDescription: (context: {
    isAssignToPosition: boolean
    assignmentKind: 'ics_position' | 'single_resource'
  }) => string
}

export function memberEffectiveWhenLabels(phase: RosterSchedulingPhase): EffectiveWhenLabels {
  if (phase === 'pre_first_op') {
    return {
      nowTitle: 'Add to roster now',
      nowDescription: 'Person is added to the roster immediately.',
      nextOpTitle: 'Add to roster on first operational period',
      nextOpDescription: ({ isAssignToPosition, assignmentKind }) => {
        if (isAssignToPosition) {
          return 'Assignment is scheduled for when the first operational period starts.'
        }
        if (assignmentKind === 'single_resource') {
          return 'Person is added to the roster when the first operational period starts.'
        }
        return 'Person is added to the roster now; assignment applies when the first operational period starts.'
      },
    }
  }

  return {
    nowTitle: 'Now (current period)',
    nowDescription: 'Assignment is active in this operational period.',
    nextOpTitle: 'Next operational period',
    nextOpDescription: ({ isAssignToPosition }) =>
      isAssignToPosition
        ? 'Assignment is scheduled for when the next operational period starts.'
        : 'Person is added to the roster now; assignment applies when the next OP starts.',
  }
}

export function assetEffectiveWhenLabels(phase: RosterSchedulingPhase): EffectiveWhenLabels {
  if (phase === 'pre_first_op') {
    return {
      nowTitle: 'Add to roster now',
      nowDescription: 'Asset placement is active immediately.',
      nextOpTitle: 'Add to roster on first operational period',
      nextOpDescription: () =>
        'Asset stays in the workspace; placement applies when the first operational period starts.',
    }
  }

  return {
    nowTitle: 'Now (current period)',
    nowDescription: 'Asset placement is active in this operational period.',
    nextOpTitle: 'Next operational period',
    nextOpDescription: () =>
      'Asset stays in the workspace; placement applies when the next operational period starts.',
  }
}

export function showsRosterEffectiveWhenUi(params: {
  rosterSchedulingPhase: RosterSchedulingPhase
  operationalPeriodsEnabled: boolean
  isSupabaseEnabled: boolean
}): boolean {
  if (!params.isSupabaseEnabled) {
    return false
  }
  return params.rosterSchedulingPhase === 'pre_first_op' || params.operationalPeriodsEnabled
}

export type AssignmentSectionLabels = {
  timelineNow: string
  timelineNext: string
  assignedNowTitle: string
  scheduledAssignTitle: string
  scheduledUnassignTitle: string
  scheduledOrgChartTitle: string
}

export function assignmentSectionLabels(phase: RosterSchedulingPhase): AssignmentSectionLabels {
  if (phase === 'pre_first_op') {
    return {
      timelineNow: 'Add to roster now',
      timelineNext: 'Add to roster on first operational period',
      assignedNowTitle: 'On roster now',
      scheduledAssignTitle: 'Scheduled for first operational period',
      scheduledUnassignTitle: 'Scheduled unassign (first OP)',
      scheduledOrgChartTitle: 'Scheduled org chart (first OP)',
    }
  }

  return {
    timelineNow: 'Current OP',
    timelineNext: 'Next OP',
    assignedNowTitle: 'Assigned now',
    scheduledAssignTitle: 'Scheduled assign (next OP)',
    scheduledUnassignTitle: 'Scheduled unassign (next OP)',
    scheduledOrgChartTitle: 'Scheduled org chart (next OP)',
  }
}
