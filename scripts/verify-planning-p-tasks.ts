import { PLANNING_P_STEPS } from '../src/features/planning-p/planning-p-steps'
import { PLANNING_P_DEFAULT_POSITION } from '../src/features/planning-p/planning-p-task-templates'
import {
  buildTaskProgressByStepId,
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

const byStep = buildTaskProgressByStepId(['Planning Section Chief'], {})
assert(
  PLANNING_P_STEPS.every((step) => byStep[step.id]?.total > 0),
  'Each Planning-P phase should expose tasks for Planning Section Chief'
)

console.log('verify-planning-p-tasks: all assertions passed')
