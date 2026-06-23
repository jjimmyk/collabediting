import { useMemo } from 'react'
import {
  buildExportOrgChartLayout,
  OrgChartExportCaptureTree,
} from '@/features/roster/OrgChartExportCaptureTree'
import { buildProjectedOrgChartExportData } from '@/features/roster/org-chart-export-scope'
import type { ExportOrgChartIcs207Input } from '@/features/ics207/export-org-chart-ics207'

type Ics207PreviewOrgChartPanelProps = {
  exportInput: ExportOrgChartIcs207Input
}

export function Ics207PreviewOrgChartPanel({ exportInput }: Ics207PreviewOrgChartPanelProps) {
  const projected = useMemo(
    () =>
      buildProjectedOrgChartExportData({
        catalog: exportInput.catalog,
        entries: exportInput.entries,
        assets: exportInput.assets,
        roster: exportInput.roster,
        scope: exportInput.scope,
      }),
    [
      exportInput.assets,
      exportInput.catalog,
      exportInput.entries,
      exportInput.roster,
      exportInput.scope,
    ]
  )

  const orgChartLayout = useMemo(
    () =>
      buildExportOrgChartLayout(
        projected.catalog,
        projected.assets,
        projected.roster,
        exportInput.scope
      ),
    [exportInput.scope, projected.assets, projected.catalog, projected.roster]
  )

  return (
    <OrgChartExportCaptureTree
      catalog={projected.catalog}
      entries={projected.entries}
      entriesByPosition={projected.entriesByPosition}
      assetsByKey={projected.assetsByKey}
      rosterById={projected.rosterById}
      orgChartLayout={orgChartLayout}
      workspaceLabel={exportInput.workspaceLabel}
      layoutMode={exportInput.visualSnapshot.layoutMode}
      glassItemBorderClasses={exportInput.glassItemBorderClasses}
      visualSnapshot={exportInput.visualSnapshot}
    />
  )
}
