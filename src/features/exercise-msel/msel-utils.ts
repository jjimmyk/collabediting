import { normalizeMselCategory } from './constants'
import {
  getInjectMapFeatures,
  hasInjectMapGeometry,
  normalizeInjectMapFeatures,
} from './msel-geometry-utils'
import type { ExerciseMselState, MselInject } from './types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isValidMapLocation(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    return false
  }
  const [longitude, latitude] = value
  return (
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude)
  )
}

function normalizeInject(raw: unknown): MselInject | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : null
  if (id == null) {
    return null
  }

  const inject: MselInject = {
    id,
    objectiveId:
      typeof record.objectiveId === 'number'
        ? record.objectiveId
        : record.objectiveId == null
          ? null
          : null,
    scheduledTime: typeof record.scheduledTime === 'string' ? record.scheduledTime : '',
    category: normalizeMselCategory(record.category),
    inject: typeof record.inject === 'string' ? record.inject : '',
    expectedAction: typeof record.expectedAction === 'string' ? record.expectedAction : '',
  }

  if (isValidMapLocation(record.mapLocation)) {
    inject.mapLocation = record.mapLocation
  } else if (record.mapLocation === null) {
    inject.mapLocation = null
  }

  if (Array.isArray(record.mapFeatures)) {
    inject.mapFeatures = record.mapFeatures as MselInject['mapFeatures']
  }

  return normalizeInjectMapFeatures(inject)
}

export function defaultExerciseMselInjects(): MselInject[] {
  return [
    {
      id: 1,
      objectiveId: 1,
      scheduledTime: '',
      category: 'Operations',
      inject: '',
      expectedAction: '',
      mapFeatures: [],
      mapLocation: null,
    },
  ]
}

export function defaultExerciseObjectives(): ExerciseMselState['objectives'] {
  return [{ id: 1, name: '' }]
}

export function defaultExerciseMselState(): ExerciseMselState {
  return {
    objectives: defaultExerciseObjectives(),
    injects: defaultExerciseMselInjects(),
  }
}

export function normalizeExerciseMselState(raw: unknown): ExerciseMselState {
  if (!raw || typeof raw !== 'object') {
    return defaultExerciseMselState()
  }

  const record = raw as Record<string, unknown>

  const objectives = Array.isArray(record.objectives)
    ? record.objectives
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null
          }
          const objective = entry as Record<string, unknown>
          if (typeof objective.id !== 'number') {
            return null
          }
          return {
            id: objective.id,
            name: typeof objective.name === 'string' ? objective.name : '',
          }
        })
        .filter((entry): entry is ExerciseMselState['objectives'][number] => entry !== null)
    : []

  const injects = Array.isArray(record.injects)
    ? record.injects
        .map(normalizeInject)
        .filter((entry): entry is MselInject => entry !== null)
    : []

  if (objectives.length === 0 && injects.length === 0) {
    return defaultExerciseMselState()
  }

  return {
    objectives: objectives.length > 0 ? objectives : defaultExerciseObjectives(),
    injects: injects.length > 0 ? injects : defaultExerciseMselInjects(),
  }
}

export function buildExerciseMselFromParts(options: {
  objectives: ExerciseMselState['objectives']
  injects: MselInject[]
}): ExerciseMselState {
  return normalizeExerciseMselState({
    objectives: options.objectives,
    injects: options.injects,
  })
}

export function getExerciseObjectiveLabel(
  objectives: ExerciseMselState['objectives'],
  objectiveId: number | null
): string {
  if (objectiveId == null) {
    return 'No objective selected'
  }
  const objective = objectives.find((entry) => entry.id === objectiveId)
  if (!objective) {
    return 'Unknown objective'
  }
  return objective.name.trim() || 'Untitled objective'
}

export function buildMselInjectPopupContent(
  inject: MselInject,
  objectiveLabel: string
): string {
  const scheduledTime = inject.scheduledTime.trim() || 'Not set'
  const category = inject.category.trim() || 'Uncategorized'
  const injectText = inject.inject.trim() || 'No inject text'
  const expectedAction = inject.expectedAction.trim() || 'No expected action'
  const mapFeatureCount = getInjectMapFeatures(inject).length
  const mapLine =
    mapFeatureCount > 0
      ? `<b>Map:</b> ${mapFeatureCount} shape${mapFeatureCount === 1 ? '' : 's'}`
      : null

  return [
    `<b>Scheduled Time:</b> ${escapeHtml(scheduledTime)}`,
    `<b>Category:</b> ${escapeHtml(category)}`,
    `<b>Objective:</b> ${escapeHtml(objectiveLabel)}`,
    `<b>Inject:</b> ${escapeHtml(injectText)}`,
    `<b>Expected Action:</b> ${escapeHtml(expectedAction)}`,
    mapLine,
  ]
    .filter((line): line is string => Boolean(line))
    .join('<br/>')
}

export function mergeMselInjectUpdate(inject: MselInject, patch: Partial<MselInject>): MselInject {
  return normalizeInjectMapFeatures({ ...inject, ...patch })
}

export { getInjectMapFeatures, hasInjectMapGeometry }

export function exerciseMselStorageKey(workspaceKey: string): string {
  return `exercise-msel-${workspaceKey}`
}

export function exerciseMselDeliveriesStorageKey(workspaceKey: string): string {
  return `exercise-msel-deliveries-${workspaceKey}`
}

export function readLocalExerciseMsel(workspaceKey: string): ExerciseMselState | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(exerciseMselStorageKey(workspaceKey))
    if (!raw) {
      return null
    }
    return normalizeExerciseMselState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeLocalExerciseMsel(workspaceKey: string, state: ExerciseMselState): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(exerciseMselStorageKey(workspaceKey), JSON.stringify(state))
}

export function countLinkedInjectsForObjective(injects: MselInject[], objectiveId: number): number {
  return injects.filter((inject) => inject.objectiveId === objectiveId).length
}

export function nextExerciseObjectiveId(objectives: ExerciseMselState['objectives']): number {
  return objectives.length > 0 ? Math.max(...objectives.map((row) => row.id)) + 1 : 1
}

export function nextMselInjectId(injects: MselInject[]): number {
  return injects.length > 0 ? Math.max(...injects.map((row) => row.id)) + 1 : 1
}
