import { useCallback, useMemo, useState } from 'react'
import type {
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
  Ics215WorkAssignmentsDraft,
} from '@/features/ics215/types'
import {
  applyHaveRosterLink,
  applyManualHaveValue,
  assetKeyToHaveRef,
  buildHaveLinkIndex,
  clearHaveRosterLink,
  collectWorkspaceAssignedHaveRefs,
  filterHaveRefsEligibleForConfirm,
  getConflictingHaveRefs,
  getLinkedHaveRefs,
  partitionHaveLinkRefs,
  removeHaveRosterLinkRefs,
  type Ics215HaveLinkLocation,
} from '@/features/ics215/ics215-have-asset-link'
import {
  buildHaveLinkPositionTree,
  collectNextOpHaveLinkRefsFromTree,
} from '@/features/ics215/build-have-link-position-tree'
import {
  EMPTY_RESOURCE_VALUE,
  patchResourceValueInDraft,
} from '@/features/ics215/ics215-work-assignments-table-shared'
import type { ResourceListItemData } from '@/features/resources/types'
import { rankWorkspaceAssetsForResourceQuery } from '@/features/resources/workspace-asset-relevance'
import { matchWorkspaceAssetsViaApi } from '@/lib/match-workspace-assets-service'
import {
  buildHaveLinkTargetOptions,
  mergeLegacyHaveLinkTargetOptions,
  type WorkAssignmentTargetOption,
} from '@/lib/work-assignment-target-options'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { toast } from 'sonner'

export type HaveLinkDialogState = {
  rowId: number
  columnId: string
  columnLabel: string
  mode: 'create' | 'review'
  workAssignmentContext: string
} | null

type UseIcs215HaveRosterLinkOptions = {
  workAssignments: Ics215WorkAssignmentRow[]
  resourceColumns: Ics215ResourceColumn[]
  workspaceAssets: ResourceListItemData[]
  workAssignmentTargetOptions?: WorkAssignmentTargetOption[]
  roster?: WorkspaceRosterMember[]
  positionRosterEntries?: PositionRosterEntry[]
  assetsByKey?: Record<string, ResourceListItemData>
  showPositionAssets?: boolean
  workspaceId?: string | null
  isSupabaseEnabled?: boolean
  getAccessToken?: () => Promise<string | null>
  onApplyWorkAssignmentsDraft: (draft: Ics215WorkAssignmentsDraft) => void
  onPersistWorkAssignments?: (draft: Ics215WorkAssignmentsDraft) => void
}

export function useIcs215HaveRosterLink({
  workAssignments,
  resourceColumns,
  workspaceAssets,
  workAssignmentTargetOptions = [],
  roster = [],
  positionRosterEntries = [],
  assetsByKey = {},
  showPositionAssets = true,
  workspaceId,
  isSupabaseEnabled = false,
  getAccessToken,
  onApplyWorkAssignmentsDraft,
  onPersistWorkAssignments,
}: UseIcs215HaveRosterLinkOptions) {
  const [dialogState, setDialogState] = useState<HaveLinkDialogState>(null)
  const [isRanking, setIsRanking] = useState(false)
  const [suggestedAssetKeys, setSuggestedAssetKeys] = useState<string[]>([])
  const [rankingEngine, setRankingEngine] = useState<'lexical' | 'openai' | undefined>()

  const currentDraft = useMemo(
    (): Ics215WorkAssignmentsDraft => ({ resourceColumns, workAssignments }),
    [resourceColumns, workAssignments]
  )

  const baseHaveLinkTargetOptions = useMemo(
    () => buildHaveLinkTargetOptions(workAssignmentTargetOptions),
    [workAssignmentTargetOptions]
  )

  const nextOpEligibleRefs = useMemo(() => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: positionRosterEntries,
      roster,
      assetsByKey,
      showPositionAssets,
    })
    return collectNextOpHaveLinkRefsFromTree(tree)
  }, [assetsByKey, positionRosterEntries, roster, showPositionAssets])

  const workspaceAssignedRefs = useMemo(
    () => collectWorkspaceAssignedHaveRefs(workspaceAssets, baseHaveLinkTargetOptions),
    [workspaceAssets, baseHaveLinkTargetOptions]
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

  const dialogRow = dialogState
    ? workAssignments.find((row) => row.id === dialogState.rowId)
    : undefined

  const dialogValue = dialogState
    ? dialogRow?.resourceValues[dialogState.columnId] ?? EMPTY_RESOURCE_VALUE
    : EMPTY_RESOURCE_VALUE

  const linkedRefs = getLinkedHaveRefs(dialogValue)

  const haveLinkTargetOptions = useMemo(
    () =>
      mergeLegacyHaveLinkTargetOptions(baseHaveLinkTargetOptions, linkedRefs, roster, {
        assetsByKey,
      }),
    [baseHaveLinkTargetOptions, linkedRefs, roster, assetsByKey]
  )

  const linkedRefLocations = useMemo(() => {
    if (!dialogState) return new Map<string, Ics215HaveLinkLocation>()
    return buildHaveLinkIndex(
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
      setSuggestedAssetKeys([])
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

      setSuggestedAssetKeys(nextSuggested)
      setRankingEngine(engine)
      setIsRanking(false)
    },
    [workspaceAssets, isSupabaseEnabled, workspaceId, getAccessToken]
  )

  const closeHaveLinkDialog = useCallback(() => {
    setDialogState(null)
    setSuggestedAssetKeys([])
    setRankingEngine(undefined)
    setIsRanking(false)
  }, [])

  const confirmHaveLink = useCallback(
    (selectedRefs: string[]) => {
      if (!dialogState) return

      const current =
        workAssignments.find((row) => row.id === dialogState.rowId)?.resourceValues[
          dialogState.columnId
        ] ?? EMPTY_RESOURCE_VALUE

      if (selectedRefs.length === 0) {
        const nextDraft = patchResourceValueInDraft(
          currentDraft,
          dialogState.rowId,
          dialogState.columnId,
          clearHaveRosterLink(current)
        )
        applyAndPersistDraft(nextDraft, 'Have link cleared')
        closeHaveLinkDialog()
        return
      }

      const fullIndex = buildHaveLinkIndex(
        workAssignments,
        resourceColumns,
        resolveAssigneeLabel
      )
      const conflicts = getConflictingHaveRefs(selectedRefs, dialogState, fullIndex)
      if (conflicts.length > 0) {
        toast.error('One or more roster items are already linked elsewhere', {
          description: 'Unlink them from the other Have cell first, then try again.',
        })
        return
      }

      const { eligibleRefs: eligibleSelectedRefs, strippedRosterOnlyCount } =
        filterHaveRefsEligibleForConfirm(selectedRefs, {
          nextOpEligibleRefs,
          workspaceAssignedRefs,
        })
      if (strippedRosterOnlyCount > 0) {
        toast.info(
          strippedRosterOnlyCount === 1
            ? 'Removed 1 link that is not scheduled for next OP.'
            : `Removed ${strippedRosterOnlyCount} links that are not scheduled for next OP.`
        )
      }

      if (eligibleSelectedRefs.length === 0) {
        const nextDraft = patchResourceValueInDraft(
          currentDraft,
          dialogState.rowId,
          dialogState.columnId,
          clearHaveRosterLink(current)
        )
        applyAndPersistDraft(nextDraft, 'Have link cleared')
        closeHaveLinkDialog()
        return
      }

      const nextValue = applyHaveRosterLink(current, eligibleSelectedRefs, baseHaveLinkTargetOptions)
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
      baseHaveLinkTargetOptions,
      nextOpEligibleRefs,
      workspaceAssignedRefs,
      closeHaveLinkDialog,
      applyAndPersistDraft,
    ]
  )

  const unlinkRefFromOtherCell = useCallback(
    (location: Ics215HaveLinkLocation, ref: string) => {
      const row = workAssignments.find((entry) => entry.id === location.rowId)
      const current = row?.resourceValues[location.columnId] ?? EMPTY_RESOURCE_VALUE
      const nextValue = removeHaveRosterLinkRefs(current, [ref], baseHaveLinkTargetOptions)
      const nextDraft = patchResourceValueInDraft(
        currentDraft,
        location.rowId,
        location.columnId,
        nextValue
      )
      applyAndPersistDraft(nextDraft, 'Roster link removed')
    },
    [workAssignments, currentDraft, baseHaveLinkTargetOptions, applyAndPersistDraft]
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

  const { staleRefs } = partitionHaveLinkRefs(
    haveLinkTargetOptions,
    linkedRefs,
    nextOpEligibleRefs,
    workspaceAssignedRefs
  )

  const suggestedRefs = useMemo(
    () =>
      suggestedAssetKeys.map((assetKey) =>
        assetKeyToHaveRef(assetKey, baseHaveLinkTargetOptions)
      ),
    [suggestedAssetKeys, baseHaveLinkTargetOptions]
  )

  return {
    dialogState,
    dialogOpen: dialogState !== null,
    isRanking,
    suggestedRefs,
    suggestedAssetKeys,
    rankingEngine,
    dialogInitialSelectedRefs: linkedRefs,
    staleLinkedRefs: staleRefs,
    haveLinkTargetOptions,
    linkedRefLocations,
    openHaveLinkDialog,
    closeHaveLinkDialog,
    confirmHaveLink,
    unlinkRefFromOtherCell,
    patchManualHave,
  }
}

/** @deprecated Use useIcs215HaveRosterLink */
export const useIcs215HaveAssetLink = useIcs215HaveRosterLink

export type Ics215HaveAssetLinkLocation = Ics215HaveLinkLocation
