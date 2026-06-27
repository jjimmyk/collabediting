import type {
  Ics215ResourceColumn,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import {
  buildHaveLinkIndex,
  type Ics215HaveLinkLocation,
} from '@/features/ics215/ics215-have-asset-link'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

export type BuildWorkspaceHaveLinkIndexInput = {
  workAssignments: Ics215WorkAssignmentRow[]
  resourceColumns: Ics215ResourceColumn[]
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  exclude?: { rowId: number; columnId: string }
}

export function buildWorkspaceHaveLinkIndex({
  workAssignments,
  resourceColumns,
  workAssignmentTargetOptions,
  exclude,
}: BuildWorkspaceHaveLinkIndexInput): Map<string, Ics215HaveLinkLocation> {
  const resolveAssigneeLabel = (assigneeKey: string) =>
    workAssignmentTargetOptions.find((option) => option.value === assigneeKey)?.label ??
    assigneeKey

  return buildHaveLinkIndex(
    workAssignments,
    resourceColumns,
    resolveAssigneeLabel,
    exclude
  )
}
