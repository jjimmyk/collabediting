import {
  buildExerciseMselFromParts,
  buildMselInjectPopupContent,
  normalizeExerciseMselState,
} from '../src/features/exercise-msel/msel-utils.ts'
import {
  buildMselInjectGraphicAttributes,
  isMselInjectGraphicHit,
} from '../src/features/exercise-msel/msel-map-utils.ts'
import { normalizeWorkspaceMetadata } from '../api/exercise-msel-metadata.ts'
import { EXERCISE_WORKFLOW_OPTIONS } from '../src/features/workspace-settings/constants.ts'
import { TABLETOP_EXERCISE_WORKFLOW } from '../src/lib/workspace-format.ts'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const tabletopState = buildExerciseMselFromParts({
  workspaceFormat: TABLETOP_EXERCISE_WORKFLOW,
  objectives: [{ id: 1, name: 'Command coordination' }],
  injects: [
    {
      id: 1,
      objectiveId: 1,
      scheduledTime: '2026-06-22T09:00',
      category: 'Operations',
      inject: 'Regional comms failure',
      expectedAction: 'Switch to backup net',
      mapLocation: [-97.7431, 30.2672],
    },
  ],
})

assert(tabletopState.mode === 'tabletop', 'tabletop workspace defaults to tabletop mode')

const normalizedMetadata = normalizeWorkspaceMetadata({
  category: 'Exercise',
  exerciseMsel: tabletopState,
})

assert(
  normalizeExerciseMselState(normalizedMetadata.exerciseMsel).injects[0].inject ===
    'Regional comms failure',
  'metadata round-trip preserves inject text'
)

const popup = buildMselInjectPopupContent(tabletopState.injects[0], 'Command coordination')
assert(popup.includes('Regional comms failure'), 'popup includes inject text')
assert(popup.includes('Switch to backup net'), 'popup includes expected action')

const attributes = buildMselInjectGraphicAttributes(
  tabletopState.injects[0],
  'Command coordination'
)
assert(attributes.kind === 'msel-inject', 'graphic kind is msel-inject')
assert(isMselInjectGraphicHit(attributes), 'graphic attributes are detectable on map click')

assert(
  EXERCISE_WORKFLOW_OPTIONS.some((option) => option.value === TABLETOP_EXERCISE_WORKFLOW),
  'exercise workflow options include tabletop format'
)

console.log('verify-exercise-msel: ok')
