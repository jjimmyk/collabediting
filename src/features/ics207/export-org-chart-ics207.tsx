import { createRoot } from 'react-dom/client'
import { buildIcs207ExportContext, resolveIcs207PreparedByName } from '@/features/ics207/export-layout'
import { downloadIcs207Pdf } from '@/features/ics207/export-download'
import {
  formatIcs207ExportTimestamp,
  ics207ExportFilenameBase,
  type Ics207ExportContext,
  type Ics207ExportPreview,
} from '@/features/ics207/types'
import {
  buildExportOrgChartLayout,
  OrgChartExportCaptureTree,
} from '@/features/roster/OrgChartExportCaptureTree'
import {
  captureOrgChartElement,
  pngBytesToDataUrl,
  waitForOrgChartCaptureReady,
} from '@/features/roster/org-chart-export-capture'
import {
  buildProjectedOrgChartExportData,
  type OrgChartExportScope,
} from '@/features/roster/org-chart-export-scope'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type ExportOrgChartIcs207Input = {
  scope: OrgChartExportScope
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  assets: ResourceListItemData[]
  roster: WorkspaceRosterMember[]
  workspaceLabel: string
  layoutMode: RosterPanelLayoutMode
  glassItemBorderClasses: string
  incidentName: string
  incidentLocation?: string | null
  operationalPeriodFrom?: string | null
  operationalPeriodTo?: string | null
  profileEmail?: string | null
  profileDisplayName?: string | null
  preparedByPositionTitle?: string | null
}

function buildExportContext(input: ExportOrgChartIcs207Input): Ics207ExportContext {
  return buildIcs207ExportContext({
    scope: input.scope,
    incidentName: input.incidentName,
    incidentLocation: input.incidentLocation,
    operationalPeriodFrom: input.operationalPeriodFrom,
    operationalPeriodTo: input.operationalPeriodTo,
    preparedByName: resolveIcs207PreparedByName(input.profileEmail, input.profileDisplayName),
    preparedByPositionTitle: input.preparedByPositionTitle,
  })
}

async function captureProjectedOrgChart(
  input: ExportOrgChartIcs207Input,
  projected: ReturnType<typeof buildProjectedOrgChartExportData>
): Promise<Uint8Array> {
  const orgChartLayout = buildExportOrgChartLayout(
    projected.catalog,
    projected.assets,
    projected.roster,
    input.scope
  )

  const host = document.createElement('div')
  host.setAttribute('data-ics207-export-host', '')
  host.style.cssText =
    'position:fixed;inset:0;z-index:99999;overflow:auto;background:#ffffff;pointer-events:none;opacity:0.01;'
  document.body.appendChild(host)

  const mount = document.createElement('div')
  mount.style.cssText = 'display:inline-block;min-width:max-content;padding:16px;'
  host.appendChild(mount)

  const root = createRoot(mount)

  try {
    root.render(
      <OrgChartExportCaptureTree
        catalog={projected.catalog}
        entries={projected.entries}
        entriesByPosition={projected.entriesByPosition}
        assetsByKey={projected.assetsByKey}
        rosterById={projected.rosterById}
        orgChartLayout={orgChartLayout}
        workspaceLabel={input.workspaceLabel}
        layoutMode={input.layoutMode}
        glassItemBorderClasses={input.glassItemBorderClasses}
      />
    )

    const captureTarget = await waitForOrgChartCaptureReady(mount)
    return captureOrgChartElement(captureTarget)
  } finally {
    root.unmount()
    host.remove()
  }
}

export async function generateIcs207OrgChartPreview(
  input: ExportOrgChartIcs207Input
): Promise<Ics207ExportPreview> {
  const projected = buildProjectedOrgChartExportData({
    catalog: input.catalog,
    entries: input.entries,
    assets: input.assets,
    roster: input.roster,
    scope: input.scope,
  })

  const pngBytes = await captureProjectedOrgChart(input, projected)
  const context = buildExportContext(input)

  return {
    scope: input.scope,
    context,
    pngBytes,
    pngDataUrl: pngBytesToDataUrl(pngBytes),
  }
}

export async function downloadIcs207FromPreview(preview: Ics207ExportPreview): Promise<string> {
  const filename = `${ics207ExportFilenameBase(preview.context)}_${formatIcs207ExportTimestamp()}.pdf`
  await downloadIcs207Pdf(filename, preview.pngBytes, preview.context)
  return filename
}

/** @deprecated Use generateIcs207OrgChartPreview + downloadIcs207FromPreview */
export async function exportOrgChartIcs207Pdf(input: ExportOrgChartIcs207Input): Promise<{
  filename: string
  context: Ics207ExportContext
}> {
  const preview = await generateIcs207OrgChartPreview(input)
  const filename = await downloadIcs207FromPreview(preview)
  return { filename, context: preview.context }
}
