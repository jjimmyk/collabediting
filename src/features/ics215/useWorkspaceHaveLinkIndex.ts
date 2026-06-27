import { useMemo } from 'react'
import type {
  Ics215ResourceColumn,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import { buildWorkspaceHaveLinkIndex } from '@/features/ics215/build-workspace-have-link-index'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

type UseWorkspaceHaveLinkIndexOptions = {
  workAssignments: Ics215WorkAssignmentRow[]
  resourceColumns: Ics215ResourceColumn[]
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  exclude?: { rowId: number; columnId: string }
}

export function useWorkspaceHaveLinkIndex({
  workAssignments,
  resourceColumns,
  workAssignmentTargetOptions,
  exclude,
}: UseWorkspaceHaveLinkIndexOptions) {
  return useMemo(
    () =>
      buildWorkspaceHaveLinkIndex({
        workAssignments,
        resourceColumns,
        workAssignmentTargetOptions,
        exclude,
      }),
    [workAssignments, resourceColumns, workAssignmentTargetOptions, exclude?.rowId, exclude?.columnId]
  )
}
