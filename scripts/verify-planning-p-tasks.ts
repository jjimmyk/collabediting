import {
  PLANNING_P_STEPS,
  getPlanningPStepLabel,
  getPlanningPWorkflowProgress,
  parsePlanningPStepSchedule,
} from '../src/features/planning-p/planning-p-steps'
import { PLANNING_P_DEFAULT_POSITION } from '../src/features/planning-p/planning-p-task-templates'
import {
  buildAllTaskProgressByStepId,
  buildMyTaskProgressByStepId,
  getAllTasksForPhase,
  getTaskProgress,
  getTasksForPhaseAndPositions,
} from '../src/features/planning-p/planning-p-task-utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const icTasks = getTasksForPhaseAndPositions('objectives-meeting', ['Incident Commander'])
assert(icTasks.length >= 2, 'Incident Commander should have multiple objectives-meeting tasks')

const allObjectivesTasks = getAllTasksForPhase('objectives-meeting')
assert(
  allObjectivesTasks.length >= icTasks.length,
  'All Tasks should include at least as many tasks as My Tasks for IC'
)

const mergedTasks = getTasksForPhaseAndPositions('cg-staff-meeting', [
  'Operations Section Chief',
  'Planning Section Chief',
])
assert(mergedTasks.length >= 3, 'Merged section chief tasks should include both positions and defaults')

const dedupedTasks = getTasksForPhaseAndPositions('operations-briefing', [
  'Operations Section Chief',
  'Operations Section Chief',
])
const uniqueIds = new Set(dedupedTasks.map((task) => task.id))
assert(uniqueIds.size === dedupedTasks.length, 'Duplicate positions should not duplicate tasks')

const defaultTasks = getTasksForPhaseAndPositions('tactics-meeting', [])
assert(
  defaultTasks.every((task) => task.position === PLANNING_P_DEFAULT_POSITION),
  'Unassigned users should receive default tasks'
)

const customTasks = getTasksForPhaseAndPositions('planning-meeting', ['Custom Liaison Lead'])
assert(customTasks.length > 0, 'Unknown positions should fall back to default tasks')

const completions = Object.fromEntries(icTasks.slice(0, 1).map((task) => [task.id, true]))
const progress = getTaskProgress(icTasks, completions)
assert(progress.completed === 1, 'Progress completed count should match checked tasks')
assert(progress.total === icTasks.length, 'Progress total should match task count')
assert(
  progress.percent === Math.round((1 / icTasks.length) * 100),
  'Progress percent should be rounded correctly'
)

const myByStep = buildMyTaskProgressByStepId(['Planning Section Chief'], {})
const allByStep = buildAllTaskProgressByStepId({})
assert(
  PLANNING_P_STEPS.every((step) => myByStep[step.id]?.total > 0),
  'Each Planning-P phase should expose My Tasks for Planning Section Chief'
)
assert(
  PLANNING_P_STEPS.every(
    (step) => allByStep[step.id]?.total >= myByStep[step.id]?.total
  ),
  'All Tasks totals should be greater than or equal to My Tasks totals'
)

assert(
  getPlanningPStepLabel('objectives-meeting') === 'IC / UC Objectives Meeting',
  'getPlanningPStepLabel should resolve step labels'
)

assert(
  getPlanningPWorkflowProgress('objectives-meeting') === 0,
  'First Planning-P phase should have 0 workflow progress'
)
assert(
  getPlanningPWorkflowProgress('operations-briefing') === 88,
  'Last Planning-P phase should reflect completed prior phases'
)

const schedule = parsePlanningPStepSchedule('11:30 – 12:00')
assert(schedule.start === '11:30' && schedule.end === '12:00', 'Should parse phase schedule window')

console.log('verify-planning-p-tasks: all assertions passed')
