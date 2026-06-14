import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllHubAssets } from '@/data/hub-asset-catalog'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  applyAssignmentsToHubAssets,
  assignmentsRecordFromRows,
} from '@/features/resources/utils'
import {
  assignAssetToWorkspace,
  fetchAllAssetAssignments,
  seedDefaultAssetAssignmentsIfEmpty,
  unassignAsset,
} from '@/lib/workspace-asset-service'
import type { AccessibleWorkspace } from '@/lib/workspace-types'

type UseWorkspaceAssetAssignmentsOptions = {
  enabled: boolean
  accessibleWorkspaces: AccessibleWorkspace[]
  userId: string | null
}

export function useWorkspaceAssetAssignments({
  enabled,
  accessibleWorkspaces,
  userId,
}: UseWorkspaceAssetAssignmentsOptions) {
  const [assignmentsByAssetKey, setAssignmentsByAssetKey] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workspacesById = useMemo(
    () => Object.fromEntries(accessibleWorkspaces.map((workspace) => [workspace.workspaceId, workspace])),
    [accessibleWorkspaces]
  )

  const workspaceIdByName = useMemo(
    () => Object.fromEntries(accessibleWorkspaces.map((workspace) => [workspace.name, workspace.workspaceId])),
    [accessibleWorkspaces]
  )

  const hubAssets = useMemo(
    () =>
      applyAssignmentsToHubAssets(getAllHubAssets(), assignmentsByAssetKey, workspacesById),
    [assignmentsByAssetKey, workspacesById]
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const rows = await seedDefaultAssetAssignmentsIfEmpty(workspaceIdByName)
        if (cancelled) return
        setAssignmentsByAssetKey(assignmentsRecordFromRows(rows))
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load asset assignments.')
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
  }, [enabled, workspaceIdByName])

  const assignAsset = useCallback(
    async (assetKey: string, workspaceId: string) => {
      await assignAssetToWorkspace(assetKey, workspaceId, userId)
      setAssignmentsByAssetKey((previous) => ({ ...previous, [assetKey]: workspaceId }))
    },
    [userId]
  )

  const unassignAssetByKey = useCallback(async (assetKey: string) => {
    await unassignAsset(assetKey)
    setAssignmentsByAssetKey((previous) => {
      const next = { ...previous }
      delete next[assetKey]
      return next
    })
  }, [])

  const getAssetsForWorkspace = useCallback(
    (workspaceId: string | null): ResourceListItemData[] => {
      if (!workspaceId) return []
      return hubAssets.filter((asset) => asset.assignedWorkspaceId === workspaceId)
    },
    [hubAssets]
  )

  const refreshAssignments = useCallback(async () => {
    const rows = await fetchAllAssetAssignments()
    setAssignmentsByAssetKey(assignmentsRecordFromRows(rows))
  }, [])

  return {
    hubAssets,
    assignmentsByAssetKey,
    isLoading,
    error,
    assignAsset,
    unassignAsset: unassignAssetByKey,
    getAssetsForWorkspace,
    refreshAssignments,
  }
}
