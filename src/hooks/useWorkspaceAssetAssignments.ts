import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllHubAssets } from '@/data/hub-asset-catalog'
import type { ResourceListItemData, WorkspaceAssetAssignment } from '@/features/resources/types'
import {
  applyAssignmentsToHubAssets,
  assignmentsRecordFromRows,
  getAssignedAssetsNotOnOrgChart,
} from '@/features/resources/utils'
import {
  assignAssetToWorkspace,
  fetchAllAssetAssignments,
  seedDefaultAssetAssignmentsIfEmpty,
  setAssetIcs204Attachment,
  setAssetOrgChartPlacement,
  syncIcs204ResourceAttachmentsForDocument,
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
  const [assignmentRows, setAssignmentRows] = useState<WorkspaceAssetAssignment[]>([])
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

  const assignmentsByAssetKey = useMemo(
    () => assignmentsRecordFromRows(assignmentRows),
    [assignmentRows]
  )

  const hubAssets = useMemo(
    () => applyAssignmentsToHubAssets(getAllHubAssets(), assignmentRows, workspacesById),
    [assignmentRows, workspacesById]
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
        setAssignmentRows(rows)
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
      const rows = await fetchAllAssetAssignments()
      setAssignmentRows(rows)
    },
    [userId]
  )

  const unassignAssetByKey = useCallback(async (assetKey: string) => {
    await unassignAsset(assetKey)
    setAssignmentRows((previous) => previous.filter((row) => row.assetKey !== assetKey))
  }, [])

  const setOrgChartPlacement = useCallback(async (assetKey: string, reportsTo: string | null) => {
    const sortOrder =
      reportsTo === null
        ? 0
        : hubAssets.filter(
            (asset) => asset.orgChartReportsTo === reportsTo && asset.assetKey !== assetKey
          ).length
    await setAssetOrgChartPlacement(assetKey, reportsTo, sortOrder)
    const rows = await fetchAllAssetAssignments()
    setAssignmentRows(rows)
  }, [hubAssets])

  const getAssetsForWorkspace = useCallback(
    (workspaceId: string | null): ResourceListItemData[] => {
      if (!workspaceId) return []
      return hubAssets.filter((asset) => asset.assignedWorkspaceId === workspaceId)
    },
    [hubAssets]
  )

  const getAssetsForWorkspaceNotOnOrgChart = useCallback(
    (workspaceId: string | null): ResourceListItemData[] => {
      return getAssignedAssetsNotOnOrgChart(getAssetsForWorkspace(workspaceId))
    },
    [getAssetsForWorkspace]
  )

  const setIcs204Attachment = useCallback(async (assetKey: string, documentId: string | null) => {
    await setAssetIcs204Attachment(assetKey, documentId)
    const rows = await fetchAllAssetAssignments()
    setAssignmentRows(rows)
  }, [])

  const syncIcs204AttachmentsForDocument = useCallback(
    async (workspaceId: string, documentId: string, assetKeys: string[]) => {
      await syncIcs204ResourceAttachmentsForDocument(workspaceId, documentId, assetKeys)
      const rows = await fetchAllAssetAssignments()
      setAssignmentRows(rows)
    },
    []
  )

  const refreshAssignments = useCallback(async () => {
    const rows = await fetchAllAssetAssignments()
    setAssignmentRows(rows)
  }, [])

  return {
    hubAssets,
    assignmentRows,
    assignmentsByAssetKey,
    isLoading,
    error,
    assignAsset,
    unassignAsset: unassignAssetByKey,
    setOrgChartPlacement,
    setIcs204Attachment,
    syncIcs204AttachmentsForDocument,
    getAssetsForWorkspace,
    getAssetsForWorkspaceNotOnOrgChart,
    refreshAssignments,
  }
}
