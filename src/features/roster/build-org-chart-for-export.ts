import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import {
  buildDynamicOrgChart,
  type BuildDynamicOrgChartOptions,
} from '@/features/roster/build-dynamic-org-chart'
import type { WorkspaceOrgChartLayout, WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function buildOrgChartLayoutForExport(
  catalog: WorkspacePositionCatalog,
  orgChartAssets: ResourceListItemData[],
  singleResourceMembers: WorkspaceRosterMember[],
  _scope: OrgChartExportScope,
  options: BuildDynamicOrgChartOptions = {}
): WorkspaceOrgChartLayout {
  return buildDynamicOrgChart(catalog, orgChartAssets, singleResourceMembers, options)
}
