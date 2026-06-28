import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  buildNeedCellContext,
  buildNeedLinkIndex,
  formatNeedLinkLocation,
  getConflictingNeedRequestIds,
  isNeedLinkedToAssetRequest,
} from '@/features/ics215/ics215-need-asset-request-link'
import type { Ics215NeedCellContext } from '@/features/ics215/ics215-need-asset-request-link'
import type {
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

type OpenNeedAssetRequestParams = {
  row: Ics215WorkAssignmentRow
  columnId: string
  columnLabel: string
  value: Ics215ResourceValue
}

export function useIcs215NeedAssetRequestLink({
  workAssignments,
  resourceColumns,
  workAssignmentTargetOptions,
  onOpenCreateAssetRequest,
  onOpenExistingAssetRequest,
}: {
  workAssignments: Ics215WorkAssignmentRow[]
  resourceColumns: Ics215ResourceColumn[]
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  onOpenCreateAssetRequest: (context: Ics215NeedCellContext) => void
  onOpenExistingAssetRequest: (storageRecordId: string) => void
}) {
  const resolveAssigneeLabel = useCallback(
    (assigneeKey: string) =>
      workAssignmentTargetOptions.find((option) => option.value === assigneeKey)?.label ??
      assigneeKey,
    [workAssignmentTargetOptions]
  )

  const needLinkIndex = useMemo(
    () => buildNeedLinkIndex(workAssignments, resourceColumns, resolveAssigneeLabel),
    [resourceColumns, resolveAssigneeLabel, workAssignments]
  )

  const openNeedAssetRequest = useCallback(
    ({ row, columnId, columnLabel, value }: OpenNeedAssetRequestParams) => {
      const storageRecordId = value.linkedNeedAssetRequest?.assetRequestStorageRecordId?.trim()
      if (isNeedLinkedToAssetRequest(value) && storageRecordId) {
        onOpenExistingAssetRequest(storageRecordId)
        return
      }

      const assigneeLabel = resolveAssigneeLabel(row.assignee)
      const context = buildNeedCellContext(row, columnId, columnLabel, assigneeLabel, value)
      onOpenCreateAssetRequest(context)
    },
    [onOpenCreateAssetRequest, onOpenExistingAssetRequest, resolveAssigneeLabel]
  )

  const assertNoNeedLinkConflict = useCallback(
    (storageRecordId: string, rowId: number, columnId: string): boolean => {
      const conflicts = getConflictingNeedRequestIds(storageRecordId, { rowId, columnId }, needLinkIndex)
      if (conflicts.length === 0) return true
      toast.error(
        `That asset request is already linked to ${formatNeedLinkLocation(conflicts[0]!)}.`
      )
      return false
    },
    [needLinkIndex]
  )

  return {
    openNeedAssetRequest,
    assertNoNeedLinkConflict,
    needLinkIndex,
  }
}
