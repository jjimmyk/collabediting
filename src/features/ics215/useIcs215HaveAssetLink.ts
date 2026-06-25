import { useCallback, useMemo, useState } from 'react'
import type { Ics215ResourceColumn, Ics215ResourceValue, Ics215WorkAssignmentRow } from '@/features/ics215/types'
import {
  applyHaveAssetLink,
  applyManualHaveValue,
  buildHaveAssetLinkIndex,
  collectLinkedAssetKeysInForm,
  getConflictingHaveAssetKeys,
  isHaveLinkedToAssets,
  partitionHaveLinkAssets,
} from '@/features/ics215/ics215-have-asset-link'
import type { ResourceListItemData } from '@/features/resources/types'
import { rankWorkspaceAssetsForResourceQuery } from '@/features/resources/workspace-asset-relevance'
import { matchWorkspaceAssetsViaApi } from '@/lib/match-workspace-assets-service'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { toast } from 'sonner'
import { EMPTY_RESOURCE_VALUE } from '@/features/ics215/ics215-work-assignments-table-shared'

export type HaveLinkDialogState = {
  rowId: number
  columnId: string
  columnLabel: string
  mode: 'create' | 'review'
  workAssignmentContext: string
} | null

type UseIcs215HaveAssetLinkOptions = {
  workAssignments: Ics215WorkAssignmentRow[]
  resourceColumns: Ics215ResourceColumn[]
  workspaceAssets: ResourceListItemData[]
  workAssignmentTargetOptions?: WorkAssignmentTargetOption[]
  workspaceId?: string | null
  isSupabaseEnabled?: boolean
  getAccessToken?: () => Promise<string | null>
  patchResourceValue: (rowId: number, columnId: string, value: Ics215ResourceValue) => void
}

export function useIcs215HaveAssetLink({
  workAssignments,
  resourceColumns,
  workspaceAssets,
  workAssignmentTargetOptions = [],
  workspaceId,
  isSupabaseEnabled = false,
  getAccessToken,
  patchResourceValue,
}: UseIcs215HaveAssetLinkOptions) {
  const [dialogState, setDialogState] = useState<HaveLinkDialogState>(null)
  const [isRanking, setIsRanking] = useState(false)
  const [suggestedKeys, setSuggestedKeys] = useState<string[]>([])
  const [rankingEngine, setRankingEngine] = useState<'lexical' | 'openai' | undefined>()

  const resolveAssigneeLabel = useCallback(
    (assigneeKey: string) =>
      workAssignmentTargetOptions.find((option) => option.value === assigneeKey)?.label ??
      assigneeKey,
    [workAssignmentTargetOptions]
  )

  const linkedAssetLocations = useMemo(() => {
    if (!dialogState) return new Map()
    return buildHaveAssetLinkIndex(
      workAssignments,
      resourceColumns,
      resolveAssigneeLabel,
      { rowId: dialogState.rowId, columnId: dialogState.columnId }
    )
  }, [dialogState, workAssignments, resourceColumns, resolveAssigneeLabel])

  const openHaveLinkDialog = useCallback(
    async (params: {
      rowId: number
      columnId: string
      columnLabel: string
      mode: 'create' | 'review'
      workAssignmentContext: string
    }) => {
      setDialogState(params)
      setSuggestedKeys([])
      setRankingEngine(undefined)
      setIsRanking(true)

      const localRanked = rankWorkspaceAssetsForResourceQuery(workspaceAssets, params.columnLabel)
      let nextSuggested = localRanked.suggested.map((entry) => entry.asset.assetKey)
      let engine: 'lexical' | 'openai' | undefined = 'lexical'

      if (isSupabaseEnabled && workspaceId && getAccessToken) {
        try {
          const accessToken = await getAccessToken()
          if (accessToken) {
            const apiResult = await matchWorkspaceAssetsViaApi({
              accessToken,
              workspaceId,
              query: params.columnLabel,
              assets: workspaceAssets,
            })
            if (apiResult.suggestedKeys.length > 0) {
              nextSuggested = apiResult.suggestedKeys
              engine = apiResult.engine
            }
          }
        } catch {
          // fallback to local rank already computed
        }
      }

      setSuggestedKeys(nextSuggested)
      setRankingEngine(engine)
      setIsRanking(false)
    },
    [workspaceAssets, isSupabaseEnabled, workspaceId, getAccessToken]
  )

  const closeHaveLinkDialog = useCallback(() => {
    setDialogState(null)
    setSuggestedKeys([])
    setRankingEngine(undefined)
    setIsRanking(false)
  }, [])

  const confirmHaveLink = useCallback(
    (selectedKeys: string[]) => {
      if (!dialogState) return

      const fullIndex = buildHaveAssetLinkIndex(
        workAssignments,
        resourceColumns,
        resolveAssigneeLabel
      )
      const conflicts = getConflictingHaveAssetKeys(selectedKeys, dialogState, fullIndex)
      if (conflicts.length > 0) {
        toast.error('One or more assets are already linked elsewhere', {
          description: 'Each asset can only be assigned to one Have cell.',
        })
        return
      }

      const current =
        workAssignments.find((row) => row.id === dialogState.rowId)?.resourceValues[
          dialogState.columnId
        ] ?? EMPTY_RESOURCE_VALUE

      patchResourceValue(
        dialogState.rowId,
        dialogState.columnId,
        applyHaveAssetLink(current, selectedKeys, workspaceAssets)
      )
      closeHaveLinkDialog()
    },
    [
      dialogState,
      workAssignments,
      resourceColumns,
      resolveAssigneeLabel,
      patchResourceValue,
      workspaceAssets,
      closeHaveLinkDialog,
    ]
  )

  const patchManualHave = useCallback(
    (rowId: number, columnId: string, have: string) => {
      const current =
        workAssignments.find((row) => row.id === rowId)?.resourceValues[columnId] ??
        EMPTY_RESOURCE_VALUE
      patchResourceValue(rowId, columnId, applyManualHaveValue(current, have))
    },
    [workAssignments, patchResourceValue]
  )

  const previewColumnMatches = useCallback(
    (columnLabel: string) => {
      const ranked = rankWorkspaceAssetsForResourceQuery(workspaceAssets, columnLabel)
      const column = resourceColumns.find((entry) => entry.label === columnLabel)
      const emptyRows = column
        ? workAssignments.filter((row) => {
            const value = row.resourceValues[column.id]
            return !value || (value.have.trim().length === 0 && !isHaveLinkedToAssets(value))
          }).length
        : 0

      toast.info(`Suggested matches for “${columnLabel}”`, {
        description: `${ranked.suggested.length} likely asset${
          ranked.suggested.length === 1 ? '' : 's'
        } · ${emptyRows} empty Have cell${emptyRows === 1 ? '' : 's'}. Use sparkle in each Have cell to link.`,
      })
    },
    [workspaceAssets, workAssignments, resourceColumns]
  )

  const dialogRow = dialogState
    ? workAssignments.find((row) => row.id === dialogState.rowId)
    : undefined

  const dialogValue = dialogState
    ? dialogRow?.resourceValues[dialogState.columnId] ?? EMPTY_RESOURCE_VALUE
    : EMPTY_RESOURCE_VALUE

  const linkedKeys = dialogValue.linkedAssetKeys ?? []
  const { staleKeys } = partitionHaveLinkAssets(workspaceAssets, linkedKeys)

  const linkedElsewhereCounts = useMemo(() => {
    if (!dialogState) return {}
    return collectLinkedAssetKeysInForm(workAssignments, {
      rowId: dialogState.rowId,
      columnId: dialogState.columnId,
    })
  }, [dialogState, workAssignments])

  return {
    dialogState,
    dialogOpen: dialogState !== null,
    isRanking,
    suggestedKeys,
    rankingEngine,
    dialogInitialSelectedKeys: linkedKeys,
    staleLinkedKeys: staleKeys,
    linkedAssetLocations,
    linkedElsewhereCounts,
    openHaveLinkDialog,
    closeHaveLinkDialog,
    confirmHaveLink,
    patchManualHave,
    previewColumnMatches,
  }
}
