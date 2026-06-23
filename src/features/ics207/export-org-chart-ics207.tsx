import { downloadIcs207Pdf } from '@/features/ics207/export-download'
import type { Ics207ExportContext, Ics207ExportPreview } from '@/features/ics207/types'
import {
  formatIcs207ExportTimestamp,
  ics207ExportFilenameBase,
} from '@/features/ics207/types'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics207OrgChartVisualSnapshot = {
  zoom: number
  displayFilters: RosterDisplayFilters
  layoutMode: RosterPanelLayoutMode
  scrollLeft: number
  scrollTop: number
}

export type ExportOrgChartIcs207Input = {
  scope: OrgChartExportScope
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  assets: ResourceListItemData[]
  roster: WorkspaceRosterMember[]
  workspaceLabel: string
  layoutMode: RosterPanelLayoutMode
  glassItemBorderClasses: string
  visualSnapshot: Ics207OrgChartVisualSnapshot
  incidentName: string
  incidentLocation?: string | null
  operationalPeriodFrom?: string | null
  operationalPeriodTo?: string | null
  profileEmail?: string | null
  profileDisplayName?: string | null
  preparedByPositionTitle?: string | null
}

export type ExportOrgChartIcs207BaseInput = Omit<ExportOrgChartIcs207Input, 'scope'>

export async function downloadIcs207FromPreview(preview: Ics207ExportPreview): Promise<string> {
  return downloadIcs207FromCapture({
    context: preview.context,
    pngBytes: preview.pngBytes,
  })
}

export async function downloadIcs207FromCapture(input: {
  context: Ics207ExportContext
  pngBytes: Uint8Array
}): Promise<string> {
  const filename = `${ics207ExportFilenameBase(input.context)}_${formatIcs207ExportTimestamp()}.pdf`
  await downloadIcs207Pdf(filename, input.pngBytes, input.context)
  return filename
}
