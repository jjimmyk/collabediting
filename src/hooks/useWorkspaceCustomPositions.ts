import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildWorkspacePositionCatalog,
  emptyWorkspacePositionCatalog,
  type WorkspaceCustomPosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import type { StandardPositionLifecycleRow } from '@/lib/operational-period-roster-types'
import {
  createWorkspaceCustomPosition,
  deleteWorkspaceCustomPosition,
  fetchWorkspaceCustomPositions,
  updateWorkspaceCustomPosition,
  updateWorkspaceCustomPositionLifecycleStatus,
} from '@/lib/workspace-custom-position-service'

type UseWorkspaceCustomPositionsOptions = {
  enabled: boolean
  workspaceId: string | null
  localWorkspaceKey?: string | null
  userId: string | null
  standardLifecycle?: StandardPositionLifecycleRow[]
  getAccessToken?: () => Promise<string | null>
}

export function useWorkspaceCustomPositions({
  enabled,
  workspaceId,
  localWorkspaceKey,
  userId,
  standardLifecycle = [],
  getAccessToken,
}: UseWorkspaceCustomPositionsOptions) {
  const [customPositions, setCustomPositions] = useState<WorkspaceCustomPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storageKey = workspaceId ?? localWorkspaceKey ?? null

  useEffect(() => {
    if (!enabled || !storageKey) {
      setCustomPositions([])
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const key = storageKey

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const rows = await fetchWorkspaceCustomPositions(key)
        if (cancelled) return
        setCustomPositions(rows)
      } catch (loadError) {
        if (cancelled) return
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load custom positions.'
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [enabled, storageKey])

  const catalog = useMemo<WorkspacePositionCatalog>(
    () =>
      enabled
        ? buildWorkspacePositionCatalog(customPositions, standardLifecycle)
        : emptyWorkspacePositionCatalog(),
    [customPositions, enabled, standardLifecycle]
  )

  const addCustomPosition = useCallback(
    async (
      name: string,
      reportsTo: string,
      lifecycleStatus: WorkspaceCustomPosition['lifecycleStatus'] = 'active'
    ) => {
      if (!storageKey) {
        throw new Error('Workspace is not available.')
      }
      const created = await createWorkspaceCustomPosition({
        workspaceId: storageKey,
        name,
        reportsTo,
        createdByUserId: userId,
        existingCustomPositions: customPositions,
        lifecycleStatus,
      })
      setCustomPositions((previous) =>
        [...previous, created].sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
          return a.name.localeCompare(b.name)
        })
      )
      return created
    },
    [customPositions, storageKey, userId]
  )

  const setCustomPositionLifecycleStatus = useCallback(
    async (positionId: string, lifecycleStatus: WorkspaceCustomPosition['lifecycleStatus']) => {
      if (!storageKey) {
        throw new Error('Workspace is not available.')
      }
      const updated = await updateWorkspaceCustomPositionLifecycleStatus({
        workspaceId: storageKey,
        positionId,
        lifecycleStatus,
      })
      setCustomPositions((previous) =>
        previous.map((row) => (row.id === updated.id ? updated : row))
      )
      return updated
    },
    [storageKey]
  )

  const removeCustomPosition = useCallback(
    async (positionId: string, assignedMemberCount = 0, reportingAssetCount = 0) => {
      if (!storageKey) {
        throw new Error('Workspace is not available.')
      }
      await deleteWorkspaceCustomPosition({
        workspaceId: storageKey,
        positionId,
        existingCustomPositions: customPositions,
        assignedMemberCount,
        reportingAssetCount,
      })
      setCustomPositions((previous) => previous.filter((row) => row.id !== positionId))
    },
    [customPositions, storageKey]
  )

  const updateCustomPosition = useCallback(
    async (
      positionId: string,
      input: { name?: string; reportsTo?: string }
    ): Promise<{ position: WorkspaceCustomPosition; renamedFrom: string | null }> => {
      if (!storageKey) {
        throw new Error('Workspace is not available.')
      }
      const accessToken = getAccessToken ? await getAccessToken() : null
      const result = await updateWorkspaceCustomPosition({
        workspaceId: storageKey,
        positionId,
        name: input.name,
        reportsTo: input.reportsTo,
        accessToken,
        existingCustomPositions: customPositions,
      })
      setCustomPositions((previous) => {
        let next = previous.map((row) => (row.id === result.position.id ? result.position : row))
        if (result.renamedFrom) {
          next = next.map((row) =>
            row.reportsTo === result.renamedFrom ? { ...row, reportsTo: result.position.name } : row
          )
        }
        return next.sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
          return a.name.localeCompare(b.name)
        })
      })
      return result
    },
    [customPositions, getAccessToken, storageKey]
  )

  return {
    customPositions,
    catalog,
    isLoading,
    error,
    addCustomPosition,
    setCustomPositionLifecycleStatus,
    removeCustomPosition,
    updateCustomPosition,
    reload: async () => {
      if (!storageKey) return
      const rows = await fetchWorkspaceCustomPositions(storageKey)
      setCustomPositions(rows)
    },
  }
}
