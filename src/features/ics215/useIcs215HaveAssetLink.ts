import { useCallback, useMemo, useState } from 'react'
import type {
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
  Ics215WorkAssignmentsDraft,
} from '@/features/ics215/types'
import {
  applyHaveAssetLink,
  applyManualHaveValue,
  buildHaveAssetLinkIndex,
  clearHaveAssetLink,
  collectLinkedAssetKeysInForm,
  getConflictingHaveAssetKeys,
  partitionHaveLinkAssets,
  removeHaveAssetLinkKeys,
  type Ics215HaveAssetLinkLocation,
} from '@/features/ics215/ics215-have-asset-link'
import {
  EMPTY_RESOURCE_VALUE,
  patchResourceValueInDraft,
} from '@/features/ics215/ics215-work-assignments-table-shared'
import type { ResourceListItemData } from '@/features/resources/types'
import { rankWorkspaceAssetsForResourceQuery } from '@/features/resources/workspace-asset-relevance'
import { matchWorkspaceAssetsViaApi } from '@/lib/match-workspace-assets-service'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { toast } from 'sonner'

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
  onApplyWorkAssignmentsDraft: (draft: Ics215WorkAssignmentsDraft) => void
  onPersistWorkAssignments?: (draft: Ics215WorkAssignmentsDraft) => void
}

export function useIcs215HaveAssetLink({
  workAssignments,
  resourceColumns,
  workspaceAssets,
  workAssignmentTargetOptions = [],
  workspaceId,
  isSupabaseEnabled = false,
  getAccessToken,
  onApplyWorkAssignmentsDraft,
  onPersistWorkAssignments,
}: UseIcs215HaveAssetLinkOptions) {
  const [dialogState, setDialogState] = useState<HaveLinkDialogState>(null)
  const [isRanking, setIsRanking] = useState(false)
  const [suggestedKeys, setSuggestedKeys] = useState<string[]>([])
  const [rankingEngine, setRankingEngine] = useState<'lexical' | 'openai' | undefined>()

  const currentDraft = useMemo(
    (): Ics215WorkAssignmentsDraft => ({ resourceColumns, workAssignments }),
    [resourceColumns, workAssignments]
  )

  const applyAndPersistDraft = useCallback(
    (nextDraft: Ics215WorkAssignmentsDraft, persistMessage?: string) => {
      onApplyWorkAssignmentsDraft(nextDraft)
      onPersistWorkAssignments?.(nextDraft)
      if (persistMessage) {
        toast.success(persistMessage)
      }
    },
    [onApplyWorkAssignmentsDraft, onPersistWorkAssignments]
  )

  const resolveAssigneeLabel = useCallback(
    (assigneeKey: string) =>
      workAssignmentTargetOptions.find((option) => option.value === assigneeKey)?.label ??
      assigneeKey,
    [workAssignmentTargetOptions]
  )

  const linkedAssetLocations = useMemo(() => {
    if (!dialogState) return new Map<string, Ics215HaveAssetLinkLocation>()
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

      const current =
        workAssignments.find((row) => row.id === dialogState.rowId)?.resourceValues[
          dialogState.columnId
        ] ?? EMPTY_RESOURCE_VALUE

      if (selectedKeys.length === 0) {
        const nextDraft = patchResourceValueInDraft(
          currentDraft,
          dialogState.rowId,
          dialogState.columnId,
          clearHaveAssetLink(current)
        )
        applyAndPersistDraft(nextDraft, 'Have link cleared')
        closeHaveLinkDialog()
        return
      }

      const fullIndex = buildHaveAssetLinkIndex(
        workAssignments,
        resourceColumns,
        resolveAssigneeLabel
      )
      const conflicts = getConflictingHaveAssetKeys(selectedKeys, dialogState, fullIndex)
      if (conflicts.length > 0) {
        toast.error('One or more assets are already linked elsewhere', {
          description: 'Unlink them from the other Have cell first, then try again.',
        })
        return
      }

      const nextValue = applyHaveAssetLink(current, selectedKeys, workspaceAssets)
      const nextDraft = patchResourceValueInDraft(
        currentDraft,
        dialogState.rowId,
        dialogState.columnId,
        nextValue
      )
      applyAndPersistDraft(nextDraft, 'Have link saved')
      closeHaveLinkDialog()
    },
    [
      dialogState,
      workAssignments,
      resourceColumns,
      resolveAssigneeLabel,
      currentDraft,
      workspaceAssets,
      closeHaveLinkDialog,
      applyAndPersistDraft,
    ]
  )

  const unlinkAssetFromOtherCell = useCallback(
    (location: Ics215HaveAssetLinkLocation, assetKey: string) => {
      const row = workAssignments.find((entry) => entry.id === location.rowId)
      const current = row?.resourceValues[location.columnId] ?? EMPTY_RESOURCE_VALUE
      const nextValue = removeHaveAssetLinkKeys(current, [assetKey], workspaceAssets)
      const nextDraft = patchResourceValueInDraft(
        currentDraft,
        location.rowId,
        location.columnId,
        nextValue
      )
      applyAndPersistDraft(nextDraft, 'Asset unlinked')
    },
    [workAssignments, currentDraft, workspaceAssets, applyAndPersistDraft]
  )

  const patchManualHave = useCallback(
    (rowId: number, columnId: string, have: string) => {
      const current =
        workAssignments.find((row) => row.id === rowId)?.resourceValues[columnId] ??
        EMPTY_RESOURCE_VALUE
      const nextDraft = patchResourceValueInDraft(
        currentDraft,
        rowId,
        columnId,
        applyManualHaveValue(current, have)
      )
      onApplyWorkAssignmentsDraft(nextDraft)
    },
    [workAssignments, currentDraft, onApplyWorkAssignmentsDraft]
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
    unlinkAssetFromOtherCell,
    patchManualHave,
  }
}
