type NormalizedMselInject = {
  id: number
  objectiveId: number | null
  scheduledTime: string
  category: string
  inject: string
  expectedAction: string
  mapLocation?: [number, number] | null
}

export type NormalizedExerciseMselState = {
  objectives: Array<{ id: number; name: string }>
  injects: NormalizedMselInject[]
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

export function normalizeExerciseMselMetadata(raw: unknown): NormalizedExerciseMselState | null {
  if (!raw || typeof raw !== 'object') {
    return null
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
        .filter((entry): entry is { id: number; name: string } => entry !== null)
    : []

  const injects = Array.isArray(record.injects)
    ? record.injects
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null
          }
          const inject = entry as Record<string, unknown>
          if (typeof inject.id !== 'number') {
            return null
          }
          const normalized: NormalizedMselInject = {
            id: inject.id,
            objectiveId:
              typeof inject.objectiveId === 'number'
                ? inject.objectiveId
                : inject.objectiveId == null
                  ? null
                  : null,
            scheduledTime: typeof inject.scheduledTime === 'string' ? inject.scheduledTime : '',
            category: typeof inject.category === 'string' ? inject.category : 'Operations',
            inject: typeof inject.inject === 'string' ? inject.inject : '',
            expectedAction:
              typeof inject.expectedAction === 'string' ? inject.expectedAction : '',
          }
          if (isValidMapLocation(inject.mapLocation)) {
            normalized.mapLocation = inject.mapLocation
          } else if (inject.mapLocation === null) {
            normalized.mapLocation = null
          }
          return normalized
        })
        .filter((entry): entry is NormalizedMselInject => entry !== null)
    : []

  if (objectives.length === 0 && injects.length === 0) {
    return null
  }

  return { objectives, injects }
}

export function normalizeWorkspaceMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const next = { ...metadata }
  if ('exerciseMsel' in next) {
    const normalized = normalizeExerciseMselMetadata(next.exerciseMsel)
    if (normalized) {
      next.exerciseMsel = normalized
    } else {
      delete next.exerciseMsel
    }
  }
  return next
}
