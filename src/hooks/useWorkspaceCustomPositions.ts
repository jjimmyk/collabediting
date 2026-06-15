import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildWorkspacePositionCatalog,
  emptyWorkspacePositionCatalog,
  type WorkspaceCustomPosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import {
  createWorkspaceCustomPosition,
  deleteWorkspaceCustomPosition,
  fetchWorkspaceCustomPositions,
} from '@/lib/workspace-custom-position-service'

type UseWorkspaceCustomPositionsOptions = {
  enabled: boolean
  workspaceId: string | null
  localWorkspaceKey?: string | null
  userId: string | null
}

export function useWorkspaceCustomPositions({
  enabled,
  workspaceId,
  localWorkspaceKey,
  userId,
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
    () => (enabled ? buildWorkspacePositionCatalog(customPositions) : emptyWorkspacePositionCatalog()),
    [customPositions, enabled]
  )

  const addCustomPosition = useCallback(
    async (name: string, reportsTo: string) => {
      if (!storageKey) {
        throw new Error('Workspace is not available.')
      }
      const created = await createWorkspaceCustomPosition({
        workspaceId: storageKey,
        name,
        reportsTo,
        createdByUserId: userId,
        existingCustomPositions: customPositions,
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

  return {
    customPositions,
    catalog,
    isLoading,
    error,
    addCustomPosition,
    removeCustomPosition,
    reload: async () => {
      if (!storageKey) return
      const rows = await fetchWorkspaceCustomPositions(storageKey)
      setCustomPositions(rows)
    },
  }
}
