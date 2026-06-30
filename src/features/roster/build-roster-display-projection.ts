import { buildDynamicOrgChart } from '@/features/roster/build-dynamic-org-chart'
import { buildOrgChartLayoutForExport } from '@/features/roster/build-org-chart-for-export'
import {
  buildProjectedOrgChartExportData,
  type OrgChartExportScope,
} from '@/features/roster/org-chart-export-scope'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceOrgChartLayout, WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type RosterDisplayProjection = {
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  entriesByPosition: Record<string, PositionRosterEntry>
  roster: WorkspaceRosterMember[]
  rosterById: Record<string, WorkspaceRosterMember>
  assets: ResourceListItemData[]
  assetsByKey: Record<string, ResourceListItemData>
  orgChartLayout: WorkspaceOrgChartLayout
  isProjected: boolean
  horizon: OrgChartExportScope
}

export function buildRosterDisplayProjection(input: {
  horizon: OrgChartExportScope
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  roster: WorkspaceRosterMember[]
  assets: ResourceListItemData[]
  templateSlug?: string
}): RosterDisplayProjection {
  const orgChartOptions = { templateSlug: input.templateSlug }

  if (input.horizon === 'next_op') {
    const projected = buildProjectedOrgChartExportData({
      catalog: input.catalog,
      entries: input.entries,
      assets: input.assets,
      roster: input.roster,
      scope: 'next_op',
    })

    return {
      catalog: projected.catalog,
      entries: projected.entries,
      entriesByPosition: projected.entriesByPosition,
      roster: projected.roster,
      rosterById: projected.rosterById,
      assets: projected.assets,
      assetsByKey: projected.assetsByKey,
      orgChartLayout: buildOrgChartLayoutForExport(
        projected.catalog,
        projected.assets,
        projected.roster,
        'next_op',
        orgChartOptions
      ),
      isProjected: true,
      horizon: 'next_op',
    }
  }

  const entriesByPosition = Object.fromEntries(
    input.entries.map((entry) => [entry.position, entry])
  )

  return {
    catalog: input.catalog,
    entries: input.entries,
    entriesByPosition,
    roster: input.roster,
    rosterById: Object.fromEntries(input.roster.map((member) => [member.id, member])),
    assets: input.assets,
    assetsByKey: Object.fromEntries(input.assets.map((asset) => [asset.assetKey, asset])),
    orgChartLayout: buildDynamicOrgChart(
      input.catalog,
      input.assets,
      input.roster,
      orgChartOptions
    ),
    isProjected: false,
    horizon: 'current_op',
  }
}
