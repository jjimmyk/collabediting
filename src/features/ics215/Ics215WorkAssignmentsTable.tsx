import type { Ics215WorkAssignmentsLayoutMode } from '@/features/ics215/types'
import { Ics215WorkAssignmentsLegacyTable } from '@/features/ics215/Ics215WorkAssignmentsLegacyTable'
import { Ics215WorkAssignmentsSpreadsheetTable } from '@/features/ics215/Ics215WorkAssignmentsSpreadsheetTable'
import type { Ics215WorkAssignmentsTableBaseProps } from '@/features/ics215/ics215-work-assignments-table-shared'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { normalizeIcs215WorkAssignmentsLayoutMode } from '@/features/ics215/utils'

import type { HaveLinkRosterPanelRenderer } from '@/features/roster/WorkspaceRosterPanel'
import type { HaveLinkRosterWorkspaceControls } from '@/features/roster/WorkspaceRosterToolbar'

type Ics215WorkAssignmentsTableProps = Ics215WorkAssignmentsTableBaseProps & {
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  roster?: WorkspaceRosterMember[]
  positionRosterEntries?: PositionRosterEntry[]
  competencyOptions?: string[]
  layoutMode?: Ics215WorkAssignmentsLayoutMode
  renderHaveLinkRosterPanel?: HaveLinkRosterPanelRenderer
  haveLinkRosterWorkspaceControls?: HaveLinkRosterWorkspaceControls
}

export function Ics215WorkAssignmentsTable({
  layoutMode = 'spreadsheet',
  ...props
}: Ics215WorkAssignmentsTableProps) {
  const normalizedLayout = normalizeIcs215WorkAssignmentsLayoutMode(layoutMode)

  if (normalizedLayout === 'legacy') {
    return <Ics215WorkAssignmentsLegacyTable {...props} />
  }

  return <Ics215WorkAssignmentsSpreadsheetTable {...props} />
}
