import { createRoot } from 'react-dom/client'
import { buildIcs207ExportContext, resolveIcs207PreparedByName } from '@/features/ics207/export-layout'
import { downloadIcs207Pdf } from '@/features/ics207/export-download'
import {
  formatIcs207ExportTimestamp,
  ics207ExportFilenameBase,
  type Ics207ExportContext,
} from '@/features/ics207/types'
import {
  captureOrgChartImage,
  waitForOrgChartLayoutSettle,
} from '@/features/roster/capture-org-chart-image'
import {
  buildProjectedOrgChartExportData,
  type OrgChartExportScope,
} from '@/features/roster/org-chart-export-scope'
import {
  buildExportOrgChartLayout,
  OrgChartExportCaptureTree,
} from '@/features/roster/OrgChartExportCaptureTree'
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
  incidentName: string
  incidentLocation?: string | null
  operationalPeriodFrom?: string | null
  operationalPeriodTo?: string | null
  profileEmail?: string | null
  profileDisplayName?: string | null
  preparedByPositionTitle?: string | null
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

  const container = document.createElement('div')
  container.setAttribute('data-ics207-export-host', '')
  container.style.cssText =
    'position:fixed;left:-100000px;top:0;z-index:-1;pointer-events:none;opacity:1'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    const element = await new Promise<HTMLElement>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Org chart capture timed out'))
      }, 15000)

      root.render(
        <OrgChartExportCaptureTree
          scope={input.scope}
          catalog={projected.catalog}
          entries={projected.entries}
          entriesByPosition={projected.entriesByPosition}
          assetsByKey={projected.assetsByKey}
          rosterById={projected.rosterById}
          orgChartLayout={orgChartLayout}
          workspaceLabel={input.workspaceLabel}
          layoutMode={input.layoutMode}
          onReady={(el) => {
            window.clearTimeout(timeout)
            resolve(el)
          }}
        />
      )
    })

    await waitForOrgChartLayoutSettle()
    return captureOrgChartImage({ root: element, backgroundColor: '#ffffff', pixelRatio: 2 })
  } finally {
    root.unmount()
    container.remove()
  }
}

export async function exportOrgChartIcs207Pdf(input: ExportOrgChartIcs207Input): Promise<{
  filename: string
  context: Ics207ExportContext
}> {
  const projected = buildProjectedOrgChartExportData({
    catalog: input.catalog,
    entries: input.entries,
    assets: input.assets,
    roster: input.roster,
    scope: input.scope,
  })

  const chartPng = await captureProjectedOrgChart(input, projected)
  const context = buildIcs207ExportContext({
    scope: input.scope,
    incidentName: input.incidentName,
    incidentLocation: input.incidentLocation,
    operationalPeriodFrom: input.operationalPeriodFrom,
    operationalPeriodTo: input.operationalPeriodTo,
    preparedByName: resolveIcs207PreparedByName(input.profileEmail, input.profileDisplayName),
    preparedByPositionTitle: input.preparedByPositionTitle,
  })

  const filename = `${ics207ExportFilenameBase(context)}_${formatIcs207ExportTimestamp()}.pdf`
  await downloadIcs207Pdf(filename, chartPng, context)
  return { filename, context }
}
