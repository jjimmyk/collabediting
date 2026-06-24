import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExerciseMselState } from './types'
import {
  normalizeExerciseMselState,
  readLocalExerciseMsel,
  writeLocalExerciseMsel,
} from './msel-utils'
import { isTabletopExerciseWorkspace, TABLETOP_EXERCISE_WORKFLOW } from '@/lib/workspace-format'
import type { WorkspaceMetadataRecord } from '@/lib/workspace-types'
import { updateWorkspace } from '@/lib/workspace-service'

type UseExerciseMselPersistenceOptions = {
  enabled: boolean
  workspaceId: string | null
  workspaceKey: string | null
  workspaceName: string
  workspaceRegion: string | null
  workspaceSummary: string | null
  workspaceFormat: string | null | undefined
  incidentComplexity: string | null | undefined
  metadata: WorkspaceMetadataRecord | null | undefined
  isSupabaseEnabled: boolean
  getAccessToken: () => Promise<string | null>
}

export function useExerciseMselPersistence(options: UseExerciseMselPersistenceOptions) {
  const defaultMode = isTabletopExerciseWorkspace({
    workspaceFormat: options.workspaceFormat,
    kind: 'exercise',
  })
    ? 'tabletop'
    : 'functional'

  const initialFromMetadata = options.metadata?.exerciseMsel
  const initialFromLocal =
    options.workspaceKey != null ? readLocalExerciseMsel(options.workspaceKey) : null

  const [mselState, setMselState] = useState<ExerciseMselState>(() =>
    normalizeExerciseMselState(initialFromMetadata ?? initialFromLocal, {
      defaultMode,
    })
  )
  const [hydratedKey, setHydratedKey] = useState<string | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!options.enabled || !options.workspaceKey) {
      return
    }
    if (hydratedKey === options.workspaceKey) {
      return
    }

    const fromMetadata = options.metadata?.exerciseMsel
    const fromLocal = readLocalExerciseMsel(options.workspaceKey)
    setMselState(
      normalizeExerciseMselState(fromMetadata ?? fromLocal, {
        defaultMode: isTabletopExerciseWorkspace({
          workspaceFormat: options.workspaceFormat,
          kind: 'exercise',
        })
          ? 'tabletop'
          : 'functional',
      })
    )
    setHydratedKey(options.workspaceKey)
  }, [
    options.enabled,
    options.workspaceKey,
    options.metadata?.exerciseMsel,
    options.workspaceFormat,
    hydratedKey,
  ])

  const persistMselState = useCallback(
    async (nextState: ExerciseMselState) => {
      if (!options.enabled || !options.workspaceKey) {
        return
      }

      writeLocalExerciseMsel(options.workspaceKey, nextState)

      if (!options.isSupabaseEnabled || !options.workspaceId) {
        return
      }

      const accessToken = await options.getAccessToken()
      if (!accessToken) {
        return
      }

      const metadata: WorkspaceMetadataRecord = {
        ...(options.metadata ?? {}),
        exerciseMsel: nextState,
      }

      await updateWorkspace({
        accessToken,
        workspaceId: options.workspaceId,
        name: options.workspaceName,
        region: options.workspaceRegion,
        summary: options.workspaceSummary,
        workspaceFormat: options.workspaceFormat ?? null,
        incidentComplexity: options.incidentComplexity ?? null,
        metadata,
      })
    },
    [
      options.enabled,
      options.workspaceKey,
      options.isSupabaseEnabled,
      options.workspaceId,
      options.getAccessToken,
      options.metadata,
      options.workspaceName,
      options.workspaceRegion,
      options.workspaceSummary,
      options.workspaceFormat,
      options.incidentComplexity,
    ]
  )

  const updateMselState = useCallback(
    (updater: ExerciseMselState | ((previous: ExerciseMselState) => ExerciseMselState)) => {
      setMselState((previous) => {
        const nextState = typeof updater === 'function' ? updater(previous) : updater
        if (options.enabled && options.workspaceKey) {
          writeLocalExerciseMsel(options.workspaceKey, nextState)
          if (saveTimeoutRef.current != null) {
            window.clearTimeout(saveTimeoutRef.current)
          }
          saveTimeoutRef.current = window.setTimeout(() => {
            void persistMselState(nextState)
          }, 800)
        }
        return nextState
      })
    },
    [options.enabled, options.workspaceKey, persistMselState]
  )

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current != null) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const isTabletopWorkspace = isTabletopExerciseWorkspace({
    workspaceFormat: options.workspaceFormat,
    kind: 'exercise',
  })

  return {
    mselState,
    setMselState: updateMselState,
    persistMselState,
    isTabletopWorkspace,
    tabletopWorkflow: TABLETOP_EXERCISE_WORKFLOW,
  }
}
