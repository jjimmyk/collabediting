import { useCallback, useEffect, useState } from 'react'
import type { StandardPositionLifecycleRow } from '@/lib/operational-period-roster-types'
import {
  archiveStandardPositionFromRoster,
  fetchWorkspaceStandardPositionLifecycle,
  setStandardPositionRetireOnOpAdvance,
} from '@/lib/workspace-roster-position-lifecycle-service'

type UseWorkspacePositionLifecycleOptions = {
  enabled: boolean
  workspaceId: string | null
}

export function useWorkspacePositionLifecycle({
  enabled,
  workspaceId,
}: UseWorkspacePositionLifecycleOptions) {
  const [standardLifecycle, setStandardLifecycle] = useState<StandardPositionLifecycleRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setStandardLifecycle([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const rows = await fetchWorkspaceStandardPositionLifecycle(workspaceId)
      setStandardLifecycle(rows)
    } catch (loadError) {
      setStandardLifecycle([])
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load position lifecycle.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [enabled, workspaceId])

  useEffect(() => {
    void reload()
  }, [reload])

  const setStandardRetireLabel = useCallback(
    async (positionName: string, enabled: boolean) => {
      if (!workspaceId) {
        throw new Error('Workspace is not available.')
      }
      await setStandardPositionRetireOnOpAdvance({
        workspaceId,
        positionName,
        enabled,
      })
      await reload()
    },
    [reload, workspaceId]
  )

  const archiveStandardPosition = useCallback(
    async (positionName: string) => {
      if (!workspaceId) {
        throw new Error('Workspace is not available.')
      }
      await archiveStandardPositionFromRoster({
        workspaceId,
        positionName,
      })
      await reload()
    },
    [reload, workspaceId]
  )

  return {
    standardLifecycle,
    isLoading,
    error,
    reload,
    setStandardRetireLabel,
    archiveStandardPosition,
  }
}
